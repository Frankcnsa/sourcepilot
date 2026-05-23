/**
 * SourcePilot 统一代理路由
 * 所有大淘客相关请求统一转发到中转服务 (111.230.10.101:3001)
 */
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const PROXY_URL = process.env.PROXY_URL || 'http://111.230.10.101:3001';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join('/');
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${PROXY_URL}/api/${path}${searchParams ? '?' + searchParams : ''}`;

  console.log(`[Proxy] GET /api/${path} → ${url}`);

  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000)
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error(`[Proxy] Error: ${error.message}`);
    return NextResponse.json(
      { code: -1, msg: `Proxy error: ${error.message}` },
      { status: 502 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join('/');
  let body: any = {};

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const url = `${PROXY_URL}/api/${path}`;
  console.log(`[Proxy] POST /api/${path} → ${url}`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000)
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error(`[Proxy] Error: ${error.message}`);
    return NextResponse.json(
      { code: -1, msg: `Proxy error: ${error.message}` },
      { status: 502 }
    );
  }
}
