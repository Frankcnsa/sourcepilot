import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const ONEBOUND_API_KEY = process.env.ONEBOUND_API_KEY || '';
  const ONEBOUND_API_SECRET = process.env.ONEBOUND_API_SECRET || '';

  return NextResponse.json({
    hasKey: !!ONEBOUND_API_KEY,
    hasSecret: !!ONEBOUND_API_SECRET,
    keyLength: ONEBOUND_API_KEY.length,
    secretLength: ONEBOUND_API_SECRET.length,
    timestamp: new Date().toISOString()
  });
}
