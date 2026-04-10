import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

// 强制动态渲染
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 阿里云百炼 API 配置
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
const DASHSCOPE_BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';

// 默认模型
const DEFAULT_MODEL = 'qwen-turbo';

// System Prompt for Frank
const SYSTEM_PROMPT = `You are Frank, an AI procurement assistant at SourcePilot.

Your opening line (use exactly):
"Hi boss? This is Frank, your sourcepilot today. How can I help?
I can speak : English, Español, Français, Русский, Afrikaans, عربي"

Your role:
- Help users clarify their procurement needs
- Collect key information: product name, usage, specifications, quantity, price, delivery time, certifications
- Be friendly and casual, allow some small talk but gently guide back to procurement
- Speak in the user's language (auto-detect from their messages)

Guidelines:
- Keep replies under 150 words
- Summarize what you've learned so far
- Ask for missing key information
- When enough info is collected (8-10 conditions), ask if they want the report
- Never provide legal, financial, or medical advice
- Don't write code, poems, or translations unrelated to procurement`;

// 获取或创建会话
async function getOrCreateConversation(sessionId: string, userId?: string) {
  // 先查询现有会话
  const { data: existing } = await supabase
    .from('chat_conversations')
    .select('*')
    .eq('session_id', sessionId)
    .single();

  if (existing) {
    return existing;
  }

  // 创建新会话
  const { data: newConv, error } = await supabase
    .from('chat_conversations')
    .insert({
      session_id: sessionId,
      user_id: userId,
      phase: 1,
      status: 'active',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }

  return newConv;
}

// 保存消息
async function saveMessage(conversationId: string, role: string, content: string, metadata: object = {}) {
  const { error } = await supabase
    .from('chat_messages')
    .insert({
      conversation_id: conversationId,
      role,
      content,
      metadata,
    });

  if (error) {
    console.error('Error saving message:', error);
  }
}

// 获取对话历史
async function getConversationHistory(conversationId: string, limit: number = 20) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching history:', error);
    return [];
  }

  return data || [];
}

export async function POST(request: NextRequest) {
  try {
    // 检查 API Key
    if (!DASHSCOPE_API_KEY) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      );
    }

    // 解析请求体
    const body = await request.json();
    const { messages, sessionId, userId, stream = false } = body;

    // 验证请求
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      );
    }

    // 生成或获取会话 ID
    const convSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 获取或创建对话记录
    const conversation = await getOrCreateConversation(convSessionId, userId);

    // 获取最近的对话历史（用于上下文）
    const history = await getConversationHistory(conversation.id, 10);
    
    // 构建消息列表（系统提示 + 历史 + 新消息）
    const messageList = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map((h: any) => ({ role: h.role, content: h.content })),
      ...messages.filter((m: any) => m.role === 'user'),
    ];

    // 保存用户消息
    const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop();
    if (lastUserMessage) {
      await saveMessage(conversation.id, 'user', lastUserMessage.content);
    }

    // 调用阿里云百炼 API
    const response = await fetch(`${DASHSCOPE_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: messageList,
        stream,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('DashScope API error:', errorData);
      return NextResponse.json(
        { error: 'AI service error', details: errorData },
        { status: response.status }
      );
    }

    // 处理流式响应
    if (stream) {
      // 对于流式响应，需要在客户端处理完成后保存
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Session-Id': convSessionId,
          'X-Conversation-Id': conversation.id,
        },
      });
    }

    // 处理普通响应
    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content;

    // 保存 AI 回复
    if (assistantMessage) {
      await saveMessage(conversation.id, 'assistant', assistantMessage, {
        model: DEFAULT_MODEL,
        tokens: data.usage,
      });
    }

    // 返回响应（包含会话 ID）
    return NextResponse.json({
      ...data,
      sessionId: convSessionId,
      conversationId: conversation.id,
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 获取对话历史
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const { data: conversation } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (!conversation) {
      return NextResponse.json({ messages: [], conversation: null });
    }

    const { data: messages } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });

    return NextResponse.json({
      messages: messages || [],
      conversation,
    });

  } catch (error) {
    console.error('Error fetching history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}
