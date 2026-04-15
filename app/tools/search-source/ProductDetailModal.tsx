'use client';

import { useState, useEffect } from 'react';
import { X, ShoppingCart, ExternalLink, ChevronRight } from 'lucide-react';

interface Product {
  num_iid: string;
  title: string;
  pic_url: string;
  price: string;
  promotion_price?: string;
  sales: number;
  seller_nick: string;
  detail_url: string;
}

interface ProductDetail {
  num_iid: string;
  title: string;
  pic_url: string;
  price: string;
  promotion_price?: string;
  sales: number;
  seller_nick: string;
  detail_url: string;
  desc?: string;
  skus?: any[];
  props?: any[];
  images?: string[];
}

interface Props {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  currentLang: string;
}

export default function ProductDetailModal({ product, onClose, onAddToCart, currentLang }: Props) {
  const [detail, setDetail] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [pidLink, setPidLink] = useState<string>('');

  // 翻译文本
  const t = {
    en: {
      price: 'Price',
      sales: 'Sales',
      shop: 'Shop',
      description: 'Description',
      specifications: 'Specifications',
      addToList: 'Add to Sourcing List',
      viewOnTaobao: 'View on Taobao',
      close: 'Close',
      loading: 'Loading...'
    },
    zh: {
      price: '价格',
      sales: '销量',
      shop: '店铺',
      description: '商品描述',
      specifications: '规格参数',
      addToList: '加入采购清单',
      viewOnTaobao: '去淘宝查看',
      close: '关闭',
      loading: '加载中...'
    },
    ar: {
      price: 'السعر',
      sales: 'المبيعات',
      shop: 'المتجر',
      description: 'الوصف',
      specifications: 'المواصفات',
      addToList: 'إضافة إلى القائمة',
      viewOnTaobao: 'عرض على تاوباو',
      close: 'إغلاق',
      loading: 'جاري التحميل...'
    },
    ru: {
      price: 'Цена',
      sales: 'Продажи',
      shop: 'Магазин',
      description: 'Описание',
      specifications: 'Характеристики',
      addToList: 'Добавить в список',
      viewOnTaobao: 'Смотреть на Taobao',
      close: 'Закрыть',
      loading: 'Загрузка...'
    },
    es: {
      price: 'Precio',
      sales: 'Ventas',
      shop: 'Tienda',
      description: 'Descripción',
      specifications: 'Especificaciones',
      addToList: 'Añadir a la lista',
      viewOnTaobao: 'Ver en Taobao',
      close: 'Cerrar',
      loading: 'Cargando...'
    }
  };

  const text = t[currentLang as keyof typeof t] || t.en;

  // 获取商品详情
  useEffect(() => {
    fetchDetail();
  }, [product.num_iid]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/product-detail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          num_iid: product.num_iid,
          targetLang: currentLang
        })
      });

      const data = await response.json();
      if (data.success) {
        setDetail(data.product);
      }
    } catch (error) {
      console.error('Failed to fetch detail:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取转链（带PID）
  const getConvertLink = async () => {
    try {
      const response = await fetch('/api/convert-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goodsId: product.num_iid,
          pid: 'mm_123_456_789' // 应从配置读取
        })
      });

      const data = await response.json();
      if (data.success) {
        setPidLink(data.shortUrl || data.longUrl);
        window.open(data.shortUrl || data.longUrl, '_blank');
      }
    } catch (error) {
      console.error('Convert link failed:', error);
      window.open(product.detail_url, '_blank');
    }
  };

  const displayDetail = detail || product;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900 line-clamp-1">
            {displayDetail.title}
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
              {/* Left: Images */}
              <div>
                <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-4">
                  <img
                    src={displayDetail.pic_url}
                    alt={displayDetail.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                {detail?.images && detail.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {detail.images.slice(0, 4).map((img, i) => (
                      <div key={i} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Info */}
              <div>
                <h1 className="text-xl font-bold text-gray-900 mb-4">
                  {displayDetail.title}
                </h1>

                {/* Price */}
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-3xl font-bold text-red-600">
                    ¥{displayDetail.promotion_price || displayDetail.price}
                  </span>
                  {displayDetail.promotion_price && (
                    <span className="text-lg text-gray-400 line-through">
                      ¥{displayDetail.price}
                    </span>
                  )}
                </div>

                {/* Shop & Sales */}
                <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                  <span>{text.shop}: {displayDetail.seller_nick}</span>
                  <span>|</span>
                  <span>{text.sales}: {displayDetail.sales}</span>
                </div>

                {/* SKUs */}
                {detail?.skus && detail.skus.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-900 mb-2">{text.specifications}</h3>
                    <div className="flex flex-wrap gap-2">
                      {detail.skus.slice(0, 8).map((sku, i) => (
                        <span key={i} className="px-3 py-1 bg-gray-100 rounded-lg text-sm">
                          {sku.properties_name || sku.props_name || sku.name || `SKU ${i + 1}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                {detail?.desc && (
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-900 mb-2">{text.description}</h3>
                    <div className="text-sm text-gray-600 max-h-32 overflow-y-auto">
                      {detail.desc}
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
              onClick={getConvertLink}
              className="flex items-center gap-2 px-4 py-2 border rounded-xl hover:bg-gray-50"
            >
              <ExternalLink className="w-4 h-4" />
              <span>{text.viewOnTaobao}</span>
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
