import crypto from 'crypto';

const APP_KEY = process.env.DATAOKE_APP_KEY || '69dd9a4187317';
const APP_SECRET = process.env.DATAOKE_APP_SECRET || '1e13c6ff3546d62dcb1974512fe3f012';
const PROXY_URL = process.env.DATAOKE_PROXY_URL || 'http://111.230.10.101:3001';

// 第三方封装域名（大淘客单页用）
const THIRD_PARTY_BASE = 'https://dtkapi.ffquan.cn';
const CMSJ_BASE = 'https://cmsjapi.dataoke.com';

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
 * 疯抢榜 - 对应单页“疯抢榜”
 * 端点: /dtk_go_app_api/v1/page-goods-ranking
 * 返回: { code: 1, data: [...] }
 */
export async function getRankingGoods(
  cId: number = 1,
  pageNo: number = 1,
  pageSize: number = 10
): Promise<any> {
  const url = `${THIRD_PARTY_BASE}/dtk_go_app_api/v1/page-goods-ranking?cId=${cId}&pageNo=${pageNo}&pageSize=${pageSize}&singlePageId=9&appKey=${APP_KEY}`;
  console.log(`[Dataoke] getRankingGoods: ${url}`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (data.code !== 1) throw new Error(data.msg || 'Ranking API failed');
  return data; // 返回 { code: 1, data: [...] }
}

/**
 * 9.9包邮 - 对应单页“9.9包邮”
 * 端点: /dtk_go_app_api/v1/page-goods-nine-cate
 */
export async function getNineGoods(
  pageNo: number = 1,
  pageSize: number = 10
): Promise<any> {
  const url = `${THIRD_PARTY_BASE}/dtk_go_app_api/v1/page-goods-nine-cate?pageNo=${pageNo}&pageSize=${pageSize}&appKey=${APP_KEY}`;
  console.log(`[Dataoke] getNineGoods: ${url}`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (data.code !== 1) throw new Error(data.msg || 'Nine API failed');
  return data.data; // 返回分类列表
}

/**
 * 咚咚抢 - 对应单页“咚咚抢”
 * 端点: /dtk_go_app_api/v1/page-goods-ddq
 */
export async function getDDQGoods(
  pageId: number = 1,
  pageSize: number = 20,
  appKey: string = APP_KEY
): Promise<any> {
  const url = `${THIRD_PARTY_BASE}/dtk_go_app_api/v1/page-goods-ddq?pageId=${pageId}&pageSize=${pageSize}&appKey=${appKey}`;
  console.log(`[Dataoke] getDDQGoods: ${url}`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (data.code !== 200) throw new Error(data.msg || 'DDQ API failed');
  return data.data; // 返回 { ddqSessions: [...] }
}

/**
 * 百亿补贴 - 对应单页“百亿补贴”
 * 端点: /dtk_java_views_api/api/tb/activity/promote/bybt
 */
export async function getBaiYiGoods(
  pageId: number = 1,
  pageSize: number = 20,
  appKey: string = APP_KEY
): Promise<any> {
  const url = `${THIRD_PARTY_BASE}/dtk_java_views_api/api/tb/activity/promote/bybt?pageId=${pageId}&pageSize=${pageSize}&appKey=${appKey}`;
  console.log(`[Dataoke] getBaiYiGoods: ${url}`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (data.code !== 200) throw new Error(data.msg || 'BaiYi API failed');
  return data.data; // 返回 { list: [...] }
}

/**
 * 高佣精选 - 分类
 * 端点: /api/category/single/page/get-single-page
 */
export async function getSinglePageCategories(): Promise<any> {
  const url = `${CMSJ_BASE}/api/category/single/page/get-single-page?pageId=9&userId=1&entityId=`;
  console.log(`[Dataoke] getSinglePageCategories: ${url}`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (data.code !== 0) throw new Error(data.msg || 'SinglePage categories failed');
  return data.data; // 返回 { categoryRespVOS: [...] }
}

/**
 * 高佣精选 - 商品列表
 * 端点: /api/category/single/page/get-goods-by-categoryId
 */
export async function getGoodsForCategory(
  categoryId: string,
  pageNo: number = 1,
  pageSize: number = 10
): Promise<any> {
  const url = `${CMSJ_BASE}/api/category/single/page/get-goods-by-categoryId?categoryId=${categoryId}&pageNo=${pageNo}&pageSize=${pageSize}&singlePageId=9&appKey=${APP_KEY}`;
  console.log(`[Dataoke] getGoodsForCategory: ${url}`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (data.code !== 0) throw new Error(data.msg || 'Goods for category failed');
  return data.data; // 返回 { lists: [...] }
}

/**
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
