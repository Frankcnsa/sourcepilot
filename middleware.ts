import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// 公开页面（无需登录）
const publicPaths = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/auth/confirm',
  '/tools/search-source',
  '/tools/sourcing-list',
  '/tools/image-design',
  '/tools/consultation',
  '/search/single',
];

// 公开API路由（无需登录）
const publicApiPrefixes = [
  '/api/search',
  '/api/convert-link',
  '/api/sourcing-items',
  '/api/hot-products',
  '/api/categories',
  '/api/guess-you-like',
  '/api/debug-network',
  '/api/nine-nine',
  '/api/daily-hot',
  '/api/hot-sales',
  '/api/high-commission',
  '/api/test-dataoke',
  '/api/proxy',
];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // 刷新 session
  const { data: { session } } = await supabase.auth.getSession();

  const pathname = request.nextUrl.pathname;

  // 检查是否为公开页面
  const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'));
  
  // 检查是否为公开API
  const isPublicApi = publicApiPrefixes.some(prefix => pathname.startsWith(prefix));

  // 未登录且访问非公开页面/非公开API → 重定向到登录
  if (!session && !isPublicPath && !isPublicApi) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 已登录且访问登录页 → 重定向到首页
  if (session && pathname === '/login') {
    const homeUrl = new URL('/', request.url);
    return NextResponse.redirect(homeUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
