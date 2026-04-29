import { NextRequest, NextResponse } from 'next/server';

// 允许的单页名称（白名单）
const ALLOWED_PAGES = [
  '9.9-baoyou',
  'baiyi-butie',
  'dongdongqiang',
  'fengqiangbang',
  'gaoyong-jingxuan',
  'zheshangzhe',
];

export async function GET(
  request: NextRequest,
  { params }: { params: { pageName: string } }
) {
  const pageName = params.pageName;

  // 校验pageName
  if (!ALLOWED_PAGES.includes(pageName)) {
    return NextResponse.json(
      { error: 'Invalid page name' },
      { status: 400 }
    );
  }

  const targetUrl = `http://111.230.10.101:3003/${pageName}.html`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'SourcePilot-Proxy/1.0',
      },
      // 超时10秒
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const html = await response.text();

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        // 允许缓存（1小时）
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch upstream resource' },
      { status: 502 }
    );
  }
}
