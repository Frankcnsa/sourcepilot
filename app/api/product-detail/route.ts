import { NextRequest, NextResponse } from 'next/server';
import { getWanbangDetail } from '@/lib/wanbang-api';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { num_iid } = body;

    if (!num_iid) {
      return NextResponse.json(
        { success: false, error: 'num_iid is required' },
        { status: 400 }
      );
    }

    console.log(`[Product Detail] 获取商品详情, ID: ${num_iid}`);

    // 1. 获取商品详情（后端只做搬运，返回全量中文数据）
    const detail = await getWanbangDetail(num_iid);

    // 2. 直接返回全量数据，不做任何翻译或字段筛选
    return NextResponse.json({
      success: true,
      num_iid,
      data: detail // 前端将负责翻译和展示
    });

  } catch (error) {
    console.error('[Product Detail] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to get product detail',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
