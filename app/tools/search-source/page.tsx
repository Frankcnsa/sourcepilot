'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, ShoppingCart, X, Loader2, Globe, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';

// 支持的语言
const supportedLanguages = [
  { code: 'zh', name: '中文' },
  { code: 'en', name: 'English' },
  { code: 'ru', name: 'Русский' },
  { code: 'ar', name: 'العربية' },
  { code: 'es', name: 'Español' }
];

// 多语言文本
const translations = {
  pageTitle: {
    zh: 'Search Source - 淘宝商品搜索',
    en: 'Search Source - Taobao Product Search',
    ru: 'Search Source - Поиск товаров на Taobao',
    ar: 'Search Source - البحث عن منتجات Taobao',
    es: 'Search Source - Búsqueda de productos Taobao'
  },
  searchPlaceholder: {
    zh: '输入产品关键词（如：LED灯、手机壳）',
    en: 'Enter product keyword (e.g., LED light, phone case)',
    ru: 'Введите ключевое слово (например, LED лампа, чехол)',
    ar: 'أدخل كلمة المنتج (مثل: مصباح LED، غطاء هاتف)',
    es: 'Ingrese palabra clave (ej: luz LED, funda)'
  },
  searchButton: {
    zh: '搜索',
    en: 'Search',
    ru: 'Поиск',
    ar: 'بحث',
    es: 'Buscar'
  },
  tipText: {
    zh: '🔍 此搜索功能完全免费。找到心仪商品后加入 Sourcing List，点击「Consultation」让 Pilot 为您制定最优采购方案。',
    en: '🔍 This search is completely free. Add items to Sourcing List, then click「Consultation」to let Pilot craft your optimal sourcing plan.',
    ru: '🔍 Поиск полностью бесплатный. Добавьте товары в список, затем нажмите「Consultation」— Pilot подготовит оптимальный план закупок.',
    ar: '🔍 البحث مجاني بالكامل. أضف المنتجات إلى القائمة، ثم اضغط「Consultation」ل يصمم بايلوت خطة المشتريات المثلى.',
    es: '🔍 Esta búsqueda es completamente gratis. Añade productos a la lista, luego haz clic en「Consultation」para que Pilot diseñe tu plan de compras óptimo.'
  },
  addToList: {
    zh: '加入清单',
    en: 'Add to List',
    ru: 'В список',
    ar: 'أضف للقائمة',
    es: 'Añadir'
  },
  added: {
    zh: '已添加',
    en: 'Added',
    ru: 'Добавлено',
    ar: 'تمت الإضافة',
    es: 'Añadido'
  },
  loading: {
    zh: '搜索中...',
    en: 'Searching...',
    ru: 'Поиск...',
    ar: 'جاري البحث...',
    es: 'Buscando...'
  },
  loadMore: {
    zh: '加载更多',
    en: 'Load More',
    ru: 'Загрузить ещё',
    ar: 'تحميل المزيد',
    es: 'Cargar más'
  },
  noMore: {
    zh: '没有更多数据了',
    en: 'No more data',
    ru: 'Больше нет данных',
    ar: 'لا مزيد من البيانات',
    es: 'No hay más datos'
  },
  noResults: {
    zh: '未找到相关商品，换个关键词试试',
    en: 'No products found, try different keywords',
    ru: 'Товары не найдены, попробуйте другие слова',
    ar: 'لم يتم العثور على منتجات، جرب كلمات أخرى',
    es: 'No se encontraron productos, intente otras palabras'
  },
  viewDetails: {
    zh: '查看详情',
    en: 'View Details',
    ru: 'Подробнее',
    ar: 'عرض التفاصيل',
    es: 'Ver detalles'
  },
  close: {
    zh: '关闭',
    en: 'Close',
    ru: 'Закрыть',
    ar: 'إغلاق',
    es: 'Cerrar'
  },
  price: {
    zh: '价格',
    en: 'Price',
    ru: 'Цена',
    ar: 'السعر',
    es: 'Precio'
  },
  shop: {
    zh: '店铺',
    en: 'Shop',
    ru: 'Магазин',
    ar: 'المتجر',
    es: 'Tienda'
  },
  sales: {
    zh: '销量',
    en: 'Sales',
    ru: 'Продажи',
    ar: 'المبيعات',
    es: 'Ventas'
  },
  taobaoLink: {
    zh: '淘宝链接',
    en: 'Taobao Link',
    ru: 'Ссылка на Taobao',
    ar: 'رابط Taobao',
    es: 'Enlace Taobao'
  },
  listCount: {
    zh: '清单',
    en: 'List',
    ru: 'Список',
    ar: 'القائمة',
    es: 'Lista'
  }
};

