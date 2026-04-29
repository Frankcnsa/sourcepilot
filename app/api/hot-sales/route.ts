import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { translateBatch } from '@/lib/aliyun-translate';

export const dynamic = 'force-dynamic';

const APP_KEY = process.env.DATAOKE_APP_KEY || '69dd9a4187317';
const APP_SECRET = process.env.DATAOKE_APP_SECRET || '1e13c6ff3546d62dcb1974512fe3f012';

function generateSign(): { nonce: string; timer: string; signRan: string } {
  const nonce = Math.random().toString().substr(2, 6);
  const timer = Date.now().toString();
  const signStr = `appKey=${APP_KEY}&timer=${timer}&nonce=${nonce}&key=${APP_SECRET}`;
  const signRan = crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();
  return { nonce, timer, signRan };
}

function mapProduct(item: any): any {
  return {
    id: String(item.id || item.goodsId || Math.random().toString(36)),
    title: item.title || item.dtitle || 'Unknown',
    originalTitle: item.dtitle || item.title || '',
    price: parseFloat(item.actualPrice || item.price || 0),
    originalPrice: item.originalPrice ? parseFloat(item.originalPrice) : undefined,
    image: item.mainPic || item.pic || '',
    shop: item.shopName || item.shop || 'Taobao Shop',
    sales: String(item.monthSales || 0),
    monthSales: item.monthSales || 0,
    link: item.couponLink || item.itemLink || '',
    couponInfo: item.couponInfo || '',
    shopType: item.shopType || 0,
    desc: item.desc || '',
    brandName: item.brandName || '',
    couponLink: item.couponLink || ''
  };
}

// 实时热销榜（Top100）- 使用get-goods-list + 按2小时销量排序
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId') || '1';
    const pageSize = searchParams.get('pageSize') || '100';
    const targetLang = searchParams.get('lang') || 'zh';

    console.log(`[实时热销榜] pageId=${pageId}, pageSize=${pageSize}`);

    const { nonce, timer, signRan } = generateSign();
    
    // 使用get-goods-list，按2小时销量降序排序
    const url = new URL('https://openapi.dataoke.com/api/goods/get-goods-list');
    url.searchParams.set('appKey', APP_KEY);
    url.searchParams.set('version', 'v1.3.0');
    url.searchParams.set('nonce', nonce);
    url.searchParams.set('timer', timer);
    url.searchParams.set('signRan', signRan);
    url.searchParams.set('pageId', pageId);
    url.searchParams.set('pageSize', pageSize);
    url.searchParams.set('sort', 'twoHoursSales_desc'); // 按2小时销量降序

    const response = await fetch(url.toString());
    const data = await response.json();
    
    if (data.code !== 0) {
      throw new Error(`Dataoke error: ${data.msg}`);
    }

    let products = (data.data?.list || []).map(mapProduct);

    // 翻译
    if (targetLang !== 'zh' && products.length > 0) {
      const titles = products.map((p: any) => p.title);
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
      total: data.data?.totalNum || products.length,
      hasMore: products.length >= parseInt(pageSize)
    });

  } catch (error) {
    console.error('[实时热销榜] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
