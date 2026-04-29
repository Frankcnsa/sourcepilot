'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, ShoppingCart, Heart, Share2 } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase';

interface ProductDetail {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  shop: string;
  shopType?: number;
  sales: string;
  couponInfo?: string;
  couponLink?: string;
  brandName?: string;
  desc?: string;
  monthSales?: number;
  link: string;
}

export default function ProductDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLang, setCurrentLang] = useState('en');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // 身份验证检查
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // 未登录，跳转到登录页并带回跳地址
        router.push(`/login?redirect=/product/${id}`);
        return;
      }
      setIsAuthenticated(true);
    };
    checkAuth();
  }, [id, router]);

  useEffect(() => {
    // Detect language from browser
    const lang = navigator.language?.split('-')[0] || 'en';
    const supported = ['zh', 'en', 'ar', 'ru', 'es'];
    setCurrentLang(supported.includes(lang) ? lang : 'en');
    
    if (isAuthenticated) {
      fetchProductDetail();
    }
  }, [id, isAuthenticated]);

  const fetchProductDetail = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/product-detail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          num_iid: id,
          targetLang: currentLang
        })
      });
      const data = await res.json();
      
      if (data.success) {
        const p = data.product;
        setProduct({
          id: data.num_iid,
          title: p.title || p.item_title || 'No Title',
          price: p.price || p.item_price || 0,
          originalPrice: p.originalPrice || p.zk_final_price || undefined,
          image: p.pict_url || p.item_pict_url || '',
          images: p.small_images?.string || [],
          shop: p.seller_nick || p.shop_name || 'Unknown Shop',
          shopType: p.user_type,
          sales: p.volume || p.month_sales || '0',
          couponInfo: p.coupon_info,
          couponLink: p.coupon_click_url,
          brandName: p.brand_name,
          desc: p.desc,
          monthSales: p.month_sales,
          link: p.item_url || p.url || '#'
        });
      } else {
        setError(data.error || 'Failed to load product');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    try {
      await fetch('/api/sourcing-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          title: product.title,
          image_url: product.image,
          price: String(product.price),
          shop_name: product.shop,
          product_url: product.link
        })
      });
      alert(currentLang === 'zh' ? '已加入清单' : 'Added to list');
    } catch (err) {
      console.error('Add to cart failed:', err);
    }
  };

  // 身份验证检查中
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">{error || 'Product not found'}</p>
        <button 
          onClick={() => router.back()}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg"
        >
          {currentLang === 'zh' ? '返回' : 'Go Back'}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <span className="font-medium text-gray-800">
            {currentLang === 'zh' ? '商品详情' : 'Product Details'}
          </span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-2xl overflow-hidden border">
              <img 
                src={product.image} 
                alt={product.title}
                className="w-full h-full object-contain"
              />
            </div>
            {product.images && product.images.length > 0 && (
              <div className="grid grid-cols-5 gap-2">
                {product.images.map((img, idx) => (
                  <div key={idx} className="aspect-square bg-white rounded-lg overflow-hidden border">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-bold text-gray-800 leading-tight">
                {product.brandName && <span className="text-red-500 mr-2">{product.brandName}</span>}
                {product.title}
              </h1>
            </div>

            {/* Price Card */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 rounded-xl">
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-red-500">¥{product.price}</span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <>
                    <span className="text-sm text-gray-400 line-through mb-1">¥{product.originalPrice}</span>
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                      {currentLang === 'zh' ? '省' : 'Save'} ¥{(product.originalPrice - product.price).toFixed(2)}
                    </span>
                  </>
                )}
              </div>
              <div className="mt-2 text-sm text-gray-500">
                {product.monthSales || product.sales} {currentLang === 'zh' ? '人付款' : 'sold'}
              </div>
            </div>

            {/* Coupon */}
            {product.couponInfo && (
              <div className="bg-red-50 border border-red-100 p-3 rounded-lg flex items-center justify-between">
                <span className="text-red-600 font-medium">{product.couponInfo}</span>
                <a 
                  href={product.couponLink || product.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-red-500 text-white text-sm px-4 py-1.5 rounded-full hover:bg-red-600"
                >
                  {currentLang === 'zh' ? '领券' : 'Get Coupon'}
                </a>
              </div>
            )}

            {/* Shop Info */}
            <div className="flex items-center gap-4 p-4 bg-white rounded-xl border">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-gray-400">🏪</span>
              </div>
              <div>
                <p className="font-medium text-gray-800">{product.shop}</p>
                {product.shopType === 1 && (
                  <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded">天猫</span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleAddToCart}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600"
              >
                <ShoppingCart size={18} />
                {currentLang === 'zh' ? '加入清单' : 'Add to List'}
              </button>
              <button className="p-3 border border-gray-200 rounded-xl hover:bg-gray-50">
                <Heart size={20} className="text-gray-600" />
              </button>
              <button className="p-3 border border-gray-200 rounded-xl hover:bg-gray-50">
                <Share2 size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Description */}
            {product.desc && (
              <div className="p-4 bg-white rounded-xl border">
                <h3 className="font-medium text-gray-800 mb-2">
                  {currentLang === 'zh' ? '商品详情' : 'Description'}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">{product.desc}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
