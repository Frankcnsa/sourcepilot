import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

// 强制动态渲染
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// SendGrid 配置
const FROM_EMAIL = 'noreply@sourcepilot.cn';
const FROM_NAME = 'SourcePilot';

export async function POST(request: NextRequest) {
  try {
    // 获取 API Key（在函数内部获取，确保使用最新环境变量）
    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY?.trim();
    
    // 检查 API Key 是否配置
    if (!SENDGRID_API_KEY) {
      return NextResponse.json(
        { error: 'SendGrid API Key not configured' },
        { status: 500 }
      );
    }

    // 设置 API Key
    sgMail.setApiKey(SENDGRID_API_KEY);

    const { to, subject, text, html } = await request.json();

    // 验证必填字段
    if (!to || !subject || (!text && !html)) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, text/html' },
        { status: 400 }
      );
    }

    // 构建邮件
    const msg = {
      to,
      from: FROM_EMAIL,  // 简化为只用邮箱地址
      subject,
      text: text || '',
      html: html || text || '',
    };

    // 发送邮件
    await sgMail.send(msg);

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      to,
      subject,
    });
  } catch (error: any) {
    console.error('SendGrid Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to send email',
        details: error.response?.body?.errors || error.message 
      },
      { status: 500 }
    );
  }
}
