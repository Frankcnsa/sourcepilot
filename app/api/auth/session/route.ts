import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ user: null, isAuthenticated: false });
    }
    
    return NextResponse.json({ 
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split('@')[0],
      },
      isAuthenticated: true 
    });
  } catch (error) {
    return NextResponse.json({ user: null, isAuthenticated: false });
  }
}
