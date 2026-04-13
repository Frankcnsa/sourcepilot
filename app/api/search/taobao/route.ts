import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
const DASHSCOPE_BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';

// 创建 service role client
function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// 调用百炼搜索淘宝商品
async function searchWithBailian(query: string, page: number = 1, pageSize: number = 20) {
  const offset = (page - 1) * pageSize;
  
  const response = await fetch(`${DASHSCOPE_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'qwen-plus',
      messages: [
        {
          role: 'system',
          content: `You are a Taobao product search assistant. Search for products on Taobao and return structured data.
Return results in this exact JSON format:
{
  "products": [
    {
      "id": "string (product id)",
      "title": "string (translated product title)",
      "originalTitle": "string (original Chinese title)",
      "price": "string (price like '37.8')",
      "originalPrice": "string (optional, original price before discount)",
      "image": "string (product image URL)",
      "shop": "string (shop name)",
      "sales": "string (sales volume like '1000+' or '1万+')",
      "link": "string (taobao product URL)",
      "description": "string (brief product description)"
    }
  ],
  "total": number,
  "hasMore": boolean
}

Important:
1. Search on Taobao (taobao.com or 1688.com)
2. Translate all text to the user's language
3. Return real, current product data
4. If user searches in non-Chinese, translate to Chinese for search, then translate results back`
        },
        {
          role: 'user',
          content: `Search Taobao for "${query}" and return ${pageSize} results starting from offset ${offset}. Return valid JSON only.`
        }
      ],
      extra_body: {
        enable_search: true
      },
      temperature: 0.3,
      max_tokens: 4000,
      response_format: {
        type: 'json_object'
      }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Search API] Bailian error:', response.status, errorText);
    throw new Error(`Bailian API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  try {
    const parsed = JSON.parse(content);
    return {
      products: parsed.products || [],
      total: parsed.total || 0,
      hasMore: parsed.hasMore ?? false
    };
  } catch (e) {
    console.error('[Search API] Failed to parse JSON:', content);
    throw new Error('Invalid response format from Bailian');
  }
}

export async function POST(request: NextRequest) {
  try {
    // 检查 API Key
    if (!DASHSCOPE_API_KEY) {
      return NextResponse.json(
        { error: 'DASHSCOPE_API_KEY not configured' },
        { status: 500 }
      );
    }

    // 获取请求体
    const body = await request.json();
    const { query, page = 1, pageSize = 20, userId } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    console.log(`[Search API] Searching: "${query}", page: ${page}, pageSize: ${pageSize}`);

    // 调用百炼搜索
    const result = await searchWithBailian(query, page, pageSize);

    // 如果有用户ID，记录搜索历史
    if (userId) {
      try {
        const supabase = createServiceClient();
        await supabase.from('search_history').insert({
          user_id: userId,
          query,
          results_count: result.products.length,
        });
      } catch (e) {
        console.error('[Search API] Failed to save history:', e);
      }
    }

    return NextResponse.json({
      success: true,
      query,
      page,
      pageSize,
      ...result
    });

  } catch (error) {
    console.error('[Search API] Error:', error);
    return NextResponse.json(
      { 
        error: 'Search failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
