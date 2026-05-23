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
    const supabase = getSupabaseClient();
    
    const { searchParams } = new URL(req.url);
    
    const category = searchParams.get('category');
    const keyword = searchParams.get('keyword');
    const address = searchParams.get('address');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20'), 100);
    
    let query = supabase
      .from('suppliers')
      .select('*', { count: 'exact' });
    
    if (category) {
      query = query.ilike('category', `%${category}%`);
    }
    
    if (keyword) {
      query = query.or(`company_name.ilike.%${keyword}%,keywords.ilike.%${keyword}%`);
    }
    
    if (address) {
      query = query.ilike('address', `%${address}%`);
    }
    
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    const { data, error, count } = await query
      .order('id', { ascending: true })
      .range(from, to);
    
    if (error) {
      console.error('Suppliers query error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
    
    const totalPages = Math.ceil((count || 0) / pageSize);
    
    return NextResponse.json({
      suppliers: data,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages,
      },
    });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
