import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

// 强制动态渲染
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 阿里云百炼 API 配置
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
const DASHSCOPE_BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';

// Grace 的 System Prompt
const GRACE_SYSTEM_PROMPT = () => `You are Grace, a professional sourcing requirements analyst at SourcePilot.

Your Task: Collect sourcing requirements from users through natural multi-turn conversation. We serve both business procurement (B2B) and individual buyers.

⚠️ IMPORTANT LIMITATIONS - You CANNOT:
- Provide price quotes or estimates
- Give supplier links or contact information  
- Recommend specific suppliers
- Provide any sourcing results or recommendations

You are ONLY an assistant to collect information. All sourcing work will be done by Frank.

Required Fields to Collect:
- product_name: Product name (REQUIRED)
- vehicle_model: Applicable vehicle/equipment model (if applicable)
- specifications: Key specifications and parameters
- quantity: Quantity needed
- budget: Budget range (optional, just for reference)
- delivery_time: Delivery time requirements
- certifications: Required certifications

Rules:
1. When information is incomplete, ask for 1-2 missing fields at a time
2. Keep conversation natural, NOT like a survey or questionnaire
3. After collecting all REQUIRED fields, summarize and ask for confirmation
4. When user confirms, set status to "ready_for_sourcing" and say you will get Frank
5. Reply in the SAME LANGUAGE as the user's messages (detect from conversation history)
6. Be friendly, professional, and conversational
7. If user asks for prices/suppliers/links, politely say: "I'll have Frank help you with that after we complete the requirements."

Response Format (MUST be valid JSON):
{
  "status": "collecting" | "confirming" | "ready_for_sourcing",
  "reply": "Your conversational reply to the user (in the same language as user)",
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
- Detect the user's language from their messages and reply in the same language
- Support Chinese, English, French, German, Spanish, Japanese, Arabic, etc.
- Keep replies under 150 words
- Be warm and helpful like a procurement specialist
- When user confirms, set status to "ready_for_sourcing" and mention you will get Frank
- NEVER provide prices, links, or supplier information
- We serve both businesses and individual buyers`;

// 创建数据库客户端
function createDbClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey || anonKey
  );
}

// 调用百炼 Chat Completion API
async function callBailianChat(
  messages: Array<{ role: string; content: string }>
) {
  const response = await fetch(`${DASHSCOPE_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'qwen-plus',
      messages: [
        { role: 'system', content: GRACE_SYSTEM_PROMPT() },
        ...messages,
      ],
      response_format: {
        type: 'json_object',
      },
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Grace] Bailian API error:', response.status, errorText);
    throw new Error(`Bailian API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content;
}

// 从数据库获取对话历史
async function getConversationHistory(conversationId: string, db: any) {
  if (!conversationId) return [];
  
  const { data, error } = await db
    .from('chat_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .eq('sender', 'grace')
    .order('created_at', { ascending: true })
    .limit(20);
  
  if (error) {
    console.error('[Grace] Failed to get conversation history:', error);
    return [];
  }
  
  return data?.map((msg: any) => ({
    role: msg.role,
    content: msg.content,
  })) || [];
}

// 解析 Grace 的 JSON 响应
function parseGraceResponse(content: string): {
  status: string;
  reply: string;
  collected_info: Record<string, string>;
  missing_fields: string[];
} {
  try {
    const parsed = JSON.parse(content);
    return {
      status: parsed.status || 'collecting',
      reply: parsed.reply || parsed.content || 'I see. Tell me more about your requirements.',
      collected_info: parsed.collected_info || {},
      missing_fields: parsed.missing_fields || [],
    };
  } catch (e) {
    console.error('[Grace] Failed to parse JSON response:', e);
    // 如果解析失败，返回原始内容作为 reply
    return {
      status: 'collecting',
      reply: content,
      collected_info: {},
      missing_fields: ['product_name'],
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!DASHSCOPE_API_KEY) {
      console.error('[Grace] DASHSCOPE_API_KEY not configured');
      return NextResponse.json(
        { error: 'DashScope API not configured' },
        { status: 500 }
      );
    }

    // 解析请求体
    const body = await request.json();
    const { message, locale = 'en', conversationId, threadId } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    console.log(`[Grace] User message: "${message}", locale: ${locale}`);

    // 构建消息历史
    const db = createDbClient();
    const history = conversationId 
      ? await getConversationHistory(conversationId, db)
      : [];
    
    const messages = [
      ...history,
      { role: 'user', content: message },
    ];

    // 调用百炼 API
    const aiContent = await callBailianChat(messages);
    console.log(`[Grace] AI response:`, aiContent);

    // 解析响应
    const parsedResponse = parseGraceResponse(aiContent);

    // 保存消息到数据库
    let savedConversationId = conversationId;
    try {
      // 如果没有 conversationId，创建新的
      if (!savedConversationId) {
        const { data: convData, error: convError } = await db
          .from('chat_conversations')
          .insert({
            title: `Sourcing: ${message.slice(0, 30)}...`,
            status: 'active',
          })
          .select('id')
          .single();
        
        if (convError) {
          console.error('[Grace] Failed to create conversation:', convError);
        } else {
          savedConversationId = convData.id;
        }
      }

      // 保存用户消息
      if (savedConversationId) {
        await db.from('chat_messages').insert({
          conversation_id: savedConversationId,
          role: 'user',
          content: message,
          sender: 'user',
          metadata: { locale },
        });
        
        // 保存 Grace 回复
        await db.from('chat_messages').insert({
          conversation_id: savedConversationId,
          role: 'assistant',
          content: parsedResponse.reply,
          sender: 'grace',
          metadata: { 
            status: parsedResponse.status,
            collected_info: parsedResponse.collected_info,
            missing_fields: parsedResponse.missing_fields,
          },
        });
      }
    } catch (dbError) {
      console.error('[Grace] Failed to save to database:', dbError);
      // 数据库错误不影响返回给前端
    }

    // 返回给前端
    return NextResponse.json({
      conversationId: savedConversationId,
      threadId: threadId || savedConversationId, // 保持兼容
      reply: parsedResponse.reply,
      status: parsedResponse.status,
      collectedInfo: parsedResponse.collected_info,
      missingFields: parsedResponse.missing_fields,
    });

  } catch (error) {
    console.error('[Grace API Error]:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        reply: 'Sorry, something went wrong. Please try again.',
        status: 'collecting',
        collectedInfo: {},
        missingFields: ['product_name'],
      },
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
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    const db = createDbClient();
    const history = await getConversationHistory(conversationId, db);
    
    return NextResponse.json({ 
      messages: history,
      conversationId,
    });

  } catch (error) {
    console.error('[Grace History Error]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
