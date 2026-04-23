'use client';

import { useState, useEffect } from 'react';
import { X, ShoppingCart, ExternalLink, TicketPercent } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  originalTitle?: string;
  price: number;
  originalPrice?: number;
  image: string;
  shop: string;
  sales: string;
  link: string;
  coupon?: string;
}

interface Props {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  onGetCoupon: (product: Product) => void;
  currentLang: string;
}

export default function ProductDetailModal({ product, onClose, onAddToCart, onGetCoupon, currentLang }: Props) {
  const [loading, setLoading] = useState(true);

  // 翻译文本
  const t = {
    en: {
      price: 'Price',
      originalPrice: 'Original Price',
      sales: 'Sales',
      shop: 'Shop',
      addToList: 'Add to Sourcing List',
      getCoupon: 'Get Coupon & Buy',
      close: 'Close',
      loading: 'Loading...',
      save: 'Save'
    },
    zh: {
      price: '价格',
      originalPrice: '原价',
      sales: '销量',
      shop: '店铺',
      addToList: '加入采购清单',
      getCoupon: '领券购买',
      close: '关闭',
      loading: '加载中...',
      save: '省'
    },
    ar: {
      price: 'السعر',
      originalPrice: 'السعر الأصلي',
      sales: 'المبيعات',
      shop: 'المتجر',
      addToList: 'إضافة إلى القائمة',
      getCoupon: 'احصل على كوبون واشتري',
      close: 'إغلاق',
      loading: 'جاري التحميل...',
      save: 'وفر'
    },
    ru: {
      price: 'Цена',
      originalPrice: 'Оригинальная цена',
      sales: 'Продажи',
      shop: 'Магазин',
      addToList: 'Добавить в список',
      getCoupon: 'Получить купон и купить',
      close: 'Закрыть',
      loading: 'Загрузка...',
      save: 'Экономия'
    },
    es: {
      price: 'Precio',
      originalPrice: 'Precio original',
      sales: 'Ventas',
      shop: 'Tienda',
      addToList: 'Añadir a la lista',
      getCoupon: 'Obtener cupón y comprar',
      close: 'Cerrar',
      loading: 'Cargando...',
      save: 'Ahorra'
    }
  };

  const text = t[currentLang as keyof typeof t] || t.en;

  useEffect(() => {
    // Simulate loading for smooth UX
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, [product.id]);

  const savings = product.originalPrice && product.originalPrice > product.price
    ? (product.originalPrice - product.price).toFixed(2)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900 line-clamp-1">
            {product.title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-180px)]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <span className="text-gray-500">{text.loading}</span>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left: Image */}
              <div>
                <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden relative">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=No+Image';
                    }}
                  />
                  {savings && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white text-sm px-3 py-1.5 rounded-full flex items-center gap-1">
                      <TicketPercent className="w-4 h-4" />
                      <span>{text.save} ¥{savings}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Info */}
              <div>
                <h1 className="text-xl font-bold text-gray-900 mb-4">
                  {product.title}
                </h1>

                {/* Price */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold text-red-600">
                      ¥{product.price}
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-lg text-gray-400 line-through">
                        ¥{product.originalPrice}
                      </span>
                    )}
                  </div>
                  {savings && (
                    <div className="mt-1 text-sm text-red-500">
                      {text.save} ¥{savings}
                    </div>
                  )}
                </div>

                {/* Shop & Sales */}
                <div className="space-y-2 mb-6 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>{text.shop}</span>
                    <span className="font-medium text-gray-900">{product.shop}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{text.sales}</span>
                    <span className="font-medium text-gray-900">{product.sales}</span>
                  </div>
                </div>

                {/* Coupon Info */}
                {product.coupon && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700 text-sm">
                      <TicketPercent className="w-4 h-4" />
                      <span>{product.coupon}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-600 hover:text-gray-900"
          >
            {text.close}
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => {
                onGetCoupon(product);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600"
            >
              <ExternalLink className="w-4 h-4" />
              <span>{text.getCoupon}</span>
            </button>
            <button
              onClick={() => {
                onAddToCart(product);
                onClose();
              }}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{text.addToList}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
