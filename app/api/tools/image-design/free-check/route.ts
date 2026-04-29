import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 延迟初始化 Supabase 客户端，避免构建时因环境变量缺失报错
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ used: false });
    }

    const supabase = getSupabaseClient();
    
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
