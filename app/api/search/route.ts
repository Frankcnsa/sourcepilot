import { NextRequest, NextResponse } from 'next/server';
import { searchWanbang } from '@/lib/wanbang-api';
import { translateText, translateBatch, detectLanguage, SUPPORTED_LANGUAGES } from '@/lib/aliyun-translate';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      query, 
      page = 1, 
      pageSize = 20,
      sourceLang = 'auto', // 用户输入语言
      targetLang = 'en'    // 显示语言
    } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    console.log(`[Search] Query: "${query}", Page: ${page}, Lang: ${sourceLang} -> ${targetLang}`);

    // 1. 检测输入语言
    const detectedLang = sourceLang === 'auto' ? detectLanguage(query) : sourceLang;
    
    // 2. 如果输入不是中文，先翻译成中文（万邦需要中文搜索）
    let searchQuery = query;
    if (detectedLang !== 'zh') {
      try {
        searchQuery = await translateText(query, detectedLang, 'zh');
        console.log(`[Search] Translated "${query}" -> "${searchQuery}"`);
      } catch (err) {
        console.warn('[Search] Translation failed, using original query');
        searchQuery = query;
      }
    }

    // 3. 调用万邦搜索
    const { products, total } = await searchWanbang(searchQuery, page, pageSize);

    // 4. 翻译商品信息回用户语言（如果不是中文）
    let translatedProducts = products;
    if (targetLang !== 'zh' && products.length > 0) {
      try {
        // 批量翻译标题
        const titles = products.map(p => p.title);
        const translatedTitles = await translateBatch(titles, 'zh', targetLang);
        
        // 批量翻译店铺名
        const shops = products.map(p => p.seller_nick);
        const translatedShops = await translateBatch(shops, 'zh', targetLang);
        
        translatedProducts = products.map((p, i) => ({
          ...p,
          title: translatedTitles[i] || p.title,
          seller_nick: translatedShops[i] || p.seller_nick
        }));
      } catch (err) {
        console.warn('[Search] Product translation failed, returning original');
      }
    }

    return NextResponse.json({
      success: true,
      query,
      searchQuery, // 实际搜索用的中文词
      page,
      pageSize,
      total,
      sourceLang: detectedLang,
      targetLang,
      products: translatedProducts
    });

  } catch (error) {
    console.error('[Search] Error:', error);
    return NextResponse.json(
      { 
        error: 'Search failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
