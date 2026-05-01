import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DATAOKE_PROXY_URL = process.env.DATAOKE_PROXY_URL || 'http://111.230.10.101:3001';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const seedId = searchParams.get('seed') || '46032636';

    const response = await fetch(`${DATAOKE_PROXY_URL}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'guess-you-like', id: seedId, size: limit })
    });

    if (!response.ok) {
      throw new Error(`FC error: ${response.status}`);
    }

    const data = await response.json();
    
    // 后端只做搬运：返回大淘客API的原始全量数据，不翻译、不筛选字段
    return NextResponse.json({
      success: true,
      page,
      limit,
      // 直接返回原始数据，前端负责翻译和展示
      data: data.data || [],
      hasMore: (data.data || []).length >= limit
    });

  } catch (error) {
    console.error('[Guess You Like] Error:', error);
    return NextResponse.json({ success: false, products: [], data: [] });
  }
}
