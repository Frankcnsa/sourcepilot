'use client';

import { useState } from 'react';
import { X, ShoppingCart, Minus, Plus, TicketPercent, Store, Star, Truck, Shield } from 'lucide-react';

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
  monthSales?: number;
  couponPrice?: number;
  couponConditions?: string;
  shopLevel?: number;
  descScore?: number;
  dsrScore?: number;
  shipScore?: number;
  serviceScore?: number;
}

interface Props {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product) => void | Promise<void>;
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
      save: 'Save',
      shopScore: 'Shop Score',
      shipping: 'Shipping',
      service: 'Service',
      tmall: 'Tmall',
      monthlySales: 'Monthly Sales',
      couponInfo: 'Coupon',
      freeShipping: 'Free Shipping',
      guarantee: 'Quality Guarantee'
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
      save: '省',
      shopScore: '店铺评分',
      shipping: '物流',
      service: '服务',
      tmall: '天猫',
      monthlySales: '月销',
      couponInfo: '领券',
      freeShipping: '包邮',
      guarantee: '品质保证'
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
      save: 'وفر',
      shopScore: 'تقييم المتجر',
      shipping: 'الشحن',
      service: 'الخدمة',
      tmall: 'تيانماو',
      monthlySales: 'مبيعات شهرية',
      couponInfo: 'كوبون',
      freeShipping: 'شحن مجاني',
      guarantee: 'ضمان الجودة'
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
      save: 'Экономия',
      shopScore: 'Рейтинг магазина',
      shipping: 'Доставка',
      service: 'Сервис',
      tmall: 'Tmall',
      monthlySales: 'Продажи за месяц',
      couponInfo: 'Купон',
      freeShipping: 'Бесплатная доставка',
      guarantee: 'Гарантия качества'
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
      save: 'Ahorra',
      shopScore: 'Puntuación de tienda',
      shipping: 'Envío',
      service: 'Servicio',
      tmall: 'Tmall',
      monthlySales: 'Ventas mensuales',
      couponInfo: 'Cupón',
      freeShipping: 'Envío gratis',
      guarantee: 'Garantía de calidad'
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

  // 格式化销量
  const formatSales = (sales: number | string) => {
    const num = typeof sales === 'string' ? parseInt(sales) || 0 : sales || 0;
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万';
    }
    return num.toString();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50">
      <div className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-lg md:max-h-[85vh] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-medium text-gray-500">{product.shop}</h2>
            {product.shopType === 1 && (
              <span className="px-1.5 py-0.5 bg-red-50 text-red-600 text-[10px] rounded border border-red-100">
                {text.tmall}
              </span>
            )}
          </div>
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
              {product.brandName && <span className="text-red-500 font-medium">{product.brandName}</span>} {product.title}
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

            {/* Meta Info Row */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>{text.monthlySales}: {formatSales(product.monthSales || product.sales)}</span>
              {product.shopType === 1 && (
                <span className="text-red-500 font-medium">{text.tmall}</span>
              )}
            </div>

            {/* Service Tags */}
            <div className="flex gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 text-xs rounded">
                <Truck className="w-3 h-3" />
                {text.freeShipping}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded">
                <Shield className="w-3 h-3" />
                {text.guarantee}
              </span>
              {product.coupon && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 text-xs rounded">
                  <TicketPercent className="w-3 h-3" />
                  {product.coupon}
                </span>
              )}
            </div>

            {/* Coupon Card */}
            {product.coupon && (
              <div className="p-3 bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TicketPercent className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-700 font-medium">{product.coupon}</span>
                  </div>
                  <span className="text-xs text-red-500">{text.couponInfo}</span>
                </div>
              </div>
            )}

            {/* Shop Score */}
            {(product.descScore || product.dsrScore) && (
              <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{text.shopScore}</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                    <span className="text-orange-500 font-medium">{product.descScore || product.dsrScore}</span>
                  </div>
                </div>
                {(product.shipScore || product.serviceScore) && (
                  <div className="flex gap-4 text-xs text-gray-500">
                    {product.shipScore && (
                      <span>{text.shipping}: {product.shipScore}</span>
                    )}
                    {product.serviceScore && (
                      <span>{text.service}: {product.serviceScore}</span>
                    )}
                  </div>
                )}
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
