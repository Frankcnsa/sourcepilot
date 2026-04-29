import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const APP_KEY = process.env.DATAOKE_APP_KEY || '69dd9a4187317';
const APP_SECRET = process.env.DATAOKE_APP_SECRET || '1e13c6ff3546d62dcb1974512fe3f012';
const PID = process.env.DATAOKE_PID || 'mm_10137243400_3409950038_116254350422'; // 主人提供的PID

// 正确的大淘客签名（2020年升级版）
function generateSignRan(): { nonce: string; timer: string; signRan: string } {
  const nonce = Math.random().toString().substr(2, 6);
  const timer = Date.now().toString();
  const signStr = `appKey=${APP_KEY}&timer=${timer}&nonce=${nonce}&key=${APP_SECRET}`;
  const signRan = crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();
  return { nonce, timer, signRan };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { goodsId, itemId, pid } = body;
    
    if (!goodsId && !itemId) {
      return NextResponse.json(
        { error: 'goodsId or itemId is required' },
        { status: 400 }
      );
    }
    
    const targetId = goodsId || itemId;
    const targetPid = pid || PID;
    
    console.log(`[Convert Link] goodsId: ${targetId}, pid: ${targetPid}`);
    
    const { nonce, timer, signRan } = generateSignRan();
    
    // 构建参数（大淘客官方要求的GET参数）
    const params = new URLSearchParams({
      appKey: APP_KEY,
      version: 'v1.3.1', // 转链接口用v1.3.1
      nonce,
      timer,
      signRan,
      goodsId: targetId,
      pid: targetPid
    });
    
    const url = `https://openapi.dataoke.com/api/tb-service/get-privilege-link?${params.toString()}`;
    
    console.log(`[Convert Link] Request URL: ${url.substring(0, 100)}...`);
    
    const response = await fetch(url, { method: 'GET' });
    const data = await response.json();
    
    console.log(`[Convert Link] Response code: ${data.code}, msg: ${data.msg}`);
    
    if (data.code !== 0) {
      return NextResponse.json(
        { error: data.msg || 'Convert failed', code: data.code },
        { status: 500 }
      );
    }
    
    const result = data.data || {};
    
    return NextResponse.json({
      success: true,
      shortUrl: result.shortUrl,
      longUrl: result.couponClickUrl || result.itemUrl,
      tpwd: result.tpwd,
      couponInfo: result.couponInfo,
      couponClickUrl: result.couponClickUrl,
      itemUrl: result.itemUrl
    });
    
  } catch (error) {
    console.error('[Convert Link] Error:', error);
    return NextResponse.json(
      { error: 'Convert failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
