'use client';

import { useState, useEffect } from 'react';
import { Search, ShoppingCart } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Product {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  image: string;
  shop: string;
  sales: string;
}

export default function SearchSourceContent() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  // 只在挂载时请求一次
  useEffect(() => {
    console.log('开始请求数据...');
    // 实时热销榜
    fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'real-time', pageSize: 4, page: 1 })
    })
      .then(r => r.json())
      .then(data => {
        console.log('收到数据:', data);
        if (data.success && data.data) {
          const items = data.data.data || data.data.list || data.data || [];
          console.log('提取的商品数:', items.length);
          setProducts(items.slice(0, 4));
        }
        setLoading(false);
      })
      .catch(e => {
        console.error('请求失败:', e);
        setLoading(false);
      });
  }, []);

  const handleSearch = () => {
    alert('搜索: ' + query);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-3 py-2.5 flex items-center gap-2">
          <span className="font-bold text-orange-500 text-lg">SourcePilot</span>
          <div className="flex-1 mx-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索产品..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-orange-500 text-white text-sm rounded-full"
          >
            搜索
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 py-4">
        <h2 className="text-lg font-bold text-gray-800 mb-3">实时热销榜</h2>
        {loading ? (
          <div>加载中...</div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 gap-2.5">
            {products.map(p => (
              <div key={p.id} className="bg-white rounded-xl overflow-hidden border">
                <div className="aspect-square relative">
                  <img src={p.pic || p.mainPic} alt={p.dtitle} className="w-full h-full object-cover" />
                </div>
                <div className="p-2.5">
                  <h3 className="text-sm font-medium">{p.dtitle}</h3>
                  <div className="text-orange-600 font-bold">¥{p.actualPrice || p.yuanjia || 'N/A'}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>暂无数据</div>
        )}
      </div>
    </div>
  );
}
