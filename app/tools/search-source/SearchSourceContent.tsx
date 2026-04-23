'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, TrendingUp, ShoppingCart, TicketPercent } from 'lucide-react';
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
  couponInfo?: string;
  shopType?: number;
  monthSales?: number;
  desc?: string;
  couponLink?: string;
  brandName?: string;
}

// 分类配置
const categories = [
  { id: '1', name: '数码', searchName: '电子产品', icon: '📱', color: 'bg-blue-50 text-blue-600' },
  { id: '2', name: '服饰', searchName: '服装', icon: '👕', color: 'bg-pink-50 text-pink-600' },
  { id: '3', name: '家居', searchName: '家居', icon: '🏠', color: 'bg-green-50 text-green-600' },
  { id: '4', name: '美妆', searchName: '美妆', icon: '💄', color: 'bg-purple-50 text-purple-600' },
  { id: '5', name: '食品', searchName: '零食', icon: '🍔', color: 'bg-orange-50 text-orange-600' },
  { id: '6', name: '运动', searchName: '运动', icon: '⚽', color: 'bg-red-50 text-red-600' },
  { id: '7', name: '母婴', searchName: '母婴', icon: '🍼', color: 'bg-yellow-50 text-yellow-600' },
  { id: '8', name: '玩具', searchName: '玩具', icon: '🧸', color: 'bg-indigo-50 text-indigo-600' },
  { id: '9', name: '车品', searchName: '汽车用品', icon: '🚗', color: 'bg-gray-100 text-gray-600' },
  { id: '10', name: '图书', searchName: '图书', icon: '📚', color: 'bg-teal-50 text-teal-600' },
];

