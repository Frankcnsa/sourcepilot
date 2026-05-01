'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, ShoppingCart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { translateText } from '@/lib/aliyun-translate';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { useTranslation } from '@/hooks/useTranslation';
import ProductModal from '@/components/ProductModal';

interface Product {
  id: string;
  goodsId: string;
  dtitle: string;
  actualPrice: number;
  pic: string;
  shop: string;
  sales: string;
  yuanjia?: number;
  couponInfo?: string;
  link?: string;
  [key: string]: any; // 允许全量字段
}

// 统一字段处理函数（适配后端返回的中文全量数据）
function normalizeProduct(item: any): Product {
  return {
    id: item.goodsId || item.goodsSign || item.id || '',
    goodsId: item.goodsId || item.goodsSign || item.id || '',
    dtitle: item.dtitle || item.title || '',
    actualPrice: item.actualPrice || item.jiage || 0,
    pic: item.pic || item.mainPic || item.pictUrl || '',
    shop: item.shopName || item.shop || item.sellerId || '',
    sales: item.monthSales || item.sales || '',
    yuanjia: item.yuanjia || item.originalPrice || item.actualPrice || 0,
    couponInfo: item.couponInfo || (item.couponPrice ? `减${item.couponPrice}元` : ''),
    link: item.itemLink || item.link || '',
    // 保留其他全量字段
    ...item
  };
}

