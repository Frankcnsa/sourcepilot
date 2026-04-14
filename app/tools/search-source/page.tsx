'use client';

import { useState } from 'react';
import { useTranslation } from '@/app/hooks/useTranslation';
import { SearchBar } from '@/app/components/SearchBar';
import { ProductCard } from '@/app/components/ProductCard';
import { Product } from '@/app/types';

// 直接调用阿里云 FC 中转服务
const API_BASE_URL = 'https://dataoke-proxy-tlkpqnacev.cn-shanghai.fcapp.run';

export default function SearchSourcePage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (query: string) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, page: 1, pageSize: 20 }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.products);
      } else {
        setError(data.error || 'Search failed');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <SearchBar onSearch={handleSearch} loading={loading} />
      {error && <p className="text-red-500 mt-4">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
