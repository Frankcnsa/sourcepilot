import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const APP_KEY = process.env.DATAOKE_APP_KEY || '69dd9a4187317';
const APP_SECRET = process.env.DATAOKE_APP_SECRET || '1e13c6ff3546d62dcb1974512fe3f012';
const PID = process.env.DATAOKE_PID || 'mm_10137243400_3409950038_116254350422';

function generateSign(): { nonce: string; timer: string; signRan: string } {
  const nonce = Math.random().toString().substr(2, 6);
  const timer = Date.now().toString();
  const signStr = `appKey=${APP_KEY}&timer=${timer}&nonce=${nonce}&key=${APP_SECRET}`;
  const signRan = crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();
  return { nonce, timer, signRan };
}

// 尝试多种路径
async function testMultiPaths(name: string, basePaths: string[], params: Record<string,string>) {
  for (const base of basePaths) {
    try {
      const { nonce, timer, signRan } = generateSign();
      const fullParams = new URLSearchParams({ 
        appKey: APP_KEY, 
        version: 'v1.0.0', 
        nonce, 
        timer, 
        signRan, 
        ...params 
      });
      const url = `https://openapi.dataoke.com${base}?${fullParams.toString()}`;
      const res = await fetch(url, { method: 'GET' });
      const text = await res.text();
      
      try {
        const data = JSON.parse(text);
        if (data.code === 0) {
          return { 
            name, 
            path: base, 
            success: true, 
            productCount: data.data?.list?.length || data.data?.length || 0 
          };
        }
      } catch (e) {
        // 不是JSON，继续尝试下一个路径
      }
    } catch (e) {}
  }
  return { name, paths: basePaths, success: false, error: 'All paths failed' };
}

export async function GET(request: NextRequest) {
  const results = [];
  
  // 1. 猜你喜欢 (id=16) - 尝试多种路径
  results.push(await testMultiPaths('猜你喜欢(id=16)', [
    '/api/goods/guess-you-like',
    '/api/guess-you-like',
    '/api/goods/guess-you-like-list',
    '/api/guess-you-like/get'
  ], { pageNo: '1', pageSize: '2' }));
  
  // 2. 9.9包邮 (id=15) - 尝试多种路径
  results.push(await testMultiPaths('9.9包邮(id=15)', [
    '/api/goods/nine-nine',
    '/api/nine-nine',
    '/api/goods/nine-nine-goods',
    '/api/nine-nine-goods'
  ], { pageId: '1', pageSize: '2' }));
  
  // 3. 实时热销榜 - 尝试多种路径
  results.push(await testMultiPaths('实时热销榜', [
    '/api/goods/get-top100-goods',
    '/api/goods/top100-goods',
    '/api/goods/top-100-goods',
    '/api/top100-goods'
  ], { pageId: '1', pageSize: '2' }));
  
  // 4. 转链 (id=7) - 需要正确商品ID
  try {
    const { nonce, timer, signRan } = generateSign();
    const url = new URL('https://openapi.dataoke.com/api/tb-service/get-privilege-link');
    url.searchParams.set('appKey', APP_KEY);
    url.searchParams.set('version', 'v1.3.1');
    url.searchParams.set('nonce', nonce);
    url.searchParams.set('timer', timer);
    url.searchParams.set('signRan', signRan);
    url.searchParams.set('goodsId', '5aFzC7KzPw8q'); // 新格式ID
    url.searchParams.set('pid', PID);
    
    const res = await fetch(url.toString());
    const data = await res.json();
    results.push({
      name: '转链(id=7)',
      path: '/api/tb-service/get-privilege-link',
      success: data.code === 0,
      code: data.code,
      msg: data.msg,
      hasShortUrl: !!data.data?.shortUrl
    });
  } catch (e: any) {
    results.push({ name: '转链(id=7)', success: false, error: e.message });
  }
  
  return NextResponse.json({
    success: true,
    message: 'Vercel服务器直接GET调用测试（多路径尝试）',
    vercelRegion: process.env.VERCEL_REGION || 'unknown',
    results,
    summary: {
      total: results.length,
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    }
  });
}

export const dynamic = 'force-dynamic';
