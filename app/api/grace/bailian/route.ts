import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

// 强制动态渲染
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 阿里云百炼 API 配置
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
const DASHSCOPE_BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';

// Grace 的 System Prompt
const GRACE_SYSTEM_PROMPT = () => `You are Grace, a polite and professional sourcing requirements analyst at SourcePilot.

Your Task: Collect sourcing requirements from users through natural multi-turn conversation. We serve both business and individual buyers.

⚠️ IMPORTANT LIMITATIONS - You CANNOT:
- Provide price quotes or estimates
- Give supplier links or contact information  
- Recommend specific suppliers
- Provide any sourcing results or recommendations

You are ONLY an assistant to collect information. All sourcing work will be done by Frank.

Required Fields to Collect (for EACH product):
- product_name: Product name (REQUIRED)
- vehicle_model: Applicable vehicle/equipment model (if applicable)
- specifications: Key specifications and parameters
- quantity: Quantity needed (REQUIRED)
- budget: Budget range (optional)
- delivery_time: Delivery time requirements
- certifications: Required certifications
- images: Product images (optional but helpful)

Multi-Product Collection Rules:
1. When user mentions a product, FIRST ask: "Do you have any images of this product? You can upload them - it will help Frank search more accurately."
2. Collect all required info for the current product (name, quantity at minimum)
3. After confirming current product details, ALWAYS ask: "Do you have any other products you'd like to source?"
4. If user says yes or mentions another product → continue collecting the next product (repeat from step 1)
5. If user says no, "that's all", "no more", etc. → set status to "ready_for_sourcing" and say you will get Frank
6. Be polite, warm, and professional throughout the conversation
7. Use "Boss" or polite forms of address

Response Format (MUST be valid JSON):
{
  "status": "collecting" | "confirming" | "ready_for_sourcing",
  "reply": "Your polite and conversational reply to the user",
  "current_product": {
    "product_name": "...",
    "vehicle_model": "...",
    "specifications": "...",
    "quantity": "...",
    "budget": "...",
    "delivery_time": "...",
    "certifications": "...",
    "images": ["image_url1", "image_url2"]
  },
  "all_products": [
    { "product_name": "...", "quantity": "...", "specifications": "..." }
  ],
  "missing_fields": ["field1", "field2"],
  "ask_for_more_products": true | false,
  "handover_to_frank": true | false
}

IMPORTANT:
- Be polite, warm, and professional at all times
- Use respectful forms of address like "Boss" or polite equivalents in the user's language
- Ask for product images early in the conversation (high priority)
- Support multiple products - always ask "any other products?" after each one is confirmed
- Only set status to "ready_for_sourcing" when user explicitly says they have no more products
- When handing over to Frank, be polite and professional: "Thank you, Boss! I've noted all your requirements. Let me get Frank to assist you with the sourcing analysis."
- NEVER provide prices, links, or supplier information`;

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
      max_tokens: 1500,
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

// 解析 Grace 的 JSON 响应
function parseGraceResponse(content: string): {
  status: string;
  reply: string;
  current_product: any;
  all_products: any[];
  missing_fields: string[];
  ask_for_more_products: boolean;
  handover_to_frank: boolean;
} {
  try {
    const parsed = JSON.parse(content);
    return {
      status: parsed.status || 'collecting',
      reply: parsed.reply || parsed.content || 'I see. Tell me more about your requirements.',
      current_product: parsed.current_product || {},
      all_products: parsed.all_products || [],
      missing_fields: parsed.missing_fields || [],
      ask_for_more_products: parsed.ask_for_more_products || false,
      handover_to_frank: parsed.handover_to_frank || parsed.status === 'ready_for_sourcing' || false,
    };
  } catch (e) {
    console.error('[Grace] Failed to parse JSON response:', e);
    return {
      status: 'collecting',
      reply: content,
      current_product: {},
      all_products: [],
      missing_fields: ['product_name'],
      ask_for_more_products: false,
      handover_to_frank: false,
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
    const { message, image, locale = 'en', conversationId, threadId, allProducts = [] } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    console.log(`[Grace] User message: "${message}", products so far: ${allProducts.length}`);

    // 构建上下文信息
    const contextInfo = allProducts.length > 0 
      ? `Previously collected products: ${JSON.stringify(allProducts)}\n\nCurrent message: ${message}`
      : message;
    
    const messages = [
      { role: 'system', content: GRACE_SYSTEM_PROMPT() },
      { role: 'user', content: contextInfo },
    ];

    // 调用百炼 API
    const aiContent = await callBailianChat(messages);
    console.log(`[Grace] AI response received`);

    // 解析响应
    const parsedResponse = parseGraceResponse(aiContent);

    // 构建完整的产品列表
    let updatedAllProducts = [...allProducts];
    if (parsedResponse.current_product?.product_name) {
      // 检查是否是新产品还是更新现有产品
      const existingIndex = updatedAllProducts.findIndex(
        p => p.product_name === parsedResponse.current_product.product_name
      );
      
      if (existingIndex >= 0) {
        // 更新现有产品
        updatedAllProducts[existingIndex] = {
          ...updatedAllProducts[existingIndex],
          ...parsedResponse.current_product,
          images: image ? [image] : parsedResponse.current_product.images || [],
        };
      } else {
        // 添加新产品
        updatedAllProducts.push({
          ...parsedResponse.current_product,
          images: image ? [image] : parsedResponse.current_product.images || [],
        });
      }
    }

    // 保存到数据库
    let savedConversationId = conversationId;
    try {
      const db = createDbClient();
      
      if (!savedConversationId) {
        const { data: convData, error: convError } = await db
          .from('chat_conversations')
          .insert({
            title: `Sourcing: ${message.slice(0, 30)}...`,
            status: 'active',
          })
          .select('id')
          .single();
        
        if (!convError && convData) {
          savedConversationId = convData.id;
        }
      }

      if (savedConversationId) {
        await db.from('chat_messages').insert({
          conversation_id: savedConversationId,
          role: 'user',
          content: message,
          sender: 'user',
          metadata: { locale, image },
        });
        
        await db.from('chat_messages').insert({
          conversation_id: savedConversationId,
          role: 'assistant',
          content: parsedResponse.reply,
          sender: 'grace',
          metadata: { 
            status: parsedResponse.status,
            all_products: updatedAllProducts,
          },
        });
      }
    } catch (dbError) {
      console.error('[Grace] Database error:', dbError);
    }

    // 返回给前端
    return NextResponse.json({
      conversationId: savedConversationId,
      threadId: savedConversationId,
      reply: parsedResponse.reply,
      status: parsedResponse.status,
      currentProduct: parsedResponse.current_product,
      allProducts: updatedAllProducts,
      missingFields: parsedResponse.missing_fields,
      askForMoreProducts: parsedResponse.ask_for_more_products,
      handoverToFrank: parsedResponse.handover_to_frank,
    });

  } catch (error) {
    console.error('[Grace API Error]:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        reply: 'Sorry, something went wrong. Please try again.',
        status: 'collecting',
        allProducts: [],
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
    const { data, error } = await db
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(50);
    
    if (error) {
      console.error('[Grace] Failed to get history:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      messages: data?.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
        sender: msg.sender,
      })) || [],
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