export default function SearchSourcePage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartCount, setCartCount] = useState(0);

  // 热销数据
  const [hotProducts, setHotProducts] = useState<Product[]>([]);
  const [hotKeywords, setHotKeywords] = useState<string[]>([]);
  const [hotLoading, setHotLoading] = useState(true);
  
  // 瀑布流加载
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // 加载购物车数量
  useEffect(() => {
    fetchCartCount();
  }, []);

  const fetchCartCount = async () => {
    try {
      const res = await fetch('/api/sourcing-items');
      if (res.ok) {
        const data = await res.json();
        setCartCount(data.items?.length || 0);
      }
    } catch (e) {
      // ignore
    }
  };

  // 加载热销商品
  useEffect(() => {
    fetchHotProducts();
  }, [currentLang]);

  const fetchHotProducts = async () => {
    setHotLoading(true);
    try {
      const res = await fetch(`/api/hot-products?lang=${currentLang}&limit=10`);
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

  // 翻译文本
  const t = {
    en: {
      searchPlaceholder: 'Search products...',
      hotSearch: 'Trending',
      hotProducts: 'Hot Products',
      dailyDeals: 'Daily Deals',
      categories: 'Categories',
      search: 'Search',
      sales: 'sold',
      addToCart: 'Add to List',
      buyNow: 'Buy Now',
      originalPrice: 'Original',
      save: 'Save',
      searchHint: 'Search in Chinese for better results',
      loadMore: 'Load More',
      noMore: 'No more products',
      loading: 'Loading...'
    },
    zh: {
      searchPlaceholder: '搜索宝贝...',
      hotSearch: '实时热搜',
      hotProducts: '热销榜单',
      dailyDeals: '每日好价',
      categories: '分类',
      search: '搜索',
      sales: '人付款',
      addToCart: '加入清单',
      buyNow: '立即购买',
      originalPrice: '原价',
      save: '省',
      searchHint: '中文搜索效果更佳',
      loadMore: '加载更多',
      noMore: '没有更多了',
      loading: '加载中...'
    }
  };

  const text = t[currentLang as keyof typeof t] || t.en;

  // 搜索商品
  const handleSearch = async (searchQuery?: string, pageNum: number = 1) => {
    const q = searchQuery || query;
    if (!q.trim()) return;

    if (pageNum === 1) {
      setLoading(true);
      setProducts([]);
      setPage(1);
    } else {
      setLoadingMore(true);
    }

    try {
      const response = await fetch('/api/search/dataoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          page: pageNum,
          pageSize: 20,
          targetLang: currentLang
        })
      });

      const data = await response.json();
      if (data.success) {
        const newProducts = data.products || [];
        if (pageNum === 1) {
          setProducts(newProducts);
        } else {
          setProducts(prev => [...prev, ...newProducts]);
        }
        setHasMore(newProducts.length === 20);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // 加载更多
  const loadMore = () => {
    if (!loadingMore && hasMore) {
      handleSearch(query, page + 1);
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
        // Show a subtle toast instead of alert
        // For now, just update count
      } else if (response.status === 409) {
        // Already exists - silently ignore or show subtle hint
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

  // 格式化销量
  const formatSales = (sales: number | string) => {
    const num = typeof sales === 'string' ? parseInt(sales) || 0 : sales || 0;
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万';
    }
    return num.toString();
  };

  return (
    <div className="min-h-full bg-gray-50 pb-8">
      {/* Sticky Search Header */}
      <div className="sticky top-0 z-30 bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-3 py-2.5">
          <div className="flex items-center gap-2">
            {/* Search Box */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={text.searchPlaceholder}
                className="w-full px-4 py-2.5 pl-10 pr-4 text-sm bg-gray-100 border-0 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-colors"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            
            {/* Search Button */}
            <button
              onClick={() => handleSearch()}
              disabled={loading}
              className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm rounded-full hover:from-orange-600 hover:to-red-600 disabled:opacity-50 font-medium whitespace-nowrap"
            >
              {loading ? '...' : text.search}
            </button>
            
            {/* Cart Icon */}
            <button 
              onClick={() => router.push('/tools/sourcing-list')}
              className="relative p-2 hover:bg-gray-100 rounded-full"
            >
              <ShoppingCart className="w-5 h-5 text-gray-600" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>
          </div>
          
          {/* Search Hint */}
          <p className="text-xs text-gray-400 mt-1.5 px-1">{text.searchHint}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3">
        {/* Hot Keywords - Horizontal Scroll */}
        {!products.length && (
          <div className="py-3">
            {hotLoading ? (
              <div className="flex gap-2 animate-pulse overflow-x-auto">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="h-7 w-20 bg-gray-200 rounded-full flex-shrink-0" />
                ))}
              </div>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-3 px-3">
                {hotKeywords.slice(0, 12).map(word => (
                  <button
                    key={word}
                    onClick={() => {
                      setQuery(word);
                      handleSearch(word);
                    }}
                    className="px-3 py-1.5 bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-full text-xs hover:bg-red-100 transition-colors flex-shrink-0 whitespace-nowrap"
                  >
                    <span className="mr-1">🔥</span>{word}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Categories Grid - Taobao Style */}
        {!products.length && (
          <div className="py-2">
            <div className="grid grid-cols-5 gap-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setQuery(cat.searchName);
                    handleSearch(cat.searchName);
                  }}
                  className="flex flex-col items-center gap-1 py-2 rounded-xl hover:bg-gray-50 active:scale-95 transition-all"
                >
                  <div className={`w-10 h-10 rounded-full ${cat.color} flex items-center justify-center text-lg`}>
                    {cat.icon}
                  </div>
                  <span className="text-[11px] text-gray-600">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Section Header */}
        {!products.length && (
          <div className="flex items-center gap-2 py-3 border-b">
            <TrendingUp className="w-4 h-4 text-red-500" />
            <span className="text-sm font-bold text-gray-800">{text.hotProducts}</span>
            <span className="text-xs text-gray-400 ml-auto">{text.dailyDeals}</span>
          </div>
        )}

        {/* Products Grid */}
        {(products.length > 0 || !hotLoading) && (
          <div className="grid grid-cols-2 gap-2.5 py-3">
            {(products.length > 0 ? products : hotProducts).map(product => {
              const savings = getSavings(product);
              return (
                <div 
                  key={product.id} 
                  className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow active:scale-[0.98] cursor-pointer"
                  onClick={() => setSelectedProduct(product)}
                >
                  {/* Image */}
                  <div className="aspect-[4/5] bg-gray-100 relative overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x300?text=No+Image';
                      }}
                    />
                    {/* Coupon Badge */}
                    {product.couponInfo && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                        {product.couponInfo}
                      </div>
                    )}
                    {/* Shop Type */}
                    {product.shopType === 1 && (
                      <div className="absolute bottom-2 right-2 bg-red-50 text-red-600 text-[10px] px-1.5 py-0.5 rounded border border-red-100">
                        天猫
                      </div>
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="p-2">
                    {/* Title */}
                    <h3 className="text-xs text-gray-800 line-clamp-2 leading-tight min-h-[2.5em]">
                      {product.brandName && <span className="text-red-500 font-medium mr-1">{product.brandName}</span>}
                      {product.title}
                    </h3>
                    
                    {/* Price Row */}
                    <div className="mt-1.5 flex items-end gap-1.5">
                      <span className="text-[10px] text-red-500">¥</span>
                      <span className="text-lg font-bold text-red-500 leading-none">
                        {product.price}
                      </span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-[10px] text-gray-400 line-through mb-0.5">
                          ¥{product.originalPrice}
                        </span>
                      )}
                      {savings && (
                        <span className="text-[10px] bg-red-100 text-red-500 px-1 py-0.5 rounded ml-auto">
                          省¥{savings}
                        </span>
                      )}
                    </div>
                    
                    {/* Sales + Shop */}
                    <div className="mt-1 flex items-center justify-between text-[10px] text-gray-400">
                      <span>{formatSales(product.monthSales || product.sales)}{text.sales}</span>
                      <span className="truncate max-w-[80px]">{product.shop}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load More */}
        {products.length > 0 && (
          <div className="py-4 text-center">
            {hasMore ? (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-6 py-2 bg-white border rounded-full text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                {loadingMore ? text.loading : text.loadMore}
              </button>
            ) : (
              <span className="text-xs text-gray-400">{text.noMore}</span>
            )}
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
          currentLang={currentLang}
        />
      )}
    </div>
  );
}
