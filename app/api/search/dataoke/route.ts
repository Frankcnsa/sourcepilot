import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 阿里云FC中转服务地址
const DATAOKE_PROXY_URL = 'https://dataoke-proxy-tlkpqnacev.cn-shanghai.fcapp.run';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, page = 1, pageSize = 20 } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    console.log(`[Dataoke Search] Searching: "${query}", page: ${page}, pageSize: ${pageSize}`);

    // 调用阿里云FC中转服务（大淘客搜索）
    const response = await fetch(`${DATAOKE_PROXY_URL}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        page,
        pageSize
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Dataoke Search] Error:', response.status, errorText);
      throw new Error(`Search failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Search failed');
    }

    // 转换商品数据格式（保持与前端兼容）
    const products = (data.products || []).map((item: any) => ({
      id: String(item.id || item.goodsId || item.itemId || Math.random().toString(36)),
      title: item.title || item.goodsName || 'Unknown Product',
      price: parseFloat(item.price || item.actualPrice || item.zkFinalPrice || 0),
      originalPrice: item.originalPrice || item.originalPriceInfo ? 
        parseFloat(item.originalPrice) : undefined,
      image: item.image || item.pic || item.mainPic || item.pictUrl || '',
      shop: item.shop || item.shopTitle || item.nick || 'Taobao Shop',
      sales: item.sales || item.volume || item.deal || '0',
      link: item.link || item.itemLink || item.url || item.couponLink || '',
      coupon: item.coupon || item.couponInfo || item.couponAmount || '',
    }));

    return NextResponse.json({
      success: true,
      query,
      page,
      pageSize,
      products,
      total: data.total || products.length,
      hasMore: products.length >= pageSize
    });

  } catch (error) {
    console.error('[Dataoke Search] Error:', error);
    return NextResponse.json(
      { 
        error: 'Search failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
