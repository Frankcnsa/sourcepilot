import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const results: any = {};
  
  // 测试1: 访问百度
  try {
    const start = Date.now();
    const res = await fetch('https://www.baidu.com', { method: 'GET', signal: AbortSignal.timeout(5000) });
    results.baidu = { status: res.status, time: Date.now() - start };
  } catch (e: any) {
    results.baidu = { error: e.message };
  }
  
  // 测试2: 访问本地中转服务（Vercel 函数无法访问）
  try {
    const start = Date.now();
    const res = await fetch('http://111.230.10.101:3001/health', { method: 'GET', signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    results.proxy = { status: res.status, data, time: Date.now() - start };
  } catch (e: any) {
    results.proxy = { error: e.message };
  }
  
  // 测试3: 直接访问大淘客 API
  try {
    const start = Date.now();
    const res = await fetch('https://openapi.dataoke.com', { method: 'GET', signal: AbortSignal.timeout(5000) });
    results.dataoke = { status: res.status, time: Date.now() - start };
  } catch (e: any) {
    results.dataoke = { error: e.message };
  }
  
  return NextResponse.json(results);
}
