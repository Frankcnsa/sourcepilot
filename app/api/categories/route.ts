import { NextResponse } from 'next/server';
import { translateBatch } from '@/lib/aliyun-translate';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DATAOKE_PROXY_URL = process.env.DATAOKE_PROXY_URL || 'http://127.0.0.1:3001';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetLang = searchParams.get('lang') || 'en';

    const response = await fetch(`${DATAOKE_PROXY_URL}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'super-categories' })
    });

    if (!response.ok) {
      throw new Error(`FC error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success || !data.data) {
      return NextResponse.json({ success: false, categories: [] });
    }

    let categories = data.data || [];

    // Translate category names if not Chinese
    if (targetLang !== 'zh' && categories.length > 0) {
      const names = categories.map((c: any) => c.cname);
      const translated = await translateBatch(names, 'zh', targetLang);
      categories = categories.map((c: any, i: number) => ({
        ...c,
        cname: translated[i] || c.cname
      }));
    }

    return NextResponse.json({
      success: true,
      categories
    });

  } catch (error) {
    console.error('[Categories] Error:', error);
    return NextResponse.json({ success: false, categories: [] });
  }
}
