import { NextResponse } from 'next/server';
import { translateBatch } from '@/lib/aliyun-translate';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DATAOKE_PROXY_URL = process.env.DATAOKE_PROXY_URL || 'http://111.230.10.101:3001';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetLang = searchParams.get('lang') || 'en';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const seedId = searchParams.get('seed') || '46032636';

    const response = await fetch(`${DATAOKE_PROXY_URL}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'guess-you-like', id: seedId, size: limit })
    });

    if (!response.ok) {
      throw new Error(`FC error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success || !data.data) {
      return NextResponse.json({ success: false, products: [] });
    }

    // Map products
    let products = (data.data || []).map((item: any) => ({
      id: String(item.id || item.goodsId || Math.random().toString(36)),
      title: item.dtitle || item.title || item.goodsName || 'Unknown',
      originalTitle: item.dtitle || item.title,
      price: parseFloat(item.actualPrice || item.zkFinalPrice || 0),
      originalPrice: item.originalPrice ? parseFloat(item.originalPrice) : undefined,
      image: item.mainPic || item.pic || '',
      shop: item.shopName || item.nick || 'Taobao',
      sales: item.monthSales || item.volume || '0',
      monthSales: item.monthSales || item.volume || 0,
      link: item.couponLink || item.itemLink || '',
      coupon: item.couponInfo || item.couponAmount || '',
      couponInfo: item.couponInfo || item.couponAmount || '',
      shopType: item.shopType || 0,
      desc: item.desc || '',
      brandName: item.brandName || '',
      couponLink: item.couponLink || ''
    }));

    // Translate titles if not Chinese
    if (targetLang !== 'zh' && products.length > 0) {
      const titles = products.map((p: { title: string }) => p.title);
      const translated = await translateBatch(titles, 'zh', targetLang);
      products = products.map((p: any, i: number) => ({
        ...p,
        originalTitle: p.title,
        title: translated[i] || p.title
      }));
    }

    return NextResponse.json({
      success: true,
      products,
      page,
      hasMore: products.length >= limit
    });

  } catch (error) {
    console.error('[Guess You Like] Error:', error);
    return NextResponse.json({ success: false, products: [] });
  }
}