// 检测浏览器语言
function detectLanguage(): string {
  if (typeof window === 'undefined') return 'en';
  const lang = navigator.language || navigator.languages[0] || 'en';
  const primaryLang = lang.split('-')[0];
  return supportedLanguages.find(l => l.code === primaryLang)?.code || 'en';
}

interface Product {
  id: string;
  title: string;
  originalTitle: string;
  price: string;
  originalPrice?: string;
  image: string;
  shop: string;
  sales: string;
  link: string;
  description: string;
}

export default function SearchSourcePage() {
  const [lang, setLang] = useState('en');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [session, setSession] = useState<any>(null);
  
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [listCount, setListCount] = useState(0);
  const [addedProducts, setAddedProducts] = useState<Set<string>>(new Set());
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 初始化
  useEffect(() => {
    setLang(detectLanguage());
    const mobile = window.innerWidth < 768;
    setIsMobile(mobile);
    setSidebarOpen(!mobile);
    
    // 获取 session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchListCount(session.user.id);
      }
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchListCount(session.user.id);
      }
    });
    
    const handleResize = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      subscription.unsubscribe();
    };
  }, []);

  // 获取清单数量
  const fetchListCount = async (userId: string) => {
    try {
      const { count } = await supabase
        .from('sourcing_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      setListCount(count || 0);
    } catch (e) {
      console.error('Failed to fetch list count:', e);
    }
  };

  // 搜索商品
  const searchProducts = async (searchQuery: string, pageNum: number, isLoadMore: boolean = false) => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/search/taobao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          page: pageNum,
          pageSize: pageNum === 1 ? 20 : 10, // 首次20个，后续10个
          userId: session?.user?.id
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (isLoadMore) {
          setProducts(prev => [...prev, ...data.products]);
        } else {
          setProducts(data.products);
        }
        setHasMore(data.hasMore && data.products.length > 0);
        setTotal(data.total || 0);
        setPage(pageNum);
      } else {
        console.error('Search failed:', data.error);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 处理搜索
  const handleSearch = () => {
    if (!query.trim()) return;
    setPage(1);
    setProducts([]);
    searchProducts(query, 1, false);
  };

  // 加载更多
  const loadMore = useCallback(() => {
    if (loading || !hasMore || !query) return;
    const nextPage = page + 1;
    searchProducts(query, nextPage, true);
  }, [loading, hasMore, query, page]);

  // 无限滚动监听
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        loadMore();
      }
    }, { threshold: 0.1 });
    
    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, loadMore]);

  // 添加到清单
  const addToList = async (product: Product) => {
    if (!session) {
      // 未登录，引导到登录
      window.location.href = '/auth/login?redirect=/tools/search-source';
      return;
    }
    
    try {
      const { error } = await supabase.from('sourcing_items').insert({
        user_id: session.user.id,
        product_id: product.id,
        title: product.title,
        original_title: product.originalTitle,
        price: product.price,
        original_price: product.originalPrice,
        image: product.image,
        shop: product.shop,
        sales: product.sales,
        link: product.link,
        description: product.description,
        query: query
      });
      
      if (!error) {
        setAddedProducts(prev => new Set(prev).add(product.id));
        setListCount(prev => prev + 1);
      }
    } catch (e) {
      console.error('Failed to add to list:', e);
    }
  };

  // 获取翻译文本
  const t = (key: keyof typeof translations) => {
    return translations[key][lang as keyof typeof translations[typeof key]] || translations[key]['en'];
  };

  return (
    <div className="flex h-screen bg-[#f5f5f5]">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        currentTool="search-source"
      />
      
      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button 
                onClick={() => setSidebarOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            <h1 className="text-lg font-semibold text-gray-800">Search Source</h1>
          </div>
          
          <div className="flex items-center gap-3">
            {/* 清单计数 */}
            <a 
              href="/tools/sourcing-list"
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="text-sm font-medium">{t('listCount')} {listCount}</span>
            </a>
            
            {/* 语言切换 */}
            <div className="relative">
              <button
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm">{supportedLanguages.find(l => l.code === lang)?.name}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showLangDropdown && (
                <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  {supportedLanguages.map((language) => (
                    <button
                      key={language.code}
                      onClick={() => {
                        setLang(language.code);
                        setShowLangDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                        lang === language.code ? 'bg-blue-50 text-blue-600' : ''
                      }`}
                    >
                      {language.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>
        
        {/* Search Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 py-8">
            {/* 搜索栏 */}
            <div className="mb-6">
              <div className="relative max-w-2xl mx-auto">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={t('searchPlaceholder')}
                  className="w-full px-5 py-4 pr-14 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            
            {/* Tip Banner */}
            <div className="mb-8 bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
              <p className="text-blue-700 text-sm">{t('tipText')}</p>
            </div>
            
            {/* 搜索结果 */}
            {products.length > 0 && (
              <div className="mb-4 text-sm text-gray-500">
                {products.length} / {total} results
              </div>
            )}
            
            {/* 商品网格 */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <div 
                  key={product.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* 商品图片 */}
                  <div 
                    className="aspect-square bg-gray-100 cursor-pointer"
                    onClick={() => setSelectedProduct(product)}
                  >
                    {product.image ? (
                      <img 
                        src={product.image} 
                        alt={product.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-product.png';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  {/* 商品信息 */}
                  <div className="p-3">
                    <h3 
                      className="text-sm font-medium text-gray-800 line-clamp-2 mb-2 cursor-pointer hover:text-blue-600"
                      onClick={() => setSelectedProduct(product)}
                    >
                      {product.title}
                    </h3>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-red-600">
                        ¥{product.price}
                      </span>
                      
                      <button
                        onClick={() => addToList(product)}
                        disabled={addedProducts.has(product.id)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          addedProducts.has(product.id)
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        }`}
                      >
                        {addedProducts.has(product.id) ? (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {t('added')}
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            {t('addToList')}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* 加载更多 / 无更多数据 */}
            {products.length > 0 && (
              <div ref={loadMoreRef} className="mt-8 text-center py-4">
                {loading ? (
                  <div className="flex items-center justify-center gap-2 text-gray-500">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{t('loading')}</span>
                  </div>
                ) : hasMore ? (
                  <button
                    onClick={loadMore}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    {t('loadMore')}
                  </button>
                ) : (
                  <p className="text-gray-400">{t('noMore')}</p>
                )}
              </div>
            )}
            
            {/* 无结果 */}
            {!loading && products.length === 0 && query && (
              <div className="text-center py-12">
                <p className="text-gray-500">{t('noResults')}</p>
              </div>
            )}
          </div>
        </main>
      </div>
      
      {/* 商品详情弹窗 */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* 弹窗头部 */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t('viewDetails')}</h2>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* 弹窗内容 */}
            <div className="p-6">
              {/* 图片 */}
              <div className="aspect-video bg-gray-100 rounded-xl mb-6 overflow-hidden">
                {selectedProduct.image ? (
                  <img 
                    src={selectedProduct.image} 
                    alt={selectedProduct.title}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              
              {/* 商品信息 */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800">{selectedProduct.title}</h3>
                
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold text-red-600">¥{selectedProduct.price}</span>
                  {selectedProduct.originalPrice && (
                    <span className="text-lg text-gray-400 line-through">¥{selectedProduct.originalPrice}</span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">{t('shop')}:</span>
                    <span className="ml-2 text-gray-800">{selectedProduct.shop}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">{t('sales')}:</span>
                    <span className="ml-2 text-gray-800">{selectedProduct.sales}</span>
                  </div>
                </div>
                
                {selectedProduct.description && (
                  <p className="text-gray-600 text-sm">{selectedProduct.description}</p>
                )}
                
                {/* 淘宝链接 */}
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500 mb-2">{t('taobaoLink')}:</p>
                  <a 
                    href={selectedProduct.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 text-sm break-all"
                  >
                    {selectedProduct.link}
                  </a>
                </div>
                
                {/* 添加到清单按钮 */}
                <button
                  onClick={() => {
                    addToList(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  disabled={addedProducts.has(selectedProduct.id)}
                  className={`w-full py-3 rounded-xl font-medium transition-colors ${
                    addedProducts.has(selectedProduct.id)
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {addedProducts.has(selectedProduct.id) ? t('added') : t('addToList')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
