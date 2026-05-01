import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

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

// 后端只做搬运，返回全量中文数据
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId') || '1';
    const pageSize = searchParams.get('pageSize') || '20';

    const { nonce, timer, signRan } = generateSign(); 
    
    const url = new URL('https://openapi.dataoke.com/api/goods/get-goods-list');
    url.searchParams.set('appKey', APP_KEY);
    url.searchParams.set('version', 'v1.3.0');
    url.searchParams.set('nonce', nonce);
    url.searchParams.set('timer', timer);
    url.searchParams.set('signRan', signRan);
    url.searchParams.set('pageId', pageId);
    url.searchParams.set('pageSize', pageSize);

    const response = await fetch(url.toString());
    const data = await response.json();
    
    if (data.code !== 0) {
      throw new Error(`Dataoke error: ${data.msg}`);
    }

    // 后端只做搬运：返回大淘客API的原始全量数据
    return NextResponse.json({
      success: true,
      products: data.data?.list || [],
      total: data.data?.totalNum || 0,
      hasMore: (data.data?.list || []).length >= parseInt(pageSize)
    });

  } catch (error) {
    console.error('[每日爆品] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
