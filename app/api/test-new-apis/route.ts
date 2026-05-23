import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const APP_KEY = process.env.DATAOKE_APP_KEY || '69dd9a4187317';
const APP_SECRET = process.env.DATAOKE_APP_SECRET || '1e13c6ff3546d62dcb1974512fe3f012';

function generateSign(): { nonce: string; timer: string; signRan: string } {
  const nonce = Math.random().toString().substr(2, 6);
  const timer = Date.now().toString();
  const signStr = `appKey=${APP_KEY}&timer=${timer}&nonce=${nonce}&key=${APP_SECRET}`;
  const signRan = crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();
  return { nonce, timer, signRan };
}

export async function GET(request: NextRequest) {
  const results = [];
  
  // 1. 优惠券查询 (id=60)
  try {
    const { nonce, timer, signRan } = generateSign();
    const params = new URLSearchParams({
      appKey: APP_KEY,
      version: 'v1.0.0',
      nonce,
      timer,
      signRan,
      couonId: '271dbf9d1f7c498eb8f19ae3cc38f5de' // 示例中的couonId
    });
    const url = `https://openapi.dataoke.com/api/couon/query?${params.toString()}`;
    const start = Date.now();
    const res = await fetch(url, { method: 'GET' });
    const data = await res.json();
    const time = Date.now() - start;
    
    results.push({
      name: '优惠券查询(id=60)',
      path: '/api/couon/query',
      success: data.code === 0,
      code: data.code,
      msg: data.msg,
      couonAmount: data.data?.couonAmount,
      timeMs: time
    });
  } catch (e: any) {
    results.push({ name: '优惠券查询(id=60)', success: false, error: e.message });
  }
  
  // 2. 剪切板识别 (id=80)
  try {
    const { nonce, timer, signRan } = generateSign();
    const params = new URLSearchParams({
      appKey: APP_KEY,
      version: 'v1.0.0',
      nonce,
      timer,
      signRan,
      content: '【包邮】【3件】巴拉巴拉旗下棉致男女童纯棉短袖T恤上衣【6月28日发完】价格：59.90元 券后价：32.90元'
    });
    const url = `https://openapi.dataoke.com/api/pmc/clipboard?${params.toString()}`;
    const start = Date.now();
    const res = await fetch(url, { method: 'GET' });
    const data = await res.json();
    const time = Date.now() - start;
    
    results.push({
      name: '剪切板识别(id=80)',
      path: '/api/pmc/clipboard',
      success: data.code === 0,
      code: data.code,
      msg: data.msg,
      itemId: data.data?.itemId,
      timeMs: time
    });
  } catch (e: any) {
    results.push({ name: '剪切板识别(id=80)', success: false, error: e.message });
  }
  
  return NextResponse.json({
    success: true,
    message: 'Vercel服务器直接GET调用新功能测试',
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
