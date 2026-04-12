import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 创建数据库客户端（Service Role Key）
function createDbClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey || anonKey
  );
}

// 创建认证客户端
async function getUserFromRequest(request: NextRequest) {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // 不设置 cookie
        },
        remove(name: string, options: CookieOptions) {
          // 不删除 cookie
        },
      },
    }
  );
  
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { sessionId } = await request.json();
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const db = createDbClient();

    // 查找会话
    const { data: conversation } = await db
      .from('chat_conversations')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // 如果会话没有 user_id，或者 user_id 不匹配当前用户，则更新
    if (!conversation.user_id || conversation.user_id !== user.id) {
      const { error } = await db
        .from('chat_conversations')
        .update({ user_id: user.id })
        .eq('id', conversation.id);

      if (error) {
        console.error('Error associating conversation:', error);
        return NextResponse.json(
          { error: 'Failed to associate conversation' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Conversation associated successfully',
    });

  } catch (error) {
    console.error('Associate conversation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
