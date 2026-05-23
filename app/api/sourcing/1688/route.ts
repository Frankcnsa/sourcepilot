import { NextRequest, NextResponse } from 'next/server';

// 强制动态渲染
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 1688 深度找 API 配置
const ALIBABA1688_APPCODE = process.env.ALIBABA1688_APPCODE;
const ALIBABA1688_API_URL = 'https://cbu.market.alicloudapi.com/deepsearch';

export async function POST(request: NextRequest) {
  try {
    // 检查 API Key
    if (!ALIBABA1688_APPCODE) {
      return NextResponse.json(
        { error: '1688 API not configured' },
        { status: 500 }
      );
    }

    // 解析请求体
    const body = await request.json();
    const { query, appId = '204996862' } = body;

    // 验证请求
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // 调用 1688 深度找 API
    const response = await fetch(ALIBABA1688_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `APPCODE ${ALIBABA1688_APPCODE}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: appId,
        input: [{
          role: 'user',
          content: [{ type: 'text', text: query }]
        }]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('1688 API error:', errorText);
      return NextResponse.json(
        { error: '1688 API error', details: errorText },
        { status: response.status }
      );
    }

    // 处理响应
    const data = await response.json();
    
    // 解析返回的商品数据
    const products = parseProducts(data);
    
    return NextResponse.json({
      success: true,
      query,
      products,
      total: products.length,
    });

  } catch (error) {
    console.error('1688 search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 解析 1688 API 返回的数据
function parseProducts(data: any): Product[] {
  if (!data || !Array.isArray(data.data)) {
    return [];
  }

  return data.data.map((item: any, index: number) => ({
    id: item.offerId || `product_${index}`,
    title: item.subject || item.title || '未命名商品',
    price: item.price || item.displayPrice || '价格面议',
    image: item.imageUrl || item.picUrl || '',
    supplier: item.companyName || item.supplier || '',
    location: item.city || item.province || '',
    minOrder: item.minOrderQuantity || item.moq || '1',
    url: item.detailUrl || item.offerUrl || '',
    description: item.description || '',
  }));
}

interface Product {
  id: string;
  title: string;
  price: string;
  image: string;
  supplier: string;
  location: string;
  minOrder: string;
  url: string;
  description: string;
}
