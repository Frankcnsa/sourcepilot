import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ used: false });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return NextResponse.json({ used: false });
    }

    const { data } = await supabase
      .from('users')
      .select('free_avatar_used')
      .eq('id', user.id)
      .single();

    return NextResponse.json({ used: data?.free_avatar_used || false });
  } catch {
    return NextResponse.json({ used: false });
  }
}
