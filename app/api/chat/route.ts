import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient as createServiceClient } from '@supabase/supabase-js';

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

Language Rule (MOST IMPORTANT):
- Detect the language of user's message automatically
- Reply in the SAME language as the user
- If you cannot determine the language, reply in English
- Supported languages: English, 中文, Español, Français, Русский, Afrikaans, عربي, 日本語, 한국어

Your role:
- Help users clarify their procurement needs
- Collect key information: product name, usage, specifications, quantity, price, delivery time, certifications
- Be friendly and casual, allow some small talk but gently guide back to procurement
- Introduce yourself briefly on first interaction (but be natural, not scripted)

Guidelines:
- Keep replies under 150 words
- Summarize what you've learned so far
- Ask for missing key information
- When enough info is collected (8-10 conditions), ask if they want the report
- Never provide legal, financial, or medical advice
- Don't write code, poems, or translations unrelated to procurement`;

// 生成对话标题
function generateTitle(content: string): string {
  const cleanContent = content.replace(/\\n/g, ' ').trim();
  if (cleanContent.length <= 30) return cleanContent;
  return cleanContent.substring(0, 30) + '...';
}

// 创建数据库客户端（Service Role Key - 绕过 RLS）
function createDbClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey || anonKey
  );
}

// 创建认证客户端（从 cookie 获取用户）
async function getUserFromRequest(request: NextRequest) {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // 不设置 cookie
        },
        remove(name: string, options: CookieOptions) {
          // 不删除 cookie
        },
      },
    }
  );
  
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function POST(request: NextRequest) {
  try {
    if (!DASHSCOPE_API_KEY) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      );
    }

    // 获取当前登录用户
    const user = await getUserFromRequest(request);
    const userId = user?.id;

    // 解析请求体
    const body = await request.json();
    const { messages, sessionId, stream = false } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      );
    }

    // 创建数据库客户端（绕过 RLS）
    const db = createDbClient();

    // 生成或获取会话 ID
    const convSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 查找现有会话
    const { data: existingConv } = await db
      .from('chat_conversations')
      .select('*')
      .eq('session_id', convSessionId)
      .single();

    let conversationId: string;
    let conversationTitle: string | null = null;

    if (existingConv) {
      conversationId = existingConv.id;
      conversationTitle = existingConv.title;
      
      // 如果会话存在但没有 user_id，且现在用户已登录，则更新 user_id
      if (!existingConv.user_id && userId) {
        await db
          .from('chat_conversations')
          .update({ user_id: userId })
          .eq('id', conversationId);
      }
    } else {
      // 获取第一条用户消息作为标题
      const firstUserMessage = messages.find((m: any) => m.role === 'user');
      const title = firstUserMessage ? generateTitle(firstUserMessage.content) : 'New Chat';
      
      // 创建新会话
      const { data: newConv, error: createError } = await db
        .from('chat_conversations')
        .insert({
          session_id: convSessionId,
          user_id: userId || null,
          title: title,
          phase: 1,
          status: 'active',
        })
        .select()
        .single();

      if (createError || !newConv) {
        console.error('Error creating conversation:', createError);
        return NextResponse.json(
          { error: 'Failed to create conversation', details: createError?.message },
          { status: 500 }
        );
      }
      
      conversationId = newConv.id;
      conversationTitle = title;
    }

    // 获取最近的对话历史
    const { data: history } = await db
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(10);
    
    // 构建消息列表
    const messageList = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...(history || []).map((h: any) => ({ role: h.role, content: h.content })),
      ...messages.filter((m: any) => m.role === 'user'),
    ];

    // 保存用户消息
    const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop();
    if (lastUserMessage) {
      await db.from('chat_messages').insert({
        conversation_id: conversationId,
        role: 'user',
        content: lastUserMessage.content,
        metadata: {},
      });
      
      // 更新对话的 updated_at
      await db
        .from('chat_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
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

    if (stream) {
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Session-Id': convSessionId,
          'X-Conversation-Id': conversationId,
        },
      });
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content;

    if (assistantMessage) {
      await db.from('chat_messages').insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: assistantMessage,
        metadata: { model: DEFAULT_MODEL, tokens: data.usage },
      });
    }

    return NextResponse.json({
      ...data,
      sessionId: convSessionId,
      conversationId: conversationId,
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
    const db = createDbClient();
    
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const { data: conversation } = await db
      .from('chat_conversations')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (!conversation) {
      return NextResponse.json({ messages: [], conversation: null });
    }

    const { data: messages } = await db
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