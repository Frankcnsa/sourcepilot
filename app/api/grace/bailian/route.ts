import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient as createServiceClient } from '@supabase/supabase-js';

// 强制动态渲染
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 阿里云百炼 Assistant API 配置
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
const DASHSCOPE_BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';

// Grace 的 System Prompt
const GRACE_SYSTEM_PROMPT = (locale: string) => `You are Grace, a professional procurement requirements analyst at SourcePilot.

Your Task: Collect sourcing requirements from users through natural multi-turn conversation.

Required Fields to Collect:
- product_name: Product name (REQUIRED)
- vehicle_model: Applicable vehicle/equipment model (if applicable)
- specifications: Key specifications and parameters
- quantity: Quantity needed
- budget: Budget range
- delivery_time: Delivery time requirements
- certifications: Required certifications

Rules:
1. When information is incomplete, ask for 1-2 missing fields at a time
2. Keep conversation natural, NOT like a survey or questionnaire
3. After collecting all REQUIRED fields, summarize and ask for confirmation
4. When user confirms, set status to "ready_for_sourcing"
5. Reply STRICTLY in the same language as the user (${locale})
6. Be friendly, professional, and conversational

Response Format (MUST be valid JSON):
{
  "status": "collecting" | "confirming" | "ready_for_sourcing",
  "reply": "Your conversational reply to the user (in ${locale})",
  "collected_info": {
    "product_name": "...",
    "vehicle_model": "...",
    "specifications": "...",
    "quantity": "...",
    "budget": "...",
    "delivery_time": "...",
    "certifications": "..."
  },
  "missing_fields": ["field1", "field2"]
}

IMPORTANT:
- Always respond in ${locale} language
- Keep replies under 150 words
- Be warm and helpful like a procurement specialist
- When user says "yes", "ok", "confirmed" etc., mark status as "ready_for_sourcing"`;

// 创建数据库客户端（Service Role Key - 绕过 RLS）
function createDbClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey || anonKey
  );
}

// 创建或获取 Thread（百炼对话线程）
async function getOrCreateThread(threadId?: string) {
  if (threadId) {
    // 验证 thread 是否存在
    const response = await fetch(`${DASHSCOPE_BASE_URL}/threads/${threadId}`, {
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
      },
    });
    
    if (response.ok) {
      return { id: threadId };
    }
  }
  
  // 创建新 thread
  const response = await fetch(`${DASHSCOPE_BASE_URL}/threads`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create thread: ${response.status}`);
  }
  
  return await response.json();
}

// 在 Thread 中创建消息
async function createMessage(threadId: string, role: string, content: string) {
  const response = await fetch(`${DASHSCOPE_BASE_URL}/threads/${threadId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      role,
      content,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create message: ${response.status}`);
  }
  
  return await response.json();
}

// 创建 Run（执行 Assistant）
async function createRun(threadId: string, systemPrompt: string) {
  const response = await fetch(`${DASHSCOPE_BASE_URL}/threads/${threadId}/runs`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      assistant_id: null, // 使用临时 assistant
      model: 'qwen-plus',
      instructions: systemPrompt,
      response_format: {
        type: 'json_object',
      },
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create run: ${response.status}`);
  }
  
  return await response.json();
}

// 等待 Run 完成
async function waitForRun(threadId: string, runId: string, maxAttempts = 30): Promise<any> {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`${DASHSCOPE_BASE_URL}/threads/${threadId}/runs/${runId}`, {
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get run status: ${response.status}`);
    }
    
    const run = await response.json();
    
    if (run.status === 'completed') {
      return run;
    }
    
    if (run.status === 'failed' || run.status === 'cancelled' || run.status === 'expired') {
      throw new Error(`Run ${run.status}: ${run.last_error?.message || 'Unknown error'}`);
    }
    
    // 等待 1 秒后重试
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  throw new Error('Run timeout');
}

// 获取 Assistant 的回复消息
async function getAssistantMessage(threadId: string) {
  const response = await fetch(`${DASHSCOPE_BASE_URL}/threads/${threadId}/messages?limit=1&order=desc`, {
    headers: {
      'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get messages: ${response.status}`);
  }
  
  const data = await response.json();
  return data.data?.[0];
}

export async function POST(request: NextRequest) {
  try {
    if (!DASHSCOPE_API_KEY) {
      return NextResponse.json(
        { error: 'DashScope API not configured' },
        { status: 500 }
      );
    }

    // 解析请求体
    const body = await request.json();
    const { message, locale = 'en', threadId, conversationId } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    console.log(`[Grace] User message: ${message}, locale: ${locale}, threadId: ${threadId || 'new'}`);

    // 获取或创建 Thread
    const thread = await getOrCreateThread(threadId);
    console.log(`[Grace] Using thread: ${thread.id}`);

    // 创建用户消息
    await createMessage(thread.id, 'user', message);

    // 创建 Run
    const systemPrompt = GRACE_SYSTEM_PROMPT(locale);
    const run = await createRun(thread.id, systemPrompt);
    console.log(`[Grace] Run created: ${run.id}`);

    // 等待 Run 完成
    const completedRun = await waitForRun(thread.id, run.id);
    console.log(`[Grace] Run completed`);

    // 获取 Assistant 回复
    const assistantMessage = await getAssistantMessage(thread.id);
    
    if (!assistantMessage) {
      return NextResponse.json(
        { error: 'No response from assistant' },
        { status: 500 }
      );
    }

    // 解析 JSON 响应
    let parsedContent;
    try {
      const content = assistantMessage.content?.[0]?.text?.value || assistantMessage.content;
      parsedContent = JSON.parse(content);
    } catch (e) {
      console.error('[Grace] Failed to parse JSON response:', e);
      console.log('[Grace] Raw content:', assistantMessage.content);
      
      // 如果解析失败，返回原始内容作为 reply
      parsedContent = {
        status: 'collecting',
        reply: typeof assistantMessage.content === 'string' 
          ? assistantMessage.content 
          : assistantMessage.content?.[0]?.text?.value || 'I apologize, I did not understand. Could you please rephrase?',
        collected_info: {},
        missing_fields: ['product_name'],
      };
    }

    // 保存消息到数据库（如果提供了 conversationId）
    if (conversationId) {
      try {
        const db = createDbClient();
        
        // 保存用户消息
        await db.from('chat_messages').insert({
          conversation_id: conversationId,
          role: 'user',
          content: message,
          sender: 'user',
          metadata: { locale },
        });
        
        // 保存 Grace 回复
        await db.from('chat_messages').insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: parsedContent.reply,
          sender: 'grace',
          metadata: { 
            status: parsedContent.status,
            collected_info: parsedContent.collected_info,
            missing_fields: parsedContent.missing_fields,
            thread_id: thread.id,
          },
        });
      } catch (dbError) {
        console.error('[Grace] Failed to save to database:', dbError);
        // 数据库错误不影响返回给前端
      }
    }

    // 返回给前端
    return NextResponse.json({
      threadId: thread.id,
      reply: parsedContent.reply,
      status: parsedContent.status,
      collectedInfo: parsedContent.collected_info,
      missingFields: parsedContent.missing_fields,
    });

  } catch (error) {
    console.error('[Grace API Error]:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// 获取 Grace 对话历史
export async function GET(request: NextRequest) {
  try {
    if (!DASHSCOPE_API_KEY) {
      return NextResponse.json(
        { error: 'DashScope API not configured' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get('threadId');

    if (!threadId) {
      return NextResponse.json(
        { error: 'Thread ID is required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${DASHSCOPE_BASE_URL}/threads/${threadId}/messages`, {
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch thread messages' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ messages: data.data || [] });

  } catch (error) {
    console.error('[Grace History Error]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
