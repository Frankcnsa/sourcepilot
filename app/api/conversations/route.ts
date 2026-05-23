import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 创建 Supabase server client
function createClient(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // 在 API route 中无法设置 cookie
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // 在 API route 中无法删除 cookie
          }
        },
      },
    }
  );
}

export async function GET(request: NextRequest) {
  try {
    // 创建 Supabase server client
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', conversations: [] },
        { status: 401 }
      );
    }
    
    // 获取用户的对话列表
    const { data: conversations, error } = await supabase
      .from('chat_conversations')
      .select('id, session_id, title, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(20);
    
    if (error) {
      console.error('Failed to fetch conversations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch conversations', conversations: [] },
        { status: 500 }
      );
    }
    
    // 格式化返回数据
    const formattedConversations = conversations?.map(conv => ({
      id: conv.session_id,
      title: conv.title || 'New Chat',
      updated_at: conv.updated_at,
    })) || [];
    
    return NextResponse.json({ conversations: formattedConversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error', conversations: [] },
      { status: 500 }
    );
  }
}