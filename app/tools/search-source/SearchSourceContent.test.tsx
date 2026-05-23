'use client';

import { useState, useEffect } from 'react';
import { Search, ShoppingCart } from 'lucide-react';
import { useRouter } from 'next/navigation';

// 测试数据
const TEST_PRODUCTS = [
  {
    id: 'test1',
    title: '测试商品1 - 闪魔适用苹果手机膜',
    price: 29.9,
    originalPrice: 49.9,
    image: 'https://img.alicdn.com/imgextra/i3/2053469401/O1CN01hKSnoI2JJhz2bCgzy_!!2053469401.png',
    shop: '测试店铺',
    sales: '1000',
    link: 'https://detail.tmall.com/item.htm?id=123'
  },
  {
    id: 'test2',
    title: '测试商品2 - 9.9包邮商品',
    price: 9.9,
    originalPrice: 19.9,
    image: 'https://img.alicdn.com/imgextra/i3/2053469401/O1CN01hKSnoI2JJhz2bCgzy_!!2053469401.png',
    shop: '测试店铺2',
    sales: '2000',
    link: 'https://detail.tmall.com/item.htm?id=456'
  }
];

export default function SearchSourceContent() {
  const router = useRouter();
  const [products, setProducts] = useState(TEST_PRODUCTS); // 直接用测试数据
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

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
        <h2 className="text-lg font-bold text-gray-800 mb-3">测试商品</h2>
        <div className="grid grid-cols-2 gap-2.5">
          {products.map(product => (
            <div key={product.id} className="bg-white rounded-xl overflow-hidden border border-gray-100">
              <div className="aspect-square relative">
                <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-2.5 space-y-1.5">
                <h3 className="text-sm font-medium text-gray-800 line-clamp-2">
                  {product.title}
                </h3>
                <div className="flex items-center gap-1.5">
                  <span className="text-orange-600 font-bold text-base">¥{product.price}</span>
                  <span className="text-xs text-gray-400 line-through">¥{product.originalPrice}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{product.shop}</span>
                  <span>{product.sales} 已售</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
