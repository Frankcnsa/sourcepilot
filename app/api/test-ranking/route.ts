import { NextResponse } from 'next/server';
import { APP_KEY, THIRD_PARTY_BASE } from '@/lib/dataoke';

export async function GET() {
  try {
    const url = `${THIRD_PARTY_BASE}/dtk_go_app_api/v1/page-goods-ranking?cId=1&pageNo=1&pageSize=3&singlePageId=9&appKey=${APP_KEY}`;
    console.log('[Test Ranking] Fetching:', url);
    
    const response = await fetch(url);
    if (!response.ok) {
      return NextResponse.json(
        { error: `HTTP ${response.status}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json({
      ok: true,
      code: data.code,
      dataType: typeof data.data,
      hasData: !!data.data,
      itemCount: data.data && Array.isArray(data.data) ? data.data.length : (data.data && data.data.lists ? data.data.lists.length : 0),
      firstItemTitle: data.data && data.data[0]?.title || data.data?.lists?.[0]?.title || 'N/A',
    });
  } catch (error: any) {
    console.error('[Test Ranking] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
