'use client';

import { useState, useEffect, useCallback } from 'react';
import { getCachedTranslation, setCachedTranslation } from '@/lib/translation-cache';

/**
 * 通用翻译 Hook
 * @param items 原始数据数组（中文）
 * @param lang 目标语言
 * @param fields 需要翻译的字段名数组（如 ['title', 'shop', 'desc']）
 * @returns 翻译后的数据 + 加载状态
 */
export function useTranslation<T extends Record<string, any>>(
  items: T[],
  lang: string,
  fields: string[] = ['title', 'shop']
) {
  const [translatedItems, setTranslatedItems] = useState<T[]>(items);
  const [loading, setLoading] = useState(false);

  const translateItems = useCallback(async () => {
    if (lang === 'zh' || items.length === 0) {
      setTranslatedItems(items);
      return;
    }

    setLoading(true);
    try {
      // 1. 收集所有需要翻译的文本和对应的索引
      const textsToTranslate: string[] = [];
      const translationMap: { itemIndex: number; field: string; textIndex: number }[] = [];

      items.forEach((item, itemIndex) => {
        fields.forEach(field => {
          const text = item[field];
          if (typeof text === 'string' && text.trim()) {
            const cached = getCachedTranslation(text, 'zh', lang);
            if (cached === null) {
              // 未缓存，需要翻译
              translationMap.push({ itemIndex, field, textIndex: textsToTranslate.length });
              textsToTranslate.push(text);
            }
          }
        });
      });

      // 2. 如果有未缓存的文本，调用批量翻译 API
      if (textsToTranslate.length > 0) {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            texts: textsToTranslate,
            from: 'zh',
            to: lang
          })
        });

        if (!response.ok) {
          throw new Error(`翻译API错误: ${response.status}`);
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || '翻译失败');
        }

        // 3. 更新缓存
        textsToTranslate.forEach((text, index) => {
          const translated = data.translations?.[index] || text;
          setCachedTranslation(text, 'zh', lang, translated);
        });
      }

      // 4. 构建翻译后的数据
      const result = items.map((item, itemIndex) => {
        const newItem = { ...item };
        fields.forEach(field => {
          const text = item[field];
          if (typeof text === 'string' && text.trim()) {
            const cached = getCachedTranslation(text, 'zh', lang);
            if (cached !== null) {
              (newItem as any)[field] = cached;
            }
          }
        });
        return newItem;
      });

      setTranslatedItems(result);
    } catch (error) {
      console.warn('[useTranslation] 翻译失败，使用原文:', error);
      setTranslatedItems(items); // 降级：使用原文
    } finally {
      setLoading(false);
    }
  }, [items, lang, fields]);

  useEffect(() => {
    translateItems();
  }, [translateItems]);

  return { translatedItems, loading, translateItems };
}
