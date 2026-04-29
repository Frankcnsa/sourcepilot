import crypto from 'crypto';

const APP_KEY = process.env.DATAOKE_APP_KEY || '69dd9a4187317';
const APP_SECRET = process.env.DATAOKE_APP_SECRET || '1e13c6ff3546d62dcb1974512fe3f012';
const PROXY_URL = process.env.DATAOKE_PROXY_URL || 'http://111.230.10.101:3001';

/**
 * 大淘客新签名（2020年5月升级）
 */
export function generateSignRan(): { nonce: string; timer: string; signRan: string } {
  const nonce = Math.random().toString().substr(2, 6);
  const timer = Date.now().toString();
  const signStr = `appKey=${APP_KEY}&timer=${timer}&nonce=${nonce}&key=${APP_SECRET}`;
  const signRan = crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();
  return { nonce, timer, signRan };
}

/**
 * 通过代理调大淘客API（使用action字段区分）
 */
export async function dataokeRequestViaProxy(
  action: string,
  params: Record<string, string | number> = {}
): Promise<any> {
  const { nonce, timer, signRan } = generateSignRan();
  
  // 构建请求体（POST方式，像search/dataoke那样）
  const body = {
    appKey: APP_KEY,
    version: 'v1.3.0',
    nonce,
    timer,
    signRan,
    action,
    ...params
  };
  
  console.log(`[Dataoke Proxy] action=${action}`);
  
  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  
  if (!response.ok) {
    throw new Error(`Proxy error: ${response.status} ${await response.text()}`);
  }
  
  const data = await response.json();
  
  if (data.code !== 0) {
    throw new Error(`Dataoke business error: ${data.msg}`);
  }
  
  return data.data;
}

/**
 * 标准化产品格式
 */
export function normalizeProduct(item: any): any {
  return {
    id: String(item.id || item.goodsId || Math.random().toString(36)),
    title: item.title || item.dtitle || 'Unknown',
    originalTitle: item.dtitle || item.title || '',
    price: parseFloat(item.actualPrice || item.actualprice || item.price || 0),
    originalPrice: item.originalPrice ? parseFloat(item.originalPrice) : undefined,
    image: item.mainPic || item.pic || '',
    shop: item.shopName || item.shop || 'Taobao Shop',
    sales: String(item.monthSales || item.monthlySales || 0),
    monthSales: item.monthSales || 0,
    link: item.couponLink || item.itemLink || '',
    couponInfo: item.couponInfo || (item.couponPrice ? `满${item.couponConditions}减${item.couponPrice}` : ''),
    shopType: item.shopType || 0,
    desc: item.desc || '',
    brandName: item.brandName || '',
    couponLink: item.couponLink || '',
    couponId: item.couponId || ''
  };
}
