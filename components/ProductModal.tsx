'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase';

interface ProductModalProps {
  productId: string;
  lang?: string;
  onClose: () => void;
}

export default function ProductModal({ productId, lang = 'zh', onClose }: ProductModalProps) {
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);

  // 获取用户登录状态
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }: any) => setUser(data.user));
  }, []);

  // 加载商品详情
  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    fetch('/api/product-detail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ num_iid: productId, targetLang: lang })
    })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          setProduct(data.data);
        } else {
          setError('产品加载失败');
        }
      })
      .catch(e => setError('网络错误: ' + (e as Error).message))
      .finally(() => setLoading(false));
  }, [productId, lang]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">加载中...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4">
          <div className="text-red-500 text-center">{error || '产品不存在'}</div>
          <button 
            onClick={onClose}
            className="mt-4 w-full py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            关闭
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* 顶部栏 */}
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">产品详情</h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 左侧：图片 */}
            <div>
              <div className="relative aspect-square w-full bg-gray-100 rounded-xl overflow-hidden">
                <img 
                  src={product.mainPic || product.pic} 
                  alt={product.dtitle || product.title}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* 右侧：信息 */}
            <div>
              <h1 className="text-2xl font-bold mb-4">{product.dtitle || product.title}</h1>
              
              {/* 价格 */}
              <div className="mb-6 p-4 bg-red-50 rounded-xl">
                <div className="text-3xl text-red-600 font-bold">¥{product.actualPrice}</div>
                {product.yuanjia && product.yuanjia > product.actualPrice && (
                  <div className="text-gray-400 line-through">¥{product.yuanjia}</div>
                )}
              </div>

              {/* 描述 */}
              {product.desc && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">产品描述</h3>
                  <p className="text-gray-700 leading-relaxed">{product.desc}</p>
                </div>
              )}

              {/* 店铺 */}
              <div className="mb-6 text-gray-600">
                <p>🏪 {product.shopName}</p>
                <p>📦 月销 {product.monthSales}+</p>
              </div>
            </div>
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="sticky bottom-0 bg-white border-t p-4 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 bg-orange-500 text-white py-3 rounded-xl hover:bg-orange-600 font-semibold"
          >
            添加到购物清单（Step 6 完善）
          </button>
        </div>
      </div>
    </div>
  );
}
