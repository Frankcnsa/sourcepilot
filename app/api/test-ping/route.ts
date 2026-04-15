import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const ONEBOUND_API_KEY = process.env.ONEBOUND_API_KEY || '';
  const ONEBOUND_API_SECRET = process.env.ONEBOUND_API_SECRET || '';

  // 立即返回，不等待API
  return NextResponse.json({
    success: true,
    test: 'ping',
    hasKey: !!ONEBOUND_API_KEY,
    hasSecret: !!ONEBOUND_API_SECRET,
    keyLength: ONEBOUND_API_KEY.length,
    secretLength: ONEBOUND_API_SECRET.length,
    timestamp: new Date().toISOString()
  });
}
