import { NextRequest, NextResponse } from 'next/server';

const ONEBOUND_API_KEY = process.env.ONEBOUND_API_KEY || '';
const ONEBOUND_API_SECRET = process.env.ONEBOUND_API_SECRET || '';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 模拟数据用于测试
const MOCK_PRODUCTS = [
  {
    num_iid: "862339102275",
    title: "第一卫适用苹果16手机壳iPhone17ProMax新款15pro透明保护套",
    pic_url: "https://img.alicdn.com/imgextra/i2/2455420587/O1CN01WZ0ZqC1GCtchXDZII_!!4611686018427387563-0-item_pic.jpg",
    price: "13.55",
    promotion_price: "13.55",
    sales: 15420,
    seller_nick: "第一卫旗舰店",
    detail_url: "https://item.taobao.com/item.htm?id=862339102275",
    location: "广东深圳"
  },
  {
    num_iid: "672345123456",
    title: "闪魔iPhone16手机壳苹果15ProMax透明14Pro防摔13保护套",
    pic_url: "https://img.alicdn.com/imgextra/i1/1234567890/O1CN01ABC123 sample.jpg",
    price: "19.90",
    promotion_price: "15.90",
    sales: 23450,
    seller_nick: "闪魔旗舰店",
    detail_url: "https://item.taobao.com/item.htm?id=672345123456",
    location: "浙江杭州"
  },
  {
    num_iid: "778901234567",
    title: "图拉斯苹果16ProMax手机壳iPhone15新款14Pro防摔保护套",
    pic_url: "https://img.alicdn.com/imgextra/i3/9876543210/O1CN01XYZ789 sample.jpg",
    price: "68.00",
    promotion_price: "58.00",
    sales: 8765,
    seller_nick: "图拉斯旗舰店",
    detail_url: "https://item.taobao.com/item.htm?id=778901234567",
    location: "上海"
  }
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, page = 1, pageSize = 20, useMock = false } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // 如果是测试模式或API密钥未配置，返回模拟数据
    if (useMock || !ONEBOUND_API_KEY || !ONEBOUND_API_SECRET) {
      console.log(`[Search] Using mock data for: ${query}`);
      return NextResponse.json({
        success: true,
        query,
        source: 'mock',
        total: MOCK_PRODUCTS.length,
        products: MOCK_PRODUCTS
      });
    }

    // 使用万邦API
    const params = new URLSearchParams({
      key: ONEBOUND_API_KEY,
      secret: ONEBOUND_API_SECRET,
      api_name: 'item_search',
      q: query,
      page: String(page),
      page_size: String(pageSize),
      sort: 'default'
    });
    
    const url = `http://api.onebound.cn/taobao/api_call.php?${params.toString()}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超时

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('[Search] Wanbang error:', data.error);
      return NextResponse.json({ error: data.error }, { status: 500 });
    }
    
    const items = data.items?.item || [];
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
      source: 'wanbang',
      total: data.items?.total_results || products.length,
      products
    });

  } catch (error: any) {
    console.error('[Search] Error:', error);
    
    // 出错时返回模拟数据
    console.log(`[Search] Falling back to mock data`);
    return NextResponse.json({
      success: true,
      query: body?.query || 'unknown',
      source: 'mock-fallback',
      error: error.message,
      total: MOCK_PRODUCTS.length,
      products: MOCK_PRODUCTS
    });
  }
}
