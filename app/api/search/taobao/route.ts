import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ONEBOUND_KEY = process.env.ONEBOUND_KEY;
const ONEBOUND_SECRET = process.env.ONEBOUND_SECRET;

// 创建 service role client
function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// 调用万邦 API 搜索 1688 商品
async function search1688(query: string, page: number = 1, pageSize: number = 20) {
  const offset = (page - 1) * pageSize;
  
  const url = `https://api-gw.onebound.cn/1688/item_search?key=${ONEBOUND_KEY}&secret=${ONEBOUND_SECRET}&q=${encodeURIComponent(query)}&page=${page}&start_price=0&end_price=0&page_size=${pageSize}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Search API] 1688 error:', response.status, errorText);
    throw new Error(`1688 API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.error_code !== '0000') {
    console.error('[Search API] 1688 business error:', data);
    throw new Error(`1688 API error: ${data.reason || 'Unknown'}`);
  }

  // 转换数据格式
  const items = data.items?.item || [];
  const products = items.map((item: any) => ({
    id: String(item.num_iid),
    title: item.title,
    originalTitle: item.title,
    price: String(item.promotion_price || item.price || '0'),
    originalPrice: item.price !== item.promotion_price ? String(item.price) : undefined,
    image: item.pic_url,
    shop: item.nick || '1688店铺',
    sales: String(item.sales || '0'),
    link: item.detail_url,
    description: `${item.tag_percent || ''}`,
    platform: '1688'
  }));

  return {
    products,
    total: parseInt(data.items?.total_results || '0'),
    hasMore: products.length >= pageSize
  };
}

// 调用万邦 API 搜索淘宝商品
async function searchTaobao(query: string, page: number = 1, pageSize: number = 20) {
  const url = `https://api-gw.onebound.cn/taobao/item_search?key=${ONEBOUND_KEY}&secret=${ONEBOUND_SECRET}&q=${encodeURIComponent(query)}&page=${page}&page_size=${pageSize}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Search API] Taobao error:', response.status, errorText);
    throw new Error(`Taobao API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.error_code !== '0000') {
    console.error('[Search API] Taobao business error:', data);
    throw new Error(`Taobao API error: ${data.reason || 'Unknown'}`);
  }

  // 转换数据格式
  const items = data.items?.item || [];
  const products = items.map((item: any) => ({
    id: String(item.num_iid),
    title: item.title,
    originalTitle: item.title,
    price: String(item.promotion_price || item.price || '0'),
    originalPrice: item.price !== item.promotion_price ? String(item.price) : undefined,
    image: item.pic_url,
    shop: item.nick || item.seller || '淘宝店铺',
    sales: String(item.sales || item.sale_num || '0'),
    link: item.detail_url,
    description: '',
    platform: 'taobao'
  }));

  return {
    products,
    total: parseInt(data.items?.total_results || '0'),
    hasMore: products.length >= pageSize
  };
}

export async function POST(request: NextRequest) {
  try {
    // 检查 API Key
    if (!ONEBOUND_KEY || !ONEBOUND_SECRET) {
      return NextResponse.json(
        { error: 'ONEBOUND_KEY or ONEBOUND_SECRET not configured' },
        { status: 500 }
      );
    }

    // 获取请求体
    const body = await request.json();
    const { query, page = 1, pageSize = 20, userId, platform = 'all' } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    console.log(`[Search API] Searching: "${query}", page: ${page}, pageSize: ${pageSize}, platform: ${platform}`);

    let allProducts: any[] = [];
    let total = 0;

    // 搜索 1688
    if (platform === 'all' || platform === '1688') {
      try {
        const result1688 = await search1688(query, page, pageSize / 2);
        allProducts = [...allProducts, ...result1688.products];
        total += result1688.total;
      } catch (e) {
        console.error('[Search API] 1688 search failed:', e);
      }
    }

    // 搜索淘宝
    if (platform === 'all' || platform === 'taobao') {
      try {
        const resultTaobao = await searchTaobao(query, page, pageSize / 2);
        allProducts = [...allProducts, ...resultTaobao.products];
        total += resultTaobao.total;
      } catch (e) {
        console.error('[Search API] Taobao search failed:', e);
      }
    }

    // 如果有用户ID，记录搜索历史
    if (userId) {
      try {
        const supabase = createServiceClient();
        await supabase.from('search_history').insert({
          user_id: userId,
          query,
          results_count: allProducts.length,
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
      products: allProducts,
      total,
      hasMore: allProducts.length >= pageSize
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