export default function SearchSourceContent() {
  const router = useRouter();
  const { lang } = useLanguage();
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 栏目数据
  const [categories, setCategories] = useState<any[]>([]);
  const [realTime, setRealTime] = useState<Product[]>([]);
  const [dailyHot, setDailyHot] = useState<Product[]>([]);
  const [highCommission, setHighCommission] = useState<Product[]>([]);
  const [guessLike, setGuessLike] = useState<Product[]>([]);
  
  // 加载状态
  const [realTimeLoading, setRealTimeLoading] = useState(true);
  const [dailyHotLoading, setDailyHotLoading] = useState(true);
  const [highCommissionLoading, setHighCommissionLoading] = useState(true);
  const [guessLikeLoading, setGuessLikeLoading] = useState(true);
  const [guessLikePage, setGuessLikePage] = useState(1);
  const [guessLikeHasMore, setGuessLikeHasMore] = useState(true);
  const [guessLikeLoadingMore, setGuessLikeLoadingMore] = useState(false);
  
  // UI 状态
  const [cartCount, setCartCount] = useState(0);
  const [activeCategory, setActiveCategory] = useState<number|null>(null);
  const [showSubMenu, setShowSubMenu] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [selectedProductId, setSelectedProductId] = useState<string|null>(null);

  // 获取当前用户登录状态
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }: any) => setUser(data.user));
  }, []);

  // 文本（多语言）
  const text: any = {
    zh: { 
      searchPlaceholder: '搜索产品...', 
      realTime: '实时热销榜', 
      dailyHot: '每日爆品', 
      highCommission: '高佣精选',
      guessLike: '猜你喜欢', 
      search: '搜索', 
      loading: '加载中...', 
      noData: '暂无数据', 
      viewMore: '查看更多' 
    },
    en: { 
      searchPlaceholder: 'Search products...', 
      realTime: 'Hot Sales', 
      dailyHot: 'Daily Hot', 
      highCommission: 'High Commission',
      guessLike: 'Guess You Like', 
      search: 'Search', 
      loading: 'Loading...', 
      noData: 'No data', 
      viewMore: 'View More' 
    },
    ru: { 
      searchPlaceholder: 'Поиск...', 
      realTime: 'Горячие продажи', 
      dailyHot: 'Ежедневный хит', 
      highCommission: 'Высокая комиссия',
      guessLike: 'Вам может понравиться', 
      search: 'Поиск', 
      loading: 'Загрузка...', 
      noData: 'Нет данных', 
      viewMore: 'Посмотреть ещё' 
    },
    es: { 
      searchPlaceholder: 'Buscar...', 
      realTime: 'Más Vendidos', 
      dailyHot: 'Popular Hoy', 
      highCommission: 'Alta Comisión',
      guessLike: 'Quizás te guste', 
      search: 'Buscar', 
      loading: 'Cargando...', 
      noData: 'Sin datos', 
      viewMore: 'Ver más' 
    },
    ar: { 
      searchPlaceholder: 'بحث...', 
      realTime: 'الأكثر مبيعاً', 
      dailyHot: 'الأكثر شعبية', 
      highCommission: 'عمولة عالية',
      guessLike: 'قد يعجبك', 
      search: 'بحث', 
      loading: 'جاري التحميل...', 
      noData: 'لا توجد بيانات', 
      viewMore: 'عرض المزيد' 
    }
  }[lang] || {
    searchPlaceholder: 'Search...', 
    realTime: 'Hot Sales', 
    dailyHot: 'Daily Hot', 
    highCommission: 'High Commission',
    guessLike: 'Guess You Like', 
    search: 'Search', 
    loading: 'Loading...', 
    noData: 'No data', 
    viewMore: 'View More'
  };

  // 翻译栏目数据（使用 useTranslation Hook）
  const realTimeWithTranslation = useTranslation(realTime, lang, ['dtitle', 'shop']);
  const dailyHotWithTranslation = useTranslation(dailyHot, lang, ['dtitle', 'shop']);
  const highCommissionWithTranslation = useTranslation(highCommission, lang, ['dtitle', 'shop']);
  const guessLikeWithTranslation = useTranslation(guessLike, lang, ['dtitle', 'shop']);
  
  // 搜索结果翻译
  const productsWithTranslation = useTranslation(products, lang, ['dtitle', 'shop']);

  // 加载分类（从API获取完整数据，然后合并本地翻译）
  useEffect(() => {
    const loadCategories = async () => {
      try {
        // 1. 先尝试加载本地翻译数据
        const localRes = await fetch('/data/categories-translations.json');
        const localData = await localRes.json();
        const translationMap = new Map();
        
        if (localData.categories) {
          localData.categories.forEach((cat: any) => {
            translationMap.set(cat.cid, {
              translations: cat.translations,
              subcategories: cat.subcategories?.map((sub: any) => ({
                subcid: sub.subcid,
                subcname: sub.subcname,
                translations: sub.translations
              }))
            });
          });
        }
        
        // 2. 从API获取完整分类（含图片）
        const apiRes = await fetch('/api/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'super-categories' })
        });
        const apiData = await apiRes.json();
        
        let apiCategories = [];
        if (apiData.success && Array.isArray(apiData.data)) {
          apiCategories = apiData.data;
        } else if (apiData.success && apiData.data?.categoryRespVOS) {
          apiCategories = apiData.data.categoryRespVOS;
        }
        
        // 3. 合并：API数据（含图片）+ 本地翻译
        const mergedCategories = apiCategories.map((cat: any) => {
          const translation = translationMap.get(cat.cid);
          return {
            ...cat,
            translations: translation?.translations || null,
            subcategories: cat.subcategories?.map((sub: any) => {
              const subTranslation = translation?.subcategories?.find((s: any) => s.subcid === sub.subcid);
              return {
                ...sub,
                translations: subTranslation?.translations || null
              };
            }) || null
          };
        });
        
        setCategories(mergedCategories);
      } catch (err) {
        console.error('[Categories] 加载失败:', err);
      }
    };
    
    loadCategories();
  }, []);

  // 加载栏目数据（后端返回全量中文，前端负责翻译）
  useEffect(() => {
    const timestamp = Date.now();

    // 实时热销榜
    setRealTimeLoading(true);
    fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'real-time', pageSize: 10, page: 1, _t: timestamp })
    })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          const rawItems = data.data.data || data.data.list || data.data || [];
          const items = rawItems.map((item: any) => normalizeProduct(item));
          setRealTime(items.slice(0, 10));
        }
        setRealTimeLoading(false);
      })
      .catch(() => setRealTimeLoading(false));

    // 每日爆品
    setDailyHotLoading(true);
    fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'daily-hot', pageSize: 10, page: 1, _t: timestamp })
    })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          const rawItems = data.data.list || data.data.data || data.data || [];
          const items = rawItems.map((item: any) => normalizeProduct(item));
          setDailyHot(items.slice(0, 10));
        }
        setDailyHotLoading(false);
      })
      .catch(() => setDailyHotLoading(false));

    // 高佣精选
    setHighCommissionLoading(true);
    fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'hot-products', pageSize: 10, page: 1, _t: timestamp })
    })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          const rawItems = data.data.list || data.data.data || data.data || [];
          const items = rawItems.map((item: any) => normalizeProduct(item));
          setHighCommission(items.slice(0, 10));
        }
        setHighCommissionLoading(false);
      })
      .catch(() => setHighCommissionLoading(false));

    // 猜你喜欢
    setGuessLikeLoading(true);
    setGuessLikePage(1);
    fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'guess-you-like', size: 10, page: 1, _t: timestamp })
    })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          const rawItems = data.data.list || data.data.data || data.data || [];
          const items = rawItems.map((item: any) => normalizeProduct(item));
          setGuessLike(items);
          setGuessLikeHasMore(items.length >= 10);
        }
        setGuessLikeLoading(false);
      })
      .catch(() => setGuessLikeLoading(false));
  }, [lang]);

  // 搜索（关键：搜索词先翻成中文再给大淘客API）
  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;
    setLoading(true);
    try {
      // ❗️ 关键：无论什么语言，先翻成中文再给API
      let searchTerm = q;
      if (lang !== 'zh') {
        try {
          searchTerm = await translateText(q, lang, 'zh');
        } catch (e) {
          console.warn('翻译查询词失败，使用原文:', e);
        }
      }
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'search', query: searchTerm, pageSize: 20, page: 1 })
      });
      const data = await res.json();
      if (data.success && data.data) {
        const rawItems = data.data.list || data.data.data || data.data || [];
        const items = rawItems.map((item: any) => normalizeProduct(item));
        setProducts(items.slice(0, 20));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (e) {
      console.error('Search failed:', e);
    } finally {
      setLoading(false);
    }
  };

  // 加载更多猜你喜欢
  const loadMoreGuessLike = async () => {
    if (guessLikeLoadingMore || !guessLikeHasMore) return;
    setGuessLikeLoadingMore(true);
    const nextPage = guessLikePage + 1;
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'guess-you-like', size: 10, page: nextPage, _t: Date.now() })
      });
      const data = await res.json();
      if (data.success && data.data) {
        const rawItems = data.data.list || data.data.data || data.data || [];
        const items = rawItems.map((item: any) => normalizeProduct(item));
        setGuessLike(prev => [...prev, ...items]);
        setGuessLikePage(nextPage);
        setGuessLikeHasMore(items.length >= 10);
      } else {
        setGuessLikeHasMore(false);
      }
    } catch (e) {
      console.error('Load more failed:', e);
    } finally {
      setGuessLikeLoadingMore(false);
    }
  };

  // 商品点击：存储到 sessionStorage（为详情页准备）
  const handleProductClick = (product: Product) => {
    // 未登录，跳转到登录页
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    
    // 已登录，存储商品数据到 sessionStorage，然后显示详情弹窗
    try {
      sessionStorage.setItem('currentProduct', JSON.stringify({
        id: product.goodsId || product.id,
        title: product.dtitle,
        pic: product.pic,
        price: product.actualPrice,
        shop: product.shop,
        // 可以存储更多字段
        yuanjia: product.yuanjia,
        couponInfo: product.couponInfo,
        link: product.link
      }));
    } catch (e) {
      console.warn('[Search] 存储到 sessionStorage 失败:', e);
    }
    
    setSelectedProductId(product.goodsId || product.id);
  };

  // 渲染商品卡片（统一样式）
  const renderProductCard = (product: Product, isHorizontal: boolean = false) => (
    <div 
      key={product.goodsId || product.id} 
      className={`bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm ${isHorizontal ? 'flex-shrink-0 w-36' : ''}`}
      onClick={() => handleProductClick(product)}
    >
      <div className="aspect-square relative">
        <img 
          src={product.pic?.replace('http://', 'https://')} 
          alt={product.dtitle} 
          className="w-full h-full object-cover" 
        />
        {product.couponInfo && (
          <div className="absolute top-1 left-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded">
            -{product.couponInfo.replace(/[^0-9]/g, '')}元
          </div>
        )}
      </div>
      <div className="p-2.5 space-y-1.5">
        <h3 className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug">
          {product.dtitle}
        </h3>
        <div className="flex items-center gap-1.5">
          <span className="text-orange-600 font-bold text-base">¥{product.actualPrice || product.yuanjia || 'N/A'}</span>
          {product.yuanjia && product.yuanjia > (product.actualPrice || 0) && (
            <span className="text-xs text-gray-400 line-through">¥{product.yuanjia}</span>
          )}
        </div>
      </div>
    </div>
  );

  // 渲染横向滚动栏目（无标题）
  const renderHorizontalSection = (items: Product[], isLoading: boolean, translationData: Product[]) => (
    <div className="mb-6">
      {isLoading ? (
        <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-2">
          {[1,2,3,4].map(i => (
            <div key={i} className="flex-shrink-0 w-36 bg-white rounded-xl overflow-hidden border border-gray-100">
              <div className="aspect-square bg-gray-200 animate-pulse" />
              <div className="p-2 space-y-1">
                <div className="h-3 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : translationData.length > 0 ? (
        <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-2">
          {translationData.map(product => renderProductCard(product, true))}
        </div>
      ) : (
        <div className="text-sm text-gray-400 py-4">{text.noData}</div>
      )}
    </div>
  );

  // 渲染纵向网格栏目（支持无限滚动）
  const renderVerticalSection = (title: string, items: Product[], isLoading: boolean, translationData: Product[], hasMore?: boolean, onLoadMore?: () => void, isLoadingMore?: boolean) => (
    <div className="mb-6">
      {isLoading ? (
        <div className="grid grid-cols-2 gap-2.5">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-100">
              <div className="aspect-square bg-gray-200 animate-pulse" />
              <div className="p-2.5 space-y-1.5">
                <div className="h-3 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : translationData.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-2.5">
            {/* 单数时减掉最后一个，保证偶数 */}
            {translationData.slice(0, translationData.length % 2 === 1 ? translationData.length - 1 : translationData.length).map(product => renderProductCard(product))}
          </div>
          {hasMore && (
            <div className="text-center py-4">
              <button
                onClick={onLoadMore}
                disabled={isLoadingMore}
                className="text-sm text-orange-500 hover:text-orange-600 disabled:opacity-50"
              >
                {isLoadingMore ? text.loading : text.viewMore}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-sm text-gray-400 py-4">{text.noData}</div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-3 py-2.5 flex items-center gap-2">
          {/* 搜索框 */}
          <div className="flex-1 mx-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e: any) => setQuery(e.target.value)}
              onKeyDown={(e: any) => e.key === 'Enter' && handleSearch()}
              placeholder={text.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* 搜索按钮 */}
          <button
            onClick={() => handleSearch()}
            className="px-4 py-2 bg-orange-500 text-white text-sm rounded-full hover:bg-orange-600 transition-colors"
          >
            {text.search}
          </button>

          {/* 购物车 */}
          <button
            onClick={() => router.push('/tools/sourcing-list')}
            className="relative p-1.5 hover:bg-gray-100 rounded-lg"
          >
            <ShoppingCart className="w-5 h-5 text-gray-700" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 分类导航 */}
      {categories.length > 0 && (
        <div className="bg-white border-b">
          <div className="max-w-6xl mx-auto px-3 py-2 flex gap-3 overflow-x-auto scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat.cid}
                onClick={() => {
                  setActiveCategory(activeCategory === cat.cid ? null : cat.cid);
                  setShowSubMenu(activeCategory !== cat.cid);
                  if (cat.cname) handleSearch(cat.cname);
                }}
                className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors ${
                  activeCategory === cat.cid ? 'bg-orange-50 text-orange-600' : 'hover:bg-gray-50'
                }`}
              >
                {cat.cpic && <img src={cat.cpic} alt={cat.cname} className="w-8 h-8 rounded-lg" />}
                <span className="text-xs whitespace-nowrap">{cat.translations?.[lang] || cat.cname}</span>
              </button>
            ))}
          </div>

          {/* 二级分类浮层 */}
          {showSubMenu && activeCategory && categories.find(c => c.cid === activeCategory)?.subcategories && (
            <div className="max-w-6xl mx-auto px-3 pb-3">
              <div className="flex gap-2 flex-wrap">
                {categories.find(c => c.cid === activeCategory)!.subcategories!.map((sub: any) => (
                  <button
                    key={sub.subcid}
                    onClick={() => {
                      handleSearch(sub.translations?.[lang] || sub.subcname);
                      setShowSubMenu(false);
                    }}
                    className="px-3 py-1 bg-gray-100 rounded-full text-sm hover:bg-orange-50 hover:text-orange-600 transition-colors"
                  >
                    {sub.translations?.[lang] || sub.subcname}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="max-w-6xl mx-auto px-3 py-4">
        {/* 搜索结果（无标题） */}
        {productsWithTranslation.translatedItems.length > 0 && (
          <div className="mb-6">
            <div className="grid grid-cols-2 gap-2.5">
              {productsWithTranslation.translatedItems.map(product => renderProductCard(product))}
            </div>
          </div>
        )}

        {/* 4大栏目（顺序：实时热销榜→每日爆品→高佣精选→猜你喜欢） */}
        {renderHorizontalSection(realTime, realTimeLoading, realTimeWithTranslation.translatedItems)}
        {renderVerticalSection(text.dailyHot, dailyHot, dailyHotLoading, dailyHotWithTranslation.translatedItems)}
        {renderVerticalSection(text.highCommission, highCommission, highCommissionLoading, highCommissionWithTranslation.translatedItems)}
        {renderVerticalSection(text.guessLike, guessLike, guessLikeLoading, guessLikeWithTranslation.translatedItems, guessLikeHasMore, loadMoreGuessLike, guessLikeLoadingMore)}

        {/* 加载指示器 */}
        {loading && (
          <div className="text-center py-8 text-sm text-gray-400">{text.loading}</div>
        )}
      </div>

      {/* 产品详情弹窗 */}
      {selectedProductId && (
        <ProductModal 
          productId={selectedProductId}
          lang={lang}
          onClose={() => setSelectedProductId(null)}
        />
      )}
    </div>
  );
}
