import { createBrowserClient } from '@supabase/ssr';

// 延迟初始化浏览器客户端，避免构建时因环境变量缺失报错
export function getSupabaseBrowserClient() {
  // 只在浏览器环境中初始化
  if (typeof window === 'undefined') {
    // 服务端或构建时，返回空壳对象避免报错
    return {} as any;
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// 为了向后兼容，保留默认导出，但只在浏览器环境中初始化
export const supabase = typeof window !== 'undefined' ? getSupabaseBrowserClient() : {} as any;
