'use client';

import { useCallback } from 'react';

export function useTranslation() {
  const t = useCallback((key: string) => {
    const translations: Record<string, string> = {
      'search.placeholder': 'Search products...',
      'search.loading': 'Searching...',
      'search.error': 'Search failed, please try again',
      'search.noResults': 'No products found',
      'product.viewDetails': 'View Details',
      'product.supplier': 'Supplier',
      'product.minOrder': 'Min Order',
      'product.price': 'Price',
    };
    return translations[key] || key;
  }, []);

  return { t };
}
