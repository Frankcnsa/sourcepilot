import { NextRequest, NextResponse } from 'next/server';

// 强制动态渲染
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 阿里云百炼 API 配置
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
const DASHSCOPE_BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';

// 可用的模型列表
const AVAILABLE_MODELS = {
  'qwen-turbo': '通义千问-Turbo',
  'qwen-plus': '通义千问-Plus',
  'qwen-max': '通义千问-Max',
  'deepseek-r1': 'DeepSeek-R1',
  'deepseek-v3': 'DeepSeek-V3',
};

// 默认模型
const DEFAULT_MODEL = 'qwen-turbo';

export async function POST(request: NextRequest) {
  try {
    // 检查 API Key
    if (!DASHSCOPE_API_KEY) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      );
    }

    // 解析请求体
    const body = await request.json();
    const { messages, model = DEFAULT_MODEL, stream = false } = body;

    // 验证请求
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      );
    }

    // 验证模型
    const selectedModel = AVAILABLE_MODELS[model as keyof typeof AVAILABLE_MODELS] 
      ? model 
      : DEFAULT_MODEL;

    // 调用阿里云百炼 API
    const response = await fetch(`${DASHSCOPE_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages,
        stream,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('DashScope API error:', errorData);
      return NextResponse.json(
        { error: 'AI service error', details: errorData },
        { status: response.status }
      );
    }

    // 处理流式响应
    if (stream) {
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // 处理普通响应
    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 获取可用模型列表
export async function GET() {
  return NextResponse.json({
    models: AVAILABLE_MODELS,
    default: DEFAULT_MODEL,
  });
}
