// 翻译缓存：使用 sessionStorage（页面刷新后仍存在，关闭标签页后清空）
const CACHE_PREFIX = 'translate_cache_';

/**
 * 获取缓存的翻译
 * @param text 原文
 * @param from 源语言
 * @param to 目标语言
 * @returns 缓存的翻译结果，如果没有则返回 null
 */
export function getCachedTranslation(text: string, from: string, to: string): string | null {
  if (typeof window === 'undefined') return null; // SSR 环境
  try {
    const key = `${CACHE_PREFIX}${from}:${to}:${text}`;
    const cached = sessionStorage.getItem(key);
    return cached ? JSON.parse(cached) : null;
  } catch (e) {
    console.warn('[Cache] 读取失败:', e);
    return null;
  }
}

/**
 * 设置翻译缓存
 */
export function setCachedTranslation(text: string, from: string, to: string, translated: string): void {
  if (typeof window === 'undefined') return; // SSR 环境
  try {
    const key = `${CACHE_PREFIX}${from}:${to}:${text}`;
    sessionStorage.setItem(key, JSON.stringify(translated));
  } catch (e) {
    console.warn('[Cache] 写入失败:', e);
  }
}

/**
 * 清空所有翻译缓存
 */
export function clearTranslationCache(): void {
  if (typeof window === 'undefined') return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => sessionStorage.removeItem(key));
  } catch (e) {
    console.warn('[Cache] 清空失败:', e);
  }
}
