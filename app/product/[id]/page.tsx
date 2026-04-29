'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, ShoppingCart, Share2, Heart } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface ProductDetail {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  images: string[];
  shop: string;
  sales: string;
  brandName?: string;
  desc?: string;
  couponLink?: string;
  link: string;
}

export default function ProductDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const { lang, setLang } = useLanguage();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      fetchProductDetail();
    }
  }, [id, lang]);

  const fetchProductDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      // 调用中转服务：用 search action 模拟详情（因为大淘客无直接详情接口）
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'search',
          query: id, // 用ID作为查询（临时方案）
          pageSize: 1,
          page: 1,
          lang
        })
      });
      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) {
        const p = data.data[0];
        setProduct({
          id: p.id || id,
          title: p.title || 'Product Detail',
          price: p.price || 0,
          originalPrice: p.originalPrice,
          images: p.images || [p.image || ''].filter(Boolean),
          shop: p.shop || '',
          sales: p.sales || '',
          brandName: p.brandName,
          desc: p.desc,
          couponLink: p.couponLink,
          link: p.link || ''
        });
      } else {
        setError('Product not found');
      }
    } catch (err) {
      console.error('Failed to load product:', err);
      setError('Failed to load product');
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
          image_url: product.images[0] || '',
          price: String(product.price),
          shop_name: product.shop,
          product_url: product.link
        })
      });
      alert(lang === 'zh' ? '已加入清单' : 'Added to list');
    } catch (err) {
      console.error('Add to cart failed:', err);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">{error || 'Product not found'}</p>
        <button 
          onClick={() => router.back()}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg"
        >
          {lang === 'zh' ? '返回' : 'Go Back'}
        </button>
      </div>
    );
  }

  // Language texts
  const text = {
    zh: {
      productDetail: '商品详情',
      originalPrice: '原价',
      sales: '人付款',
      addToCart: '加入清单',
      brand: '品牌',
      description: '商品详情'
    },
    en: {
      productDetail: 'Product Details',
      originalPrice: 'Original',
      sales: 'sold',
      addToCart: 'Add to List',
      brand: 'Brand',
      description: 'Description'
    }
  }[lang] || {
    productDetail: 'Product Details',
    originalPrice: 'Original',
    sales: 'sold',
    addToCart: 'Add to List',
    brand: 'Brand',
    description: 'Description'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <span className="font-medium text-gray-800">{text.productDetail}</span>
          <div className="flex-1"></div>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as any)}
            className="text-sm border rounded-lg px-2 py-1"
          >
            <option value="zh">中文</option>
            <option value="en">English</option>
            <option value="ru">Русский</option>
            <option value="es">Español</option>
            <option value="ar">العربية</option>
          </select>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <Share2 size={20} className="text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <Heart size={20} className="text-gray-600" />
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: Image Carousel */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-2xl overflow-hidden border">
              {product.images.length > 0 && (
                <img 
                  src={product.images[currentImageIndex]} 
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {product.images.map((img, idx) => (
                  <div 
                    key={idx}
                    className={`aspect-square rounded-lg overflow-hidden border-2 cursor-pointer ${currentImageIndex === idx ? 'border-orange-500' : 'border-transparent'}`}
                    onClick={() => setCurrentImageIndex(idx)}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Info */}
          <div className="space-y-6">
            <h1 className="text-xl font-bold text-gray-800 leading-tight">
              {product.brandName && <span className="text-red-500 mr-2">{product.brandName}</span>}
              {product.title}
            </h1>

            {/* Price Card */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 rounded-xl">
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-red-500">¥{product.price}</span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <>
                    <span className="text-sm text-gray-400 line-through">¥{product.originalPrice}</span>
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                      {text.originalPrice} ¥{(product.originalPrice - product.price).toFixed(2)}
                    </span>
                  </>
                )}
              </div>
              <div className="mt-2 text-sm text-gray-500">
                {product.sales} {text.sales}
              </div>
            </div>

            {/* Shop Info */}
            <div className="flex items-center gap-4 p-4 bg-white rounded-xl border">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                🏪
              </div>
              <div>
                <p className="font-medium text-gray-800">{product.shop}</p>
                {product.brandName && (
                  <p className="text-xs text-gray-500">{text.brand}: {product.brandName}</p>
                )}
              </div>
            </div>

            {/* Coupon Link */}
            {product.couponLink && (
              <a 
                href={product.couponLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3 bg-red-500 text-white text-center rounded-xl font-medium hover:bg-red-600 transition-colors"
              >
                {lang === 'zh' ? '领券购买' : 'Get Coupon'}
              </a>
            )}
          </div>
        </div>

        {/* Description - Long Image */}
        {product.desc && (
          <div className="mt-8 bg-white rounded-xl border p-4">
            <h3 className="font-medium text-gray-800 mb-4">{text.description}</h3>
            <div className="prose max-w-none text-sm text-gray-600 leading-relaxed">
              {product.desc}
            </div>
          </div>
        )}

        {/* Recommended Products - placeholder */}
        <div className="mt-8">
          <h3 className="font-bold text-gray-800 mb-4">{lang === 'zh' ? '猜你喜欢' : 'You May Also Like'}</h3>
          <div className="grid grid-cols-2 gap-2.5">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-100 animate-pulse">
                <div className="aspect-square bg-gray-200"></div>
                <div className="p-2.5 space-y-1.5">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 w-16 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Fixed Bar - Add to Cart */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={handleAddToCart}
            className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-medium text-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingCart size={20} />
            {text.addToCart}
          </button>
        </div>
      </div>
    </div>
  );
}
