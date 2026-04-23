'use client';

import { useState, useEffect } from 'react';
import { Search, TrendingUp, Grid3X3, TicketPercent, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ProductDetailModal from './ProductDetailModal';

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

export default function SearchSourcePage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [convertingLink, setConvertingLink] = useState<string | null>(null);

  // 热搜词（中文，大淘客支持中文搜索）
  const hotWords = [
    '手机壳', '数据线', '耳机', '充电器',
    '钢化膜', '蓝牙音箱', '充电宝', '智能手表'
  ];

  // 分类（中英文对应）
  const categories = [
    { id: '1', name: 'Electronics', searchName: '电子产品', icon: '💻' },
    { id: '2', name: 'Fashion', searchName: '服装', icon: '👕' },
    { id: '3', name: 'Home', searchName: '家居', icon: '🏠' },
    { id: '4', name: 'Beauty', searchName: '美妆', icon: '💄' },
    { id: '5', name: 'Sports', searchName: '运动', icon: '⚽' },
    { id: '6', name: 'Toys', searchName: '玩具', icon: '🧸' }
  ];

  // 语言切换
  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'es', name: 'Español', flag: '🇪🇸' }
  ];

  // 翻译文本
  const t = {
    en: {
      searchPlaceholder: 'Search for products (Chinese keywords work best)...',
      hotSearch: 'Popular Searches',
      categories: 'Categories',
      search: 'Search',
      price: 'Price',
      sales: 'Sales',
      shop: 'Shop',
      addToCart: 'Add to List',
      view: 'View Details',
      sourcingList: 'Sourcing List',
      getCoupon: 'Get Coupon',
      originalPrice: 'Original',
      save: 'Save',
      searchHint: 'Tip: Search in Chinese for best results'
    },
    zh: {
      searchPlaceholder: '搜索商品...',
      hotSearch: '热门搜索',
      categories: '商品分类',
      search: '搜索',
      price: '价格',
      sales: '销量',
      shop: '店铺',
      addToCart: '加入清单',
      view: '查看详情',
      sourcingList: '采购清单',
      getCoupon: '领券购买',
      originalPrice: '原价',
      save: '省',
      searchHint: '提示：使用中文关键词搜索效果更佳'
    },
    ar: {
      searchPlaceholder: 'البحث عن المنتجات (الكلمات الصينية تعمل بشكل أفضل)...',
      hotSearch: 'عمليات البحث الشائعة',
      categories: 'التصنيفات',
      search: 'بحث',
      price: 'السعر',
      sales: 'المبيعات',
      shop: 'المتجر',
      addToCart: 'إضافة إلى القائمة',
      view: 'عرض التفاصيل',
      sourcingList: 'قائمة المصادر',
      getCoupon: 'احصل على كوبون',
      originalPrice: 'السعر الأصلي',
      save: 'وفر',
      searchHint: 'نصيحة: البحث باللغة الصينية يعطي نتائج أفضل'
    },
    ru: {
      searchPlaceholder: 'Поиск товаров (китайские ключевые слова работают лучше)...',
      hotSearch: 'Популярные запросы',
      categories: 'Категории',
      search: 'Поиск',
      price: 'Цена',
      sales: 'Продажи',
      shop: 'Магазин',
      addToCart: 'Добавить в список',
      view: 'Подробнее',
      sourcingList: 'Список закупок',
      getCoupon: 'Получить купон',
      originalPrice: 'Оригинальная цена',
      save: 'Экономия',
      searchHint: 'Совет: поиск на китайском языке дает лучшие результаты'
    },
    es: {
      searchPlaceholder: 'Buscar productos (palabras clave en chino funcionan mejor)...',
      hotSearch: 'Búsquedas populares',
      categories: 'Categorías',
      search: 'Buscar',
      price: 'Precio',
      sales: 'Ventas',
      shop: 'Tienda',
      addToCart: 'Añadir a la lista',
      view: 'Ver detalles',
      sourcingList: 'Lista de abastecimiento',
      getCoupon: 'Obtener cupón',
      originalPrice: 'Precio original',
      save: 'Ahorra',
      searchHint: 'Consejo: buscar en chino da mejores resultados'
    }
  };

  const text = t[currentLang as keyof typeof t] || t.en;

  // 搜索商品 - 调用大淘客API
  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/search/dataoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          page: 1,
          pageSize: 20,
          targetLang: currentLang
        })
      });

      const data = await response.json();
      if (data.success) {
        setProducts(data.products || []);
      } else {
        console.error('Search error:', data.error);
        setProducts([]);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // 领券购买 - 调用转链接口
  const handleGetCoupon = async (product: Product) => {
    setConvertingLink(product.id);
    try {
      const response = await fetch('/api/convert-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goodsId: product.id,
          itemId: product.id
        })
      });

      const data = await response.json();
      if (data.success && (data.shortUrl || data.longUrl || data.couponClickUrl)) {
        const url = data.couponClickUrl || data.shortUrl || data.longUrl;
        window.open(url, '_blank');
      } else {
        // 如果转链失败，直接跳转到商品的原始链接
        window.open(product.link, '_blank');
      }
    } catch (error) {
      console.error('Convert link failed:', error);
      // fallback: 直接打开商品链接
      window.open(product.link, '_blank');
    } finally {
      setConvertingLink(null);
    }
  };

  // 加入采购清单
  const addToCart = async (product: Product) => {
    try {
      const response = await fetch('/api/sourcing-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          title: product.title || product.originalTitle || '',
          image_url: product.image,
          price: String(product.price),
          shop_name: product.shop,
          product_url: product.link
        })
      });

      if (response.ok) {
        setCartCount(prev => prev + 1);
        alert('Added to sourcing list!');
      }
    } catch (error) {
      console.error('Add to cart failed:', error);
    }
  };

  // 计算节省金额
  const getSavings = (product: Product) => {
    if (product.originalPrice && product.originalPrice > product.price) {
      return (product.originalPrice - product.price).toFixed(2);
    }
    return null;
  };

  return (
    <div className="h-full bg-gray-50">
      {/* Search Section */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Search Box */}
        <div className="relative mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={text.searchPlaceholder}
            className="w-full px-4 py-3 pl-12 pr-24 text-base border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <button
            onClick={() => handleSearch()}
            disabled={loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '...' : text.search}
          </button>
        </div>

        {/* Search Hint */}
        <p className="text-sm text-gray-500 mb-4">{text.searchHint}</p>

        {/* Hot Searches */}
        {!products.length && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3 text-gray-600">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">{text.hotSearch}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {hotWords.map(word => (
                <button
                  key={word}
                  onClick={() => {
                    setQuery(word);
                    handleSearch(word);
                  }}
                  className="px-4 py-2 bg-white border rounded-full text-sm hover:bg-gray-50 hover:border-blue-300"
                >
                  {word}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Categories */}
        {!products.length && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3 text-gray-600">
              <Grid3X3 className="w-4 h-4" />
              <span className="text-sm font-medium">{text.categories}</span>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setQuery(cat.searchName);
                    handleSearch(cat.searchName);
                  }}
                  className="p-4 bg-white border rounded-xl text-center hover:shadow-md transition-shadow"
                >
                  <span className="text-2xl mb-2 block">{cat.icon}</span>
                  <span className="text-sm text-gray-700">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Products Grid */}
        {products.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.map(product => {
              const savings = getSavings(product);
              return (
                <div key={product.id} className="bg-white border rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                  <div 
                    className="aspect-square bg-gray-100 cursor-pointer relative"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x300?text=No+Image';
                      }}
                    />
                    {/* Coupon Badge */}
                    {savings && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <TicketPercent className="w-3 h-3" />
                        <span>{text.save} ¥{savings}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 
                      className="text-sm font-medium text-gray-900 line-clamp-2 cursor-pointer hover:text-blue-600"
                      onClick={() => setSelectedProduct(product)}
                    >
                      {product.title}
                    </h3>
                    
                    {/* Price Section */}
                    <div className="mt-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-red-600">
                          ¥{product.price}
                        </span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="text-xs text-gray-400 line-through">
                            ¥{product.originalPrice}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-500">
                          {product.sales} {text.sales}
                        </span>
                        <span className="text-xs text-gray-500">{product.shop}</span>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => handleGetCoupon(product)}
                        disabled={convertingLink === product.id}
                        className="flex-1 px-3 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>{convertingLink === product.id ? '...' : text.getCoupon}</span>
                      </button>
                      <button
                        onClick={() => addToCart(product)}
                        className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50"
                      >
                        {text.addToCart}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
          onGetCoupon={handleGetCoupon}
          currentLang={currentLang}
        />
      )}
    </div>
  );
}
