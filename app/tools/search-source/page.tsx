'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, ShoppingCart, Loader2, Menu, ChevronDown, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';

// 支持的语言
const supportedLanguages = [
  { code: 'zh', name: '中文' },
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'العربية' },
  { code: 'ru', name: 'Русский' },
  { code: 'es', name: 'Español' }
];

// 多语言文本
const translations = {
  pageTitle: {
    zh: '商品搜索',
    en: 'Search Products',
    ru: 'Поиск товаров',
    ar: 'البحث عن المنتجات',
    es: 'Buscar Productos'
  },
  pageSubtitle: {
    zh: '在淘宝上寻找优质商品',
    en: 'Find quality products on Taobao',
    ru: 'Найдите качественные товары на Taobao',
    ar: 'ابحث عن منتجات عالية الجودة على Taobao',
    es: 'Encuentra productos de calidad en Taobao'
  },
  searchPlaceholder: {
    zh: '搜索商品...',
    en: 'Search for products...',
    ru: 'Поиск товаров...',
    ar: 'البحث عن المنتجات...',
    es: 'Buscar productos...'
  },
  searchButton: {
    zh: '搜索',
    en: 'Search',
    ru: 'Поиск',
    ar: 'بحث',
    es: 'Buscar'
  },
  searching: {
    zh: '搜索中...',
    en: 'Searching...',
    ru: 'Поиск...',
    ar: 'جاري البحث...',
    es: 'Buscando...'
  },
  noResults: {
    zh: '暂无结果',
    en: 'No results found',
    ru: 'Результатов не найдено',
    ar: 'لم يتم العثور على نتائج',
    es: 'No se encontraron resultados'
  },
  price: {
    zh: '价格',
    en: 'Price',
    ru: 'Цена',
    ar: 'السعر',
    es: 'Precio'
  },
  originalPrice: {
    zh: '原价',
    en: 'Original',
    ru: 'Оригинальная цена',
    ar: 'السعر الأصلي',
    es: 'Original'
  },
  save: {
    zh: '省',
    en: 'Save',
    ru: 'Экономия',
    ar: 'وفر',
    es: 'Ahorra'
  },
  sales: {
    zh: '销量',
    en: 'Sales',
    ru: 'Продажи',
    ar: 'المبيعات',
    es: 'Ventas'
  },
  shop: {
    zh: '店铺',
    en: 'Shop',
    ru: 'Магазин',
    ar: 'المتجر',
    es: 'Tienda'
  },
  addToList: {
    zh: '加入采购清单',
    en: 'Add to Sourcing List',
    ru: 'Добавить в список',
    ar: 'إضافة إلى القائمة',
    es: 'Añadir a la lista'
  },
  added: {
    zh: '已添加',
    en: 'Added',
    ru: 'Добавлено',
    ar: 'تمت الإضافة',
    es: 'Añadido'
  },
  viewOnTaobao: {
    zh: '去淘宝查看',
    en: 'View on Taobao',
    ru: 'Открыть на Taobao',
    ar: 'عرض على Taobao',
    es: 'Ver en Taobao'
  },
  home: {
    zh: '返回首页',
    en: 'Back to Home',
    ru: 'На главную',
    ar: 'العودة للرئيسية',
    es: 'Volver al inicio'
  },
  pleaseLogin: {
    zh: '请先登录',
    en: 'Please login first',
    ru: 'Пожалуйста, войдите',
    ar: 'يرجى تسجيل الدخول',
    es: 'Por favor inicie sesión'
  },
  login: {
    zh: '登录',
    en: 'Login',
    ru: 'Вход',
    ar: 'دخول',
    es: 'Iniciar sesión'
  },
  sourcingList: {
    zh: '查看采购清单',
    en: 'View Sourcing List',
    ru: 'Посмотреть список',
    ar: 'عرض قائمة التوريد',
    es: 'Ver lista de abastecimiento'
  }
};

// 检测浏览器语言
function detectLanguage(): string {
  if (typeof window === 'undefined') return 'en';
  const lang = navigator.language || navigator.languages[0] || 'en';
  const primaryLang = lang.split('-')[0];
  return supportedLanguages.find(l => l.code === primaryLang)?.code || 'en';
}

// 商品类型
interface Product {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  image: string;
  shop: string;
  sales: string;
  link: string;
  coupon?: string;
}

