import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ALIBABA1688_APPCODE = process.env.ALIBABA1688_APPCODE;
const API_ENDPOINT = 'https://cbu.market.alicloudapi.com/deepsearch';

// 解析 SSE 流数据
function parseSSE(text: string): any[] {
  const lines = text.split('\n');
  const events: any[] = [];
  
  for (const line of lines) {
    if (line.startsWith('data:')) {
      try {
        const jsonStr = line.slice(5).trim();
        if (jsonStr && jsonStr !== '[DONE]') {
          events.push(JSON.parse(jsonStr));
        }
      } catch {
        // 忽略解析错误
      }
    }
  }
  
  return events;
}

// 从1688 API响应中提取公司和店铺信息
function extractFrom1688Response(events: any[]): { companyName: string | null; shopUrl: string | null } {
  for (const event of events) {
    const outputs = event.output || event.data?.output;
    if (!outputs || !Array.isArray(outputs)) continue;
    
    for (const msg of outputs) {
      // 检查 data.responseData.data 路径
      const responseData = msg?.data?.responseData?.data;
      if (responseData && Array.isArray(responseData)) {
        for (const item of responseData) {
          const sellerInfo = item?.offerInfo?.sellerInfo;
          if (sellerInfo?.companyName) {
            const shopUrl = sellerInfo.pcWinportUrl || sellerInfo.mobileWinportUrl || 
                           sellerInfo.pcDetailUrl || sellerInfo.offerDetailUrl || null;
            return {
              companyName: sellerInfo.companyName,
              shopUrl: shopUrl ? (shopUrl.startsWith('http') ? shopUrl : `https:${shopUrl}`) : null,
            };
          }
        }
      }
      
      // 检查 content 数组
      const content = msg?.content;
      if (!content || !Array.isArray(content)) continue;
      
      for (const item of content) {
        if (!item) continue;
        
        // 检查 data 字段
        if (item.data?.responseData?.data && Array.isArray(item.data.responseData.data)) {
          for (const dataItem of item.data.responseData.data) {
            const sellerInfo = dataItem?.offerInfo?.sellerInfo;
            if (sellerInfo?.companyName) {
              const shopUrl = sellerInfo.pcWinportUrl || sellerInfo.mobileWinportUrl || null;
              return {
                companyName: sellerInfo.companyName,
                shopUrl: shopUrl ? (shopUrl.startsWith('http') ? shopUrl : `https:${shopUrl}`) : null,
              };
            }
          }
        }
        
        // 检查 JSON 类型
        if (item.type === 'json' && item.json) {
          try {
            const jsonData = typeof item.json === 'string' ? JSON.parse(item.json) : item.json;
            
            // 检查 offers 格式
            if (jsonData.offers && Array.isArray(jsonData.offers)) {
              for (const offer of jsonData.offers) {
                if (offer.companyName) {
                  const shopUrl = offer.pcWinportUrl || offer.mobileWinportUrl || 
                                 offer.pcDetailUrl || offer.offerDetailUrl || null;
                  return {
                    companyName: offer.companyName,
                    shopUrl: shopUrl ? (shopUrl.startsWith('http') ? shopUrl : `https:${shopUrl}`) : null,
                  };
                }
              }
            }
          } catch {
            // 忽略解析错误
          }
        }
      }
    }
  }
  
  return { companyName: null, shopUrl: null };
}

// 查询1688深度找API
async function search1688(companyName: string) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45秒超时
    
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `APPCODE ${ALIBABA1688_APPCODE}`,
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        app_id: '204996862',
        input: [{
          role: 'user',
          content: [{ type: 'text', text: companyName }]
        }]
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`1688 API error for ${companyName}:`, response.status);
      return null;
    }

    const text = await response.text();
    const events = parseSSE(text);
    
    return extractFrom1688Response(events);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`Timeout searching 1688 for ${companyName}`);
    } else {
      console.error(`Error searching 1688 for ${companyName}:`, error);
    }
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!ALIBABA1688_APPCODE) {
      return NextResponse.json({ error: '1688 API not configured' }, { status: 500 });
    }

    const body = await req.json();
    const { limit = 10, offset = 0 } = body;

    // 获取需要补全的供应商（店铺链接为空）
    const { data: suppliers, error: fetchError } = await supabase
      .from('suppliers')
      .select('id, company_name, phone_enhanced, shop_1688')
      .is('shop_1688', null)  // 只查没有店铺链接的
      .order('id')
      .range(offset, offset + limit - 1);

    if (fetchError) {
      console.error('Fetch suppliers error:', fetchError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!suppliers || suppliers.length === 0) {
      return NextResponse.json({ 
        message: 'No suppliers need enrichment',
        processed: 0,
        updated: 0,
      });
    }

    let updated = 0;
    const results = [];

    for (const supplier of suppliers) {
      // 延迟避免请求过快
      await new Promise(resolve => setTimeout(resolve, 1500));

      const result = await search1688(supplier.company_name);
      
      if (result && result.shopUrl) {
        const { error: updateError } = await supabase
          .from('suppliers')
          .update({
            shop_1688: result.shopUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', supplier.id);

        if (!updateError) {
          updated++;
          results.push({
            id: supplier.id,
            company: supplier.company_name,
            matchedCompany: result.companyName,
            shop: result.shopUrl,
          });
        } else {
          console.error(`Update error for ${supplier.company_name}:`, updateError);
        }
      }
    }

    return NextResponse.json({
      processed: suppliers.length,
      updated,
      nextOffset: offset + suppliers.length,
      results,
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
