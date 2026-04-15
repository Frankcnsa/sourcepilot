import { NextRequest, NextResponse } from 'next/server';

// 使用API中转服务
const PROXY_URL = 'http://111.230.10.101:3000';

export async function POST(request: NextRequest) {
  console.log('[Search] Function called');
  
  try {
    const body = await request.json();
    const { query, page = 1, pageSize = 20 } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    // 调用中转服务
    const apiUrl = `${PROXY_URL}/api/onebound/taobao/item_search.php`;
    
    console.log('[Search] Calling proxy:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        q: query, 
        page, 
        page_size: pageSize 
      }),
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      query,
      source: 'onebound',
      data
    });

  } catch (error: any) {
    console.error('[Search] Error:', error.message);
    return NextResponse.json({ 
      error: error.message,
      fallback: true 
    }, { status: 500 });
  }
}