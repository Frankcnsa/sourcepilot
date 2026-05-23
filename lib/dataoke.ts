import crypto from 'crypto';

export const APP_KEY = process.env.DATAOKE_APP_KEY || '69dd9a4187317';
export const APP_SECRET = process.env.DATAOKE_APP_SECRET || '1e13c6ff3546d62dcb1974512fe3f012';
export const PROXY_URL = process.env.DATAOKE_PROXY_URL || 'http://111.230.10.101:3001';

export const THIRD_PARTY_BASE = 'https://dtkapi.ffquan.cn';
export const CMSJ_BASE = 'https://cmsjapi.dataoke.com';

export function generateSignRan(): { nonce: string; timer: string; signRan: string } {
  const nonce = Math.random().toString().substr(2, 6);
  const timer = Date.now().toString();
  const signStr = `appKey=${APP_KEY}&timer=${timer}&nonce=${nonce}&key=${APP_SECRET}`;
  const signRan = crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();
  return { nonce, timer, signRan };
}

export async function dataokeRequestViaProxy(
  action: string,
  params: Record<string, string | number> = {}
): Promise<any> {
  const { nonce, timer, signRan } = generateSignRan();
  
  const body = {
    appKey: APP_KEY,
    version: 'v1.3.0',
    nonce,
    timer,
    signRan,
    action,
    ...params
  };
  
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

export async function getRankingGoods(
  cId: number = 1,
  pageNo: number = 1,
  pageSize: number = 10
): Promise<any> {
  const url = `${THIRD_PARTY_BASE}/dtk_go_app_api/v1/page-goods-ranking?cId=${cId}&pageNo=${pageNo}&pageSize=${pageSize}&singlePageId=9&appKey=${APP_KEY}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (data.code !== 1) throw new Error(data.msg || 'Ranking API failed');
  return data;
}

export async function getNineGoods(
  pageNo: number = 1,
  pageSize: number = 10
): Promise<any> {
  const url = `${THIRD_PARTY_BASE}/dtk_go_app_api/v1/page-goods-nine-cate?pageNo=${pageNo}&pageSize=${pageSize}&appKey=${APP_KEY}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (data.code !== 1) throw new Error(data.msg || 'Nine API failed');
  return data.data;
}

export async function getDDQGoods(
  pageId: number = 1,
  pageSize: number = 20,
  appKey: string = APP_KEY
): Promise<any> {
  const url = `${THIRD_PARTY_BASE}/dtk_go_app_api/v1/page-goods-ddq?pageId=${pageId}&pageSize=${pageSize}&appKey=${appKey}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (data.code !== 200) throw new Error(data.msg || 'DDQ API failed');
  return data.data;
}

export async function getBaiYiGoods(
  pageId: number = 1,
  pageSize: number = 20,
  appKey: string = APP_KEY
): Promise<any> {
  const url = `${THIRD_PARTY_BASE}/dtk_java_views_api/api/tb/activity/promote/bybt?pageId=${pageId}&pageSize=${pageSize}&appKey=${appKey}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (data.code !== 200) throw new Error(data.msg || 'BaiYi API failed');
  return data.data;
}

export async function getSinglePageCategories(): Promise<any> {
  const url = `${CMSJ_BASE}/api/category/single/page/get-single-page?pageId=9&userId=1&entityId=`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (data.code !== 0) throw new Error(data.msg || 'SinglePage categories failed');
  return data.data;
}

export async function getGoodsForCategory(
  categoryId: string,
  pageNo: number = 1,
  pageSize: number = 10
): Promise<any> {
  const url = `${CMSJ_BASE}/api/category/single/page/get-goods-by-categoryId?categoryId=${categoryId}&pageNo=${pageNo}&pageSize=${pageSize}&singlePageId=9&appKey=${APP_KEY}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (data.code !== 0) throw new Error(data.msg || 'Goods for category failed');
  return data.data;
}
