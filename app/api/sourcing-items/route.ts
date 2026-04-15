import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 获取当前用户会话
async function getSession() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// GET - 获取用户的采购清单
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      }
    );

    const { data: items, error } = await supabase
      .from('sourcing_items')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[SourcingItems] Error fetching items:', error);
      return NextResponse.json(
        { error: 'Failed to fetch items' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      items: items || []
    });

  } catch (error) {
    console.error('[SourcingItems] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    );
  }
}

// POST - 添加商品到采购清单
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      product_id,
      title,
      image_url,
      price,
      shop_name,
      product_url,
      pid_link
    } = body;

    if (!product_id || !title) {
      return NextResponse.json(
        { error: 'product_id and title are required' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      }
    );

    // 检查是否已存在
    const { data: existing } = await supabase
      .from('sourcing_items')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('product_id', product_id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Item already exists in sourcing list' },
        { status: 409 }
      );
    }

    const { data: item, error } = await supabase
      .from('sourcing_items')
      .insert({
        user_id: session.user.id,
        product_id,
        title,
        image_url: image_url || '',
        price: price || '0',
        shop_name: shop_name || '',
        product_url: product_url || '',
        pid_link: pid_link || null
      })
      .select()
      .single();

    if (error) {
      console.error('[SourcingItems] Error adding item:', error);
      return NextResponse.json(
        { error: 'Failed to add item' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      item
    });

  } catch (error) {
    console.error('[SourcingItems] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to add item' },
      { status: 500 }
    );
  }
}

// DELETE - 从采购清单移除商品
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      }
    );

    const { error } = await supabase
      .from('sourcing_items')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('[SourcingItems] Error deleting item:', error);
      return NextResponse.json(
        { error: 'Failed to delete item' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Item deleted'
    });

  } catch (error) {
    console.error('[SourcingItems] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    );
  }
}
