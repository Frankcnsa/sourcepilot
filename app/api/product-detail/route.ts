import { NextRequest, NextResponse } from 'next/server';
import { getWanbangDetail } from '@/lib/wanbang-api';
import { translateText, translateBatch } from '@/lib/aliyun-translate';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      num_iid,
      targetLang = 'en'
    } = body;

    if (!num_iid) {
      return NextResponse.json(
        { error: 'num_iid is required' },
        { status: 400 }
      );
    }

    console.log(`[Product Detail] num_iid: ${num_iid}, targetLang: ${targetLang}`);

    // 1. 获取商品详情
    const detail = await getWanbangDetail(num_iid);

    // 2. 翻译商品信息
    let translatedDetail = detail;
    if (targetLang !== 'zh') {
      try {
        const [translatedTitle, translatedShop, translatedDesc] = await Promise.all([
          translateText(detail.title, 'zh', targetLang),
          translateText(detail.seller_nick, 'zh', targetLang),
          detail.desc ? translateText(detail.desc, 'zh', targetLang) : Promise.resolve('')
        ]);

        // 翻译SKU属性
        let translatedSkus = detail.skus;
        if (detail.skus && detail.skus.length > 0) {
          const skuProps = detail.skus.map((sku: any) => sku.properties_name || sku.props_name || '');
          const translatedSkuProps = await translateBatch(skuProps, 'zh', targetLang);
          
          translatedSkus = detail.skus.map((sku: any, i: number) => ({
            ...sku,
            properties_name: translatedSkuProps[i] || sku.properties_name
          }));
        }

        // 翻译商品属性
        let translatedProps = detail.props;
        if (detail.props && detail.props.length > 0) {
          const propNames = detail.props.map((prop: any) => prop.name || '');
          const translatedPropNames = await translateBatch(propNames, 'zh', targetLang);
          
          translatedProps = detail.props.map((prop: any, i: number) => ({
            ...prop,
            name: translatedPropNames[i] || prop.name
          }));
        }

        translatedDetail = {
          ...detail,
          title: translatedTitle || detail.title,
          seller_nick: translatedShop || detail.seller_nick,
          desc: translatedDesc || detail.desc,
          skus: translatedSkus,
          props: translatedProps
        };
      } catch (err) {
        console.warn('[Product Detail] Translation failed, returning original');
      }
    }

    return NextResponse.json({
      success: true,
      num_iid,
      targetLang,
      product: translatedDetail
    });

  } catch (error) {
    console.error('[Product Detail] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get product detail',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
