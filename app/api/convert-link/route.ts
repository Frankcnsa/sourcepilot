import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 阿里云FC中转服务地址
const DATAOKE_PROXY_URL = 'https://dataoke-proxy-tlkpqnacev.cn-shanghai.fcapp.run';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    console.log(`[Convert Link] Converting URL: ${url}`);

    // 调用阿里云FC中转服务（高效转链）
    const response = await fetch(`${DATAOKE_PROXY_URL}/convert-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Convert Link] Error:', response.status, errorText);
      // 如果转链失败，返回原始链接
      return NextResponse.json({
        success: false,
        link: url,
        error: `Convert failed: ${response.status}`
      });
    }

    const data = await response.json();

    return NextResponse.json({
      success: data.success || true,
      link: data.link || data.shortLink || data.tpwd || data.clickUrl || url,
      originalUrl: url,
      ...(data.couponInfo && { couponInfo: data.couponInfo }),
    });

  } catch (error) {
    console.error('[Convert Link] Error:', error);
    // 出错时返回原始链接，不影响用户体验
    return NextResponse.json({
      success: false,
      link: request.json().then(b => b.url).catch(() => ''),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