export default function SearchSourcePage() {
  const [lang, setLang] = useState('en');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  // 初始化
  useEffect(() => {
    setLang(detectLanguage());
    const mobile = window.innerWidth < 768;
    setIsMobile(mobile);
    setSidebarOpen(!mobile);

    // 获取 session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
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

  // 搜索商品
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError('');
    setProducts([]);

    try {
      // 调用后端API（大淘客搜索）
      const searchRes = await fetch('/api/search/dataoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, page: 1, pageSize: 20 }),
      });

      const searchData = await searchRes.json();

      if (!searchData.success) {
        throw new Error(searchData.error || 'Search failed');
      }

      // 对每个商品进行转链
      const productsWithPid = await Promise.all(
        searchData.products.map(async (product: Product) => {
          try {
            const linkRes = await fetch('/api/convert-link', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: product.link }),
            });
            const linkData = await linkRes.json();
            return {
              ...product,
              link: linkData.link || product.link,
            };
          } catch {
            return product;
          }
        })
      );

      setProducts(productsWithPid);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  // 添加到采购清单
  const addToSourcingList = async (product: Product) => {
    if (!session) return;

    try {
      const { error } = await supabase
        .from('sourcing_items')
        .insert({
          user_id: session.user.id,
          product_id: product.id,
          title: product.title,
          original_title: product.title,
          price: product.price.toString(),
          original_price: product.originalPrice?.toString(),
          image: product.image,
          shop: product.shop,
          sales: product.sales,
          link: product.link,
          description: '',
          query: searchQuery,
        });

      if (!error) {
        setAddedItems(prev => new Set(prev).add(product.id));
      }
    } catch (e) {
      console.error('Failed to add item:', e);
    }
  };

  // 获取翻译文本
  const t = (key: keyof typeof translations) => {
    return translations[key][lang as keyof typeof translations[typeof key]] || translations[key]['en'];
  };

  const currentLangName = supportedLanguages.find(l => l.code === lang)?.name || 'English';

  // 未登录状态
  if (!session) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isMobile={isMobile} />
        {sidebarOpen && isMobile && <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
            <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => setSidebarOpen(true)} className="p-1.5 -ml-1.5 hover:bg-gray-100 rounded-lg md:hidden">
                  <Menu size={20} className="text-gray-600" />
                </button>
                <div className="w-10 h-10 relative">
                  <Image src="/sourcepilot-icon.png" alt="SourcePilot" fill className="object-contain" />
                </div>
                <div>
                  <h1 className="font-bold text-gray-800">{t('pageTitle')}</h1>
                  <p className="text-xs text-gray-500">{t('pageSubtitle')}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Link href="/" className="text-sm text-[#4F6DF5] hover:underline flex items-center gap-1">
                  <ArrowLeft size={14} />
                  {t('home')}
                </Link>
              </div>
            </div>
          </header>

          {/* Login Prompt */}
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center max-w-md">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart size={32} className="text-[#4F6DF5]" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">{t('pleaseLogin')}</h2>
              <p className="text-gray-500 mb-6">{t('pageSubtitle')}</p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#4F6DF5] text-white rounded-xl font-medium hover:opacity-90"
              >
                {t('login')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isMobile={isMobile} />
      {sidebarOpen && isMobile && <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="p-1.5 -ml-1.5 hover:bg-gray-100 rounded-lg md:hidden">
                <Menu size={20} className="text-gray-600" />
              </button>
              <div className="w-10 h-10 relative">
                <Image src="/sourcepilot-icon.png" alt="SourcePilot" fill className="object-contain" />
              </div>
              <div>
                <h1 className="font-bold text-gray-800">{t('pageTitle')}</h1>
                <p className="text-xs text-gray-500">{t('pageSubtitle')}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Language Switcher */}
              <div className="relative">
                <button
                  onClick={() => setShowLangDropdown(!showLangDropdown)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  {currentLangName}
                  <ChevronDown size={14} />
                </button>
                {showLangDropdown && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px] z-50">
                    {supportedLanguages.map(l => (
                      <button
                        key={l.code}
                        onClick={() => { setLang(l.code); setShowLangDropdown(false); }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${lang === l.code ? 'text-[#4F6DF5] font-medium' : 'text-gray-700'}`}
                      >
                        {l.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Link href="/tools/sourcing-list" className="text-sm text-[#4F6DF5] hover:underline">
                {t('sourcingList')}
              </Link>

              <Link href="/" className="text-sm text-[#4F6DF5] hover:underline flex items-center gap-1">
                <ArrowLeft size={14} />
                {t('home')}
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Search Box */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
              <form onSubmit={handleSearch} className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('searchPlaceholder')}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F6DF5] focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !searchQuery.trim()}
                  className="px-6 py-3 bg-[#4F6DF5] text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" />{t('searching')}</> : <>{t('searchButton')}</>}
                </button>
              </form>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* Products Grid */}
            {products.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                    {/* Image */}
                    <div className="aspect-square bg-gray-100 relative">
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
                          <ShoppingCart size={48} />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-medium text-gray-800 mb-2 line-clamp-2 text-sm">{product.title}</h3>

                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-lg font-bold text-red-600">¥{product.price}</span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <>
                            <span className="text-sm text-gray-400 line-through">¥{product.originalPrice}</span>
                            <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                              {t('save')} ¥{(product.originalPrice - product.price).toFixed(0)}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <span>{product.shop}</span>
                        <span>{product.sales} {t('sales')}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <a
                          href={product.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 text-center"
                        >
                          {t('viewOnTaobao')}
                        </a>
                        <button
                          onClick={() => addToSourcingList(product)}
                          disabled={addedItems.has(product.id)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium ${
                            addedItems.has(product.id)
                              ? 'bg-green-100 text-green-700'
                              : 'bg-[#4F6DF5] text-white hover:opacity-90'
                          }`}
                        >
                          {addedItems.has(product.id) ? t('added') : t('addToList')}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && products.length === 0 && searchQuery && (
              <div className="text-center py-12">
                <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">{t('noResults')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
