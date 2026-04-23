import { NextRequest, NextResponse } from 'next/server';
import { translateText, translateBatch } from '@/lib/aliyun-translate';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 本地大淘客中转服务
const DATAOKE_PROXY_URL = process.env.DATAOKE_PROXY_URL || 'http://127.0.0.1:3001';

// 检测语言
function detectLanguage(text: string): string {
  if (/[\u4e00-\u9fa5]/.test(text)) return 'zh';
  return 'en';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, page = 1, pageSize = 20, targetLang = 'en' } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    console.log(`[Dataoke Search] Original query: "${query}", targetLang: ${targetLang}`);

    // Step 1: 检测查询语言
    const sourceLang = detectLanguage(query);
    console.log(`[Dataoke Search] Detected language: ${sourceLang}`);

    // Step 2: 如果是非中文，翻译成中文给大淘客
    let searchQuery = query;
    if (sourceLang !== 'zh') {
      searchQuery = await translateText(query, sourceLang, 'zh');
      console.log(`[Dataoke Search] Translated query: "${searchQuery}"`);
    }

    // Step 3: 调用大淘客搜索（本地中转）
    const response = await fetch(`${DATAOKE_PROXY_URL}/api/search/taobao`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: searchQuery,
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

    // Step 4: 转换商品数据格式
    let products: { id: string; title: string; originalTitle?: string; price: number; originalPrice?: number; image: string; shop: string; sales: string; link: string; coupon: string }[] = (data.products || []).map((item: any) => ({
      id: String(item.id || item.goodsId || item.itemId || Math.random().toString(36)),
      title: item.title || item.goodsName || 'Unknown Product',
      originalTitle: item.originalTitle || item.title || item.goodsName,
      price: parseFloat(item.price || item.actualPrice || item.zkFinalPrice || 0),
      originalPrice: item.originalPrice ? parseFloat(item.originalPrice) : undefined,
      image: item.image || item.pic || item.mainPic || item.pictUrl || '',
      shop: item.shop || item.shopTitle || item.nick || 'Taobao Shop',
      sales: item.sales || item.volume || item.deal || '0',
      link: item.link || item.itemLink || item.url || item.couponLink || '',
      coupon: item.coupon || item.couponInfo || item.couponAmount || '',
    }));

    // Step 5: 如果用户语言不是中文，翻译商品标题回用户语言
    if (targetLang !== 'zh' && products.length > 0) {
      console.log(`[Dataoke Search] Translating ${products.length} product titles to ${targetLang}`);
      const titles = products.map(p => p.title || 'Unknown Product');
      const translatedTitles = await translateBatch(titles, 'zh', targetLang);
      products = products.map((p, i) => ({
        ...p,
        originalTitle: p.title,
        title: translatedTitles[i] || p.title
      }));
    }

    return NextResponse.json({
      success: true,
      query,
      translatedQuery: searchQuery !== query ? searchQuery : undefined,
      page,
      pageSize,
      products,
      total: data.total || products.length,
      hasMore: data.hasMore || products.length >= pageSize
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
