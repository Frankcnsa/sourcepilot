import { NextRequest, NextResponse } from 'next/server';

const ONEBOUND_API_URL = 'http://api.onebound.cn/taobao/api_call.php';
const ONEBOUND_API_KEY = process.env.ONEBOUND_API_KEY || '';
const ONEBOUND_API_SECRET = process.env.ONEBOUND_API_SECRET || '';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { num_iid } = body;

    if (!num_iid) {
      return NextResponse.json(
        { error: 'num_iid is required' },
        { status: 400 }
      );
    }

    if (!ONEBOUND_API_KEY || !ONEBOUND_API_SECRET) {
      return NextResponse.json(
        { error: 'API credentials not configured' },
        { status: 500 }
      );
    }

    console.log(`[Wanbang Detail] num_iid: ${num_iid}`);

    // 调用万邦API
    const params = new URLSearchParams({
      key: ONEBOUND_API_KEY,
      secret: ONEBOUND_API_SECRET,
      api_name: 'item_get',
      num_iid: num_iid,
      is_promotion: '1'
    });
    
    const response = await fetch(`${ONEBOUND_API_URL}?${params.toString()}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    const data = await response.json();
    
    if (data.error) {
      console.error('[Wanbang Detail] API error:', data.error);
      return NextResponse.json(
        { error: data.error },
        { status: 500 }
      );
    }
    
    const item = data.item || {};
    
    const product = {
      num_iid: String(item.num_iid || num_iid),
      title: item.title || 'Unknown Product',
      pic_url: item.pic_url || '',
      price: String(item.price || '0'),
      promotion_price: item.promotion_price,
      sales: parseInt(item.sales || '0'),
      seller_id: String(item.seller_id || ''),
      seller_nick: item.seller_nick || 'Unknown Shop',
      detail_url: item.detail_url || `https://item.taobao.com/item.htm?id=${num_iid}`,
      item_url: item.item_url,
      location: item.location,
      desc: item.desc,
      skus: item.skus?.sku || [],
      props: item.props?.prop || [],
      images: item.item_imgs?.item_img?.map((img: any) => img.url) || []
    };
    
    return NextResponse.json({
      success: true,
      num_iid,
      product
    });

  } catch (error) {
    console.error('[Wanbang Detail] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get product detail',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
