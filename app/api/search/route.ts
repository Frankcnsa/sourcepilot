import { NextRequest, NextResponse } from 'next/server';

const ONEBOUND_API_URL = 'http://api.onebound.cn/taobao/api_call.php';
const ONEBOUND_API_KEY = process.env.ONEBOUND_API_KEY || '';
const ONEBOUND_API_SECRET = process.env.ONEBOUND_API_SECRET || '';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  console.log('[Search] Request received');
  
  try {
    const body = await request.json();
    const { query, page = 1, pageSize = 20 } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    console.log(`[Search] Query: "${query}"`);
    console.log(`[Search] API Key configured: ${!!ONEBOUND_API_KEY}`);
    console.log(`[Search] API Secret configured: ${!!ONEBOUND_API_SECRET}`);

    if (!ONEBOUND_API_KEY || !ONEBOUND_API_SECRET) {
      return NextResponse.json({ error: 'API credentials not configured' }, { status: 500 });
    }

    // 构建请求URL
    const params = new URLSearchParams({
      key: ONEBOUND_API_KEY,
      secret: ONEBOUND_API_SECRET,
      api_name: 'item_search',
      q: query,
      page: String(page),
      page_size: String(pageSize),
      sort: 'default'
    });
    
    const url = `${ONEBOUND_API_URL}?${params.toString()}`;
    console.log(`[Search] Calling URL: ${url.substring(0, 80)}...`);

    // 使用AbortController实现超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    
    console.log(`[Search] Response status: ${response.status}`);

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`[Search] Response keys: ${Object.keys(data).join(', ')}`);
    
    if (data.error) {
      console.error('[Search] Wanbang error:', data.error);
      return NextResponse.json({ error: data.error }, { status: 500 });
    }
    
    const items = data.items?.item || [];
    console.log(`[Search] Got ${items.length} items`);
    
    const products = items.map((item: any) => ({
      num_iid: String(item.num_iid || item.id || ''),
      title: item.title || 'Unknown Product',
      pic_url: item.pic_url || item.pict_url || '',
      price: String(item.price || '0'),
      promotion_price: item.promotion_price,
      sales: parseInt(item.sales || item.volume || '0'),
      seller_id: String(item.seller_id || item.nick || ''),
      seller_nick: item.seller_nick || item.nick || 'Unknown Shop',
      detail_url: item.detail_url || `https://item.taobao.com/item.htm?id=${item.num_iid}`,
      item_url: item.item_url,
      location: item.item_location || item.location
    }));
    
    return NextResponse.json({
      success: true,
      query,
      total: data.items?.total_results || products.length,
      products
    });

  } catch (error: any) {
    console.error('[Search] Error:', error);
    return NextResponse.json({ 
      error: 'Search failed',
      details: error.message 
    }, { status: 500 });
  }
}
