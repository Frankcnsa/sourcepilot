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
      return NextResponse.json({ credits: 0 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return NextResponse.json({ credits: 0 });
    }

    const { data } = await supabase
      .from('users')
      .select('credits')
      .eq('id', user.id)
      .single();

    return NextResponse.json({ credits: data?.credits || 0 });
  } catch {
    return NextResponse.json({ credits: 0 });
  }
}
