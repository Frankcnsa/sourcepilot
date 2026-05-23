import { NextRequest, NextResponse } from 'next/server';

// 强制动态渲染
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 阿里云百炼 API 配置
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
const DASHSCOPE_BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';

// 使用 qwen-vl-plus 进行图像识别
const VISION_MODEL = 'qwen-vl-plus';

export async function POST(request: NextRequest) {
  try {
    // 检查 API Key
    if (!DASHSCOPE_API_KEY) {
      return NextResponse.json(
        { error: 'Vision service not configured' },
        { status: 500 }
      );
    }

    // 解析请求体
    const body = await request.json();
    const { imageUrl, imageBase64, prompt = "What product is in this image? Describe its features, specifications, and possible use cases." } = body;

    // 构建图像消息内容
    let imageContent: any;
    if (imageBase64) {
      // 使用 base64 编码的图片
      imageContent = {
        type: 'image_url',
        image_url: {
          url: `data:image/jpeg;base64,${imageBase64}`,
        },
      };
    } else if (imageUrl) {
      // 使用图片 URL
      imageContent = {
        type: 'image_url',
        image_url: {
          url: imageUrl,
        },
      };
    } else {
      return NextResponse.json(
        { error: 'Either imageUrl or imageBase64 is required' },
        { status: 400 }
      );
    }

    // 调用阿里云百炼视觉 API
    const response = await fetch(`${DASHSCOPE_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a product identification expert. Analyze the image and provide detailed information about the product including: product name, category, key features, specifications, materials, and potential suppliers or manufacturers. Be concise but informative.'
          },
          {
            role: 'user',
            content: [
              imageContent,
              { type: 'text', text: prompt }
            ]
          }
        ],
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Vision API error:', errorData);
      return NextResponse.json(
        { error: 'Vision service error', details: errorData },
        { status: response.status }
      );
    }

    // 处理响应
    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content;

    return NextResponse.json({
      success: true,
      model: VISION_MODEL,
      analysis,
      usage: data.usage,
    });

  } catch (error) {
    console.error('Vision API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    );
  }
}

// 简单的 GET 测试端点
export async function GET() {
  return NextResponse.json({
    status: 'Vision API is ready',
    model: VISION_MODEL,
    supportedFormats: ['imageUrl', 'imageBase64'],
    timestamp: new Date().toISOString(),
  });
}
