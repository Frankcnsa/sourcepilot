import { NextRequest, NextResponse } from 'next/server';
import { translateText, translateBatch } from '@/lib/aliyun-translate';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DATAOKE_PROXY_URL = process.env.DATAOKE_PROXY_URL || 'http://127.0.0.1:3001';

function detectLanguage(text: string): string {
  if (/[\u4e00-\u9fa5]/.test(text)) return 'zh';
  return 'en';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, page = 1, pageSize = 20, targetLang = 'en' } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    console.log(`[Dataoke] Query: "${query}", target: ${targetLang}`);

    const sourceLang = detectLanguage(query);
    let searchQuery = query;
    
    if (sourceLang !== 'zh') {
      searchQuery = await translateText(query, sourceLang, 'zh');
      console.log(`[Dataoke] Translated: "${searchQuery}"`);
    }

    const response = await fetch(`${DATAOKE_PROXY_URL}/api/search/taobao`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: searchQuery, page, pageSize }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Dataoke] FC Error:', response.status, errorText);
      throw new Error(`Search failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('[Dataoke] FC response keys:', Object.keys(data));
    console.log('[Dataoke] FC data type:', typeof data.data);
    if (data.data && typeof data.data === 'object') {
      console.log('[Dataoke] FC data.data keys:', Object.keys(data.data));
    }

    if (!data.success) {
      throw new Error(data.error || 'Search failed');
    }

    // Extract products from FC response
    const rawProducts = data.data?.list || data.products || [];
    console.log(`[Dataoke] Raw products count: ${rawProducts.length}`);

    let products = rawProducts.map((item: any) => ({
      id: String(item.id || item.goodsId || Math.random().toString(36)),
      title: item.title || item.goodsName || item.dtitle || 'Unknown Product',
      originalTitle: item.dtitle || item.title || item.goodsName,
      price: parseFloat(item.actualPrice || item.zkFinalPrice || item.price || 0),
      originalPrice: item.originalPrice ? parseFloat(item.originalPrice) : (item.originPrice ? parseFloat(item.originPrice) : undefined),
      image: item.mainPic || item.pic || item.pictUrl || item.image || '',
      shop: item.shopTitle || item.nick || item.shop || 'Taobao Shop',
      sales: item.monthSales || item.volume || item.sales || '0',
      monthSales: item.monthSales || item.volume || 0,
      link: item.couponLink || item.itemLink || item.url || item.link || '',
      coupon: item.couponInfo || item.couponAmount || item.coupon || '',
      couponInfo: item.couponInfo || item.couponAmount || '',
      shopType: item.shopType || 0,
      desc: item.desc || '',
      brandName: item.brandName || '',
      couponLink: item.couponLink || ''
    }));

    // Translate back if needed
    if (targetLang !== 'zh' && products.length > 0) {
      const titles = products.map((p: { title: string }) => p.title);
      const translated = await translateBatch(titles, 'zh', targetLang);
      products = products.map((p: { title: string; originalTitle?: string }, i: number) => ({
        ...p,
        originalTitle: p.title,
        title: translated[i] || p.title
      }));
    }

    return NextResponse.json({
      success: true,
      query,
      translatedQuery: searchQuery !== query ? searchQuery : undefined,
      page,
      pageSize,
      products,
      total: data.data?.totalNum || data.total || products.length,
      hasMore: products.length >= pageSize
    });

  } catch (error) {
    console.error('[Dataoke] Error:', error);
    return NextResponse.json(
      { error: 'Search failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
