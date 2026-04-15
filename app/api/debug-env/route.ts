import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const envCheck = {
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasOneboundKey: !!process.env.ONEBOUND_API_KEY,
    hasOneboundSecret: !!process.env.ONEBOUND_API_SECRET,
    oneboundKeyLength: process.env.ONEBOUND_API_KEY?.length || 0,
    oneboundSecretLength: process.env.ONEBOUND_API_SECRET?.length || 0,
  };

  return NextResponse.json({
    success: true,
    envCheck,
    timestamp: new Date().toISOString()
  });
}
