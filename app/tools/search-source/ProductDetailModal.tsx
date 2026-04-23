'use client';

import { useState } from 'react';
import { X, ShoppingCart, Minus, Plus, TicketPercent } from 'lucide-react';

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
  desc?: string;
  couponLink?: string;
  brandName?: string;
  shopType?: number;
}

interface Props {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  currentLang: string;
}

export default function ProductDetailModal({ product, onClose, onAddToCart, currentLang }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  // 翻译文本
  const t = {
    en: {
      price: 'Price',
      originalPrice: 'Original',
      sales: 'Sales',
      shop: 'Shop',
      addToList: 'Add to Sourcing List',
      added: 'Added!',
      close: 'Close',
      quantity: 'Quantity',
      coupon: 'Coupon',
      brand: 'Brand',
      desc: 'Description',
      save: 'Save'
    },
    zh: {
      price: '价格',
      originalPrice: '原价',
      sales: '销量',
      shop: '店铺',
      addToList: '加入采购清单',
      added: '已加入！',
      close: '关闭',
      quantity: '数量',
      coupon: '优惠券',
      brand: '品牌',
      desc: '商品描述',
      save: '省'
    },
    ar: {
      price: 'السعر',
      originalPrice: 'السعر الأصلي',
      sales: 'المبيعات',
      shop: 'المتجر',
      addToList: 'إضافة إلى القائمة',
      added: 'تمت الإضافة!',
      close: 'إغلاق',
      quantity: 'الكمية',
      coupon: 'كوبون',
      brand: 'الماركة',
      desc: 'الوصف',
      save: 'وفر'
    },
    ru: {
      price: 'Цена',
      originalPrice: 'Оригинальная цена',
      sales: 'Продажи',
      shop: 'Магазин',
      addToList: 'Добавить в список',
      added: 'Добавлено!',
      close: 'Закрыть',
      quantity: 'Количество',
      coupon: 'Купон',
      brand: 'Бренд',
      desc: 'Описание',
      save: 'Экономия'
    },
    es: {
      price: 'Precio',
      originalPrice: 'Precio original',
      sales: 'Ventas',
      shop: 'Tienda',
      addToList: 'Añadir a la lista',
      added: '¡Añadido!',
      close: 'Cerrar',
      quantity: 'Cantidad',
      coupon: 'Cupón',
      brand: 'Marca',
      desc: 'Descripción',
      save: 'Ahorra'
    }
  };

  const text = t[currentLang as keyof typeof t] || t.en;

  const savings = product.originalPrice && product.originalPrice > product.price
    ? (product.originalPrice - product.price).toFixed(2)
    : null;

  const handleAddToCart = () => {
    onAddToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50">
      <div className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-lg md:max-h-[85vh] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
          <h2 className="text-sm font-medium text-gray-500">{text.shop}: {product.shop}</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Image */}
          <div className="aspect-square bg-gray-100 relative">
            <img
              src={product.image}
              alt={product.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=No+Image';
              }}
            />
            {savings && (
              <div className="absolute top-3 left-3 bg-red-500 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1">
                <TicketPercent className="w-3 h-3" />
                <span>{text.save} ¥{savings}</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-4 space-y-4">
            {/* Title */}
            <h1 className="text-base font-semibold text-gray-900 leading-snug">
              {product.brandName && <span className="text-red-500">{product.brandName}</span>} {product.title}
            </h1>

            {/* Price */}
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-red-500">¥</span>
              <span className="text-2xl font-bold text-red-500">{product.price}</span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-sm text-gray-400 line-through ml-2">
                  ¥{product.originalPrice}
                </span>
              )}
              {savings && (
                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded ml-auto">
                  {text.save}¥{savings}
                </span>
              )}
            </div>

            {/* Meta Info */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>{text.sales}: {product.sales}</span>
              {product.shopType === 1 && (
                <span className="text-red-500 font-medium">天猫</span>
              )}
            </div>

            {/* Coupon */}
            {product.coupon && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                <div className="flex items-center gap-2">
                  <TicketPercent className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-700 font-medium">{product.coupon}</span>
                </div>
              </div>
            )}

            {/* Description */}
            {product.desc && (
              <div className="text-sm text-gray-600 leading-relaxed">
                <span className="font-medium text-gray-800">{text.desc}:</span>
                <p className="mt-1">{product.desc}</p>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{text.quantity}</span>
              <div className="flex items-center border rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 hover:bg-gray-50"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center text-sm font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 hover:bg-gray-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="border-t bg-white p-4">
          <button
            onClick={handleAddToCart}
            className={`w-full py-3 rounded-xl font-medium text-white transition-colors flex items-center justify-center gap-2 ${
              added 
                ? 'bg-green-500' 
                : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            <span>{added ? text.added : text.addToList}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
