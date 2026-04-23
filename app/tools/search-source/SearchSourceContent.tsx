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
  hotKeyword?: string;
  commissionRate?: number;
  couponInfo?: string;
  shopType?: number;
  monthSales?: number;
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

  // 真实热销数据
  const [hotProducts, setHotProducts] = useState<Product[]>([]);
  const [hotKeywords, setHotKeywords] = useState<string[]>([]);
  const [hotLoading, setHotLoading] = useState(true);

  // 加载热销商品
  useEffect(() => {
    fetchHotProducts();
  }, [currentLang]);

  const fetchHotProducts = async () => {
    setHotLoading(true);
    try {
      const res = await fetch(`/api/hot-products?lang=${currentLang}&limit=8`);
      const data = await res.json();
      if (data.success) {
        setHotProducts(data.products || []);
        setHotKeywords(data.keywords || []);
      }
    } catch (e) {
      console.error('Failed to load hot products:', e);
    } finally {
      setHotLoading(false);
    }
  };

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
      searchPlaceholder: 'Search products...',
      hotSearch: 'Trending',
      hotProducts: 'Hot Products',
      categories: 'Categories',
      search: 'Search',
      price: 'Price',
      sales: 'sold',
      shop: 'Shop',
      addToCart: 'Add',
      view: 'View',
      sourcingList: 'Sourcing List',
      getCoupon: 'Buy Now',
      originalPrice: 'Original',
      save: 'Save',
      searchHint: 'Tip: Chinese keywords work best'
    },
    zh: {
      searchPlaceholder: '搜索商品...',
      hotSearch: '实时热搜',
      hotProducts: '热销商品',
      categories: '分类',
      search: '搜索',
      price: '价格',
      sales: '销量',
      shop: '店铺',
      addToCart: '加入清单',
      view: '查看',
      sourcingList: '采购清单',
      getCoupon: '领券购买',
      originalPrice: '原价',
      save: '省',
      searchHint: '提示：中文关键词搜索效果更佳'
    },
    ar: {
      searchPlaceholder: 'البحث عن المنتجات...',
      hotSearch: 'البحث الشائع',
      hotProducts: 'المنتجات الرائجة',
      categories: 'التصنيفات',
      search: 'بحث',
      price: 'السعر',
      sales: 'المبيعات',
      shop: 'المتجر',
      addToCart: 'إضافة',
      view: 'عرض',
      sourcingList: 'قائمة المصادر',
      getCoupon: 'احصل على كوبون',
      originalPrice: 'السعر الأصلي',
      save: 'وفر',
      searchHint: 'نصيحة: البحث بالصينية يعطي نتائج أفضل'
    },
    ru: {
      searchPlaceholder: 'Поиск товаров...',
      hotSearch: 'Популярные',
      hotProducts: 'Трендовые',
      categories: 'Категории',
      search: 'Поиск',
      price: 'Цена',
      sales: 'продаж',
      shop: 'Магазин',
      addToCart: 'В список',
      view: 'Подробнее',
      sourcingList: 'Список закупок',
      getCoupon: 'Купон',
      originalPrice: 'Оригинал',
      save: 'Экономия',
      searchHint: 'Совет: поиск на китайском лучше'
    },
    es: {
      searchPlaceholder: 'Buscar productos...',
      hotSearch: 'Populares',
      hotProducts: 'En tendencia',
      categories: 'Categorías',
      search: 'Buscar',
      price: 'Precio',
      sales: 'vendidos',
      shop: 'Tienda',
      addToCart: 'Añadir',
      view: 'Ver',
      sourcingList: 'Lista de abastecimiento',
      getCoupon: 'Cupón',
      originalPrice: 'Original',
      save: 'Ahorra',
      searchHint: 'Consejo: buscar en chino es mejor'
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
        window.open(product.link, '_blank');
      }
    } catch (error) {
      console.error('Convert link failed:', error);
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
    <div className="min-h-full bg-gray-50 pb-20 md:pb-6">
      {/* Search Section */}
      <div className="max-w-4xl mx-auto px-3 md:px-4 pt-4 md:pt-6">
        {/* Search Box - Mobile optimized */}
        <div className="relative mb-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={text.searchPlaceholder}
            className="w-full px-4 py-3.5 pl-12 pr-20 text-base md:text-base border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <button
            onClick={() => handleSearch()}
            disabled={loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 md:px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 text-sm md:text-base font-medium"
          >
            {loading ? '...' : text.search}
          </button>
        </div>

        {/* Search Hint */}
        <p className="text-xs md:text-sm text-gray-500 mb-4">{text.searchHint}</p>

        {/* Hot Keywords + Trending Products */}
        {!products.length && (
          <div className="space-y-5 md:space-y-6 mb-6">
            {/* Real Hot Keywords - Horizontal scroll on mobile */}
            <div>
              <div className="flex items-center gap-2 mb-2.5 text-gray-600">
                <TrendingUp className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium">{text.hotSearch}</span>
                <span className="text-xs text-gray-400 ml-auto">Live</span>
              </div>
              {hotLoading ? (
                <div className="flex gap-2 animate-pulse overflow-x-auto">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="h-9 w-24 bg-gray-200 rounded-full flex-shrink-0" />
                  ))}
                </div>
              ) : (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory -mx-3 px-3">
                  {hotKeywords.slice(0, 10).map(word => (
                    <button
                      key={word}
                      onClick={() => {
                        setQuery(word);
                        handleSearch(word);
                      }}
                      className="px-3.5 py-2 bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-full text-sm hover:bg-red-100 hover:border-red-300 transition-colors flex-shrink-0 snap-start whitespace-nowrap"
                    >
                      <span className="mr-1">🔥</span>{word}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Trending Products - Responsive grid */}
            <div>
              <div className="flex items-center gap-2 mb-2.5 text-gray-600">
                <Grid3X3 className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">{text.hotProducts}</span>
              </div>
              {hotLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-4">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="bg-gray-100 rounded-xl h-56 md:h-48 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-4">
                  {hotProducts.map(product => {
                    const savings = getSavings(product);
                    return (
                      <div key={product.id} 
                        className="bg-white border rounded-xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group active:scale-[0.98]"
                        onClick={() => setSelectedProduct(product)}>
                        <div className="aspect-[4/5] md:aspect-square bg-gray-100 relative overflow-hidden">
                          <img
                            src={product.image}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x300?text=No+Image';
                            }}
                          />
                          {product.hotKeyword && (
                            <div className="absolute top-1.5 left-1.5 bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] md:text-xs px-1.5 py-0.5 rounded-full font-medium">
                              🔥 {product.hotKeyword}
                            </div>
                          )}
                          {product.commissionRate && product.commissionRate > 0 && (
                            <div className="absolute bottom-1.5 right-1.5 bg-green-500 text-white text-[10px] md:text-xs px-1.5 py-0.5 rounded-full">
                              {product.commissionRate}%佣
                            </div>
                          )}
                        </div>
                        <div className="p-2 md:p-3">
                          <h3 className="text-xs md:text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 leading-tight">
                            {product.title}
                          </h3>
                          
                          {/* Price Section */}
                          <div className="mt-1.5 flex items-baseline gap-1.5 flex-wrap">
                            <span className="text-base md:text-lg font-bold text-red-600">
                              ¥{product.price}
                            </span>
                            {product.originalPrice && product.originalPrice > product.price && (
                              <span className="text-[10px] md:text-xs text-gray-400 line-through">
                                ¥{product.originalPrice}
                              </span>
                            )}
                            {savings && (
                              <span className="text-[10px] bg-red-100 text-red-600 px-1 py-0.5 rounded">
                                省¥{savings}
                              </span>
                            )}
                          </div>
                          
                          {/* Meta info */}
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[10px] md:text-xs text-gray-500">
                              {(product.monthSales || product.sales || 0).toLocaleString()}{text.sales}
                            </span>
                            {product.shopType === 1 && (
                              <span className="text-[10px] bg-red-50 text-red-600 px-1 py-0.5 rounded">天猫</span>
                            )}
                          </div>
                          
                          {/* Coupon badge */}
                          {product.couponInfo && (
                            <div className="mt-1 flex items-center gap-0.5 text-[10px] md:text-xs text-orange-600">
                              <TicketPercent className="w-3 h-3" />
                              <span className="truncate">{product.couponInfo}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Categories - Mobile optimized */}
            <div>
              <div className="flex items-center gap-2 mb-2.5 text-gray-600">
                <Grid3X3 className="w-4 h-4" />
                <span className="text-sm font-medium">{text.categories}</span>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-4">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setQuery(cat.searchName);
                      handleSearch(cat.searchName);
                    }}
                    className="p-3 md:p-4 bg-white border rounded-xl text-center hover:shadow-md transition-shadow active:scale-95"
                  >
                    <span className="text-xl md:text-2xl mb-1 md:mb-2 block">{cat.icon}</span>
                    <span className="text-xs md:text-sm text-gray-700">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Products Grid - Search Results */}
        {products.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-4">
            {products.map(product => {
              const savings = getSavings(product);
              return (
                <div key={product.id} className="bg-white border rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                  <div 
                    className="aspect-[4/5] md:aspect-square bg-gray-100 cursor-pointer relative"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x300?text=No+Image';
                      }}
                    />
                    {savings && (
                      <div className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <TicketPercent className="w-3 h-3" />
                        <span>省¥{savings}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-2 md:p-3">
                    <h3 
                      className="text-xs md:text-sm font-medium text-gray-900 line-clamp-2 cursor-pointer hover:text-blue-600 leading-tight"
                      onClick={() => setSelectedProduct(product)}
                    >
                      {product.title}
                    </h3>
                    
                    <div className="mt-1.5">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base md:text-lg font-bold text-red-600">
                          ¥{product.price}
                        </span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="text-[10px] md:text-xs text-gray-400 line-through">
                            ¥{product.originalPrice}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] md:text-xs text-gray-500">
                          {product.sales} {text.sales}
                        </span>
                        <span className="text-[10px] md:text-xs text-gray-500 truncate max-w-[60px]">{product.shop}</span>
                      </div>
                    </div>
                    
                    {/* Action Buttons - Mobile optimized */}
                    <div className="mt-2 flex gap-1.5">
                      <button
                        onClick={() => handleGetCoupon(product)}
                        disabled={convertingLink === product.id}
                        className="flex-1 min-h-[40px] px-2 py-1.5 bg-red-500 text-white text-xs md:text-sm rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-1 font-medium"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>{convertingLink === product.id ? '...' : text.getCoupon}</span>
                      </button>
                      <button
                        onClick={() => addToCart(product)}
                        className="min-h-[40px] px-2 py-1.5 border rounded-lg text-xs md:text-sm hover:bg-gray-50"
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
