import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const DATAOKE_APP_KEY = process.env.DATAOKE_APP_KEY || '69dd9a4187317';
const DATAOKE_APP_SECRET = process.env.DATAOKE_APP_SECRET || '1e13c6ff3546d62dcb1974512fe3f012';
const DATAOKE_BASE_URL = 'https://openapi.dataoke.com';

// 生成大淘客签名
function generateDataokeSign(params: Record<string, string>, appSecret: string): string {
  const filteredParams: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(params)) {
    if (key !== 'sign' && value !== undefined && value !== null && value !== '') {
      filteredParams[key] = String(value);
    }
  }
  
  const sortedKeys = Object.keys(filteredParams).sort();
  let signStr = appSecret;
  
  for (const key of sortedKeys) {
    signStr += key + filteredParams[key];
  }
  signStr += appSecret;
  
  return crypto.createHash('md5').update(signStr).digest('hex');
}

// 转链接口
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
    const targetPid = pid || 'mm_123_456_789'; // 默认PID，应该配置到环境变量
    
    console.log(`[Dataoke Convert] goodsId: ${targetId}, pid: ${targetPid}`);
    
    // 构建参数
    const params: Record<string, string> = {
      appKey: DATAOKE_APP_KEY,
      version: 'v1.3.1',
      goodsId: targetId,
      pid: targetPid
    };
    
    params.sign = generateDataokeSign(params, DATAOKE_APP_SECRET);
    
    const queryStr = new URLSearchParams(params).toString();
    const url = `${DATAOKE_BASE_URL}/api/tb-service/get-privilege-link?${queryStr}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    const data = await response.json();
    
    if (data.code !== 0) {
      console.error('[Dataoke Convert] API error:', data);
      return NextResponse.json(
        { error: data.msg || 'Convert failed', code: data.code },
        { status: 500 }
      );
    }
    
    const result = data.data || {};
    
    return NextResponse.json({
      success: true,
      shortUrl: result.shortUrl,
      longUrl: result.longUrl,
      tpwd: result.tpwd, // 淘口令
      couponInfo: result.couponInfo,
      couponClickUrl: result.couponClickUrl
    });
    
  } catch (error) {
    console.error('[Dataoke Convert] Error:', error);
    return NextResponse.json(
      { error: 'Convert failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
