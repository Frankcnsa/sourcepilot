'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';

interface Product {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  image: string;
  shop: string;
  sales: string;
  link: string;
  couponInfo?: string;
  monthSales?: number;
}

interface Category {
  cid: number;
  cname: string;
  cpic: string;
  subcategories?: { subcid: number; subcname: string; scpic: string }[];
}

export default function SearchSourceContent() {
  const router = useRouter();
  const { lang, setLang } = useLanguage();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [cartCount, setCartCount] = useState(0);
  
  // 分类
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [showSubMenu, setShowSubMenu] = useState(false);
  
  // 5大栏目数据
  const [realTime, setRealTime] = useState<Product[]>([]);
  const [realTimeLoading, setRealTimeLoading] = useState(true);
  const [nineNine, setNineNine] = useState<Product[]>([]);
  const [nineNineLoading, setNineNineLoading] = useState(true);
  const [highCommission, setHighCommission] = useState<Product[]>([]);
  const [highCommissionLoading, setHighCommissionLoading] = useState(true);
  const [dailyHot, setDailyHot] = useState<Product[]>([]);
  const [dailyHotLoading, setDailyHotLoading] = useState(true);
  const [guessLike, setGuessLike] = useState<Product[]>([]);
  const [guessLikeLoading, setGuessLikeLoading] = useState(true);
  
  // 剪贴板
  const [pasteContent, setPasteContent] = useState('');
  const [pasteResult, setPasteResult] = useState<any>(null);
  const [pasteLoading, setPasteLoading] = useState(false);

  // 语言文本
  const text = {
    zh: {
      searchPlaceholder: '搜索宝贝...',
      realTime: '实时热销榜',
      nineNine: '9.9包邮',
      highCommission: '高佣精选',
      dailyHot: '每日爆品',
      guessLike: '猜你喜欢',
      search: '搜索',
      loading: '加载中...',
      noData: '暂无数据',
      addToCart: '加入清单',
      sales: '人付款',
      originalPrice: '原价',
      save: '省',
      viewMore: '查看更多',
      pasteHint: '粘贴淘口令或链接试试',
      pasteButton: '识别',
      cart: '清单'
    },
    en: {
      searchPlaceholder: 'Search products...',
      realTime: 'Hot Sales',
      nineNine: '9.9 Shipping',
      highCommission: 'High Commission',
      dailyHot: 'Daily Hot',
      guessLike: 'Guess You Like',
      search: 'Search',
      loading: 'Loading...',
      noData: 'No data',
      addToCart: 'Add to List',
      sales: 'sold',
      originalPrice: 'Original',
      save: 'Save',
      viewMore: 'View More',
      pasteHint: 'Paste Taobao code or link',
      pasteButton: 'Parse',
      cart: 'Cart'
    },
    ru: {
      searchPlaceholder: 'Поиск...',
      realTime: 'Горячие продажи',
      nineNine: 'Доставка 9.9',
      highCommission: 'Высокая комиссия',
      dailyHot: 'Ежедневный хит',
      guessLike: 'Вам может понравиться',
      search: 'Поиск',
      loading: 'Загрузка...',
      noData: 'Нет данных',
      addToCart: 'Добавить в список',
      sales: 'продано',
      originalPrice: 'Оригинальная цена',
      save: 'Экономия',
      viewMore: 'Посмотреть ещё',
      pasteHint: 'Вставьте код или ссылку',
      pasteButton: 'Распознать',
      cart: 'Корзина'
    },
    es: {
      searchPlaceholder: 'Buscar...',
      realTime: 'Más Vendidos',
      nineNine: 'Envío 9.9',
      highCommission: 'Alta Comisión',
      dailyHot: 'Popular Hoy',
      guessLike: 'Quizás te guste',
      search: 'Buscar',
      loading: 'Cargando...',
      noData: 'Sin datos',
      addToCart: 'Añadir a la lista',
      sales: 'vendidos',
      originalPrice: 'Precio original',
      save: 'Ahorra',
      viewMore: 'Ver más',
      pasteHint: 'Pega código o enlace',
      pasteButton: 'Analizar',
      cart: 'Carrito'
    },
    ar: {
      searchPlaceholder: 'بحث...',
      realTime: 'الأكثر مبيعاً',
      nineNine: 'شحن 9.9',
      highCommission: 'عمولة عالية',
      dailyHot: 'الأكثر شعبية',
      guessLike: 'قد يعجبك',
      search: 'بحث',
      loading: 'جاري التحميل...',
      noData: 'لا توجد بيانات',
      addToCart: 'أضف إلى القائمة',
      sales: 'مباع',
      originalPrice: 'السعر الأصلي',
      save: 'وفر',
      viewMore: 'عرض المزيد',
      pasteHint: 'الصق الكود أو الرابط',
      pasteButton: 'تحليل',
      cart: 'السلة'
    }
  }[lang] || {
    searchPlaceholder: 'Search...',
    realTime: 'Hot Sales',
    nineNine: '9.9 Shipping',
    highCommission: 'High Commission',
    dailyHot: 'Daily Hot',
    guessLike: 'Guess You Like',
    search: 'Search',
    loading: 'Loading...',
    noData: 'No data',
    addToCart: 'Add to Cart',
    sales: 'sold',
    originalPrice: 'Original',
    save: 'Save',
    viewMore: 'View More',
    pasteHint: 'Paste code or link',
    pasteButton: 'Parse',
    cart: 'Cart'
  };

  // 加载购物车数量
  useEffect(() => {
    fetch('/api/sourcing-items')
      .then(r => r.json())
      .then(data => setCartCount(data.items?.length || 0))
      .catch(() => {});
  }, []);

  // 加载分类
  useEffect(() => {
    fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'super-categories' })
    })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data?.categoryRespVOS) {
          setCategories(data.data.categoryRespVOS);
        }
      })
      .catch(() => {});
  }, []);

  // 统一处理API返回的商品数据
  const processProducts = (data: any): Product[] => {
    if (!data) return [];
    // data 本身就是数组
    if (Array.isArray(data)) return data;
    // { list: [...] }
    if (data.list && Array.isArray(data.list)) return data.list;
    // { data: [...] } (real-time 返回的结构)
    if (data.data && Array.isArray(data.data)) return data.data;
    // { data: { data: [...] } } (real-time 嵌套结构)
    if (data.data?.data && Array.isArray(data.data.data)) return data.data.data;
    // { resultList: [...] }
    if (data.resultList && Array.isArray(data.resultList)) return data.resultList;
    return [];
  };

  // 加载5大栏目
  useEffect(() => {
    loadAllSections();
  }, [lang]);

  const loadAllSections = () => {
    setRealTimeLoading(true);
    setNineNineLoading(true);
    setHighCommissionLoading(true);
    setDailyHotLoading(true);
    setGuessLikeLoading(true);

    // 实时热销榜 - 返回 { data: { data: [...] } }
    fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'real-time', pageSize: 10, page: 1 })
    })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          const items = data.data.data || data.data.list || data.data || [];
          console.log('real-time items:', items.length, items[0]?.title);
          setRealTime(items.slice(0, 10));
        }
        setRealTimeLoading(false);
      })
      .catch(() => setRealTimeLoading(false));

    // 9.9包邮 - 返回数组或 { list: [...] }
    fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'nine-nine', pageSize: 10, page: 1 })
    })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          const items = Array.isArray(data.data) ? data.data : (data.data.list || data.data.data || []);
          console.log('nine-nine items:', items.length);
          setNineNine(items.slice(0, 10));
        }
        setNineNineLoading(false);
      })
      .catch(() => setNineNineLoading(false));

    // 高佣精选 - 返回 { list: [...] }
    fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'hot-products', pageSize: 10, page: 1 })
    })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          const items = data.data.list || data.data.data || data.data || [];
          console.log('hot-products items:', items.length);
          setHighCommission(items.slice(0, 10));
        }
        setHighCommissionLoading(false);
      })
      .catch(() => setHighCommissionLoading(false));

    // 每日爆品
    fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'daily-hot', pageSize: 10, page: 1 })
    })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          const items = data.data.list || data.data.data || data.data || [];
          console.log('daily-hot items:', items.length);
          setDailyHot(items.slice(0, 10));
        }
        setDailyHotLoading(false);
      })
      .catch(() => setDailyHotLoading(false));

    // 猜你喜欢
    fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'guess-you-like', size: 10, page: 1 })
    })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          const items = data.data.list || data.data.data || data.data || [];
          console.log('guess-you-like items:', items.length);
          setGuessLike(items.slice(0, 10));
        }
        setGuessLikeLoading(false);
      })
      .catch(() => setGuessLikeLoading(false));
  };

  // 搜索
  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'search', query: q, pageSize: 20, page: 1, lang })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setProducts(processProducts(data.data));
      }
    } catch (e) {
      console.error('Search failed:', e);
    } finally {
      setLoading(false);
    }
  };

  // 剪贴板识别
  const handlePaste = async () => {
    if (!pasteContent.trim()) return;
    setPasteLoading(true);
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'parse-content', content: pasteContent, lang })
      });
      const data = await res.json();
      setPasteResult(data);
    } catch (e) {
      console.error('Parse failed:', e);
    } finally {
      setPasteLoading(false);
    }
  };

  // 加入购物车（清单）
  const addToCart = async (product: Product) => {
    try {
      const res = await fetch('/api/sourcing-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          title: product.title,
          image_url: product.image,
          price: String(product.price),
          shop_name: product.shop,
          product_url: product.link
        })
      });
      if (res.ok) {
        setCartCount(prev => prev + 1);
      }
    } catch (e) {
      console.error('Add to cart failed:', e);
    }
  };

  // 渲染商品卡片（网格用）
  const renderProductCard = (product: Product) => (
    <div key={product.id} className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
      <div className="aspect-square relative">
        <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
        {product.couponInfo && (
          <div className="absolute top-1 left-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded">
            {product.couponInfo}
          </div>
        )}
      </div>
      <div className="p-2.5 space-y-1.5">
        <h3 className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug">
          {product.title}
        </h3>
        <div className="flex items-center gap-1.5">
          <span className="text-orange-600 font-bold text-base">¥{product.price}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-xs text-gray-400 line-through">¥{product.originalPrice}</span>
          )}
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{product.shop}</span>
          <span>{product.sales} {text.sales}</span>
        </div>
        <button
          onClick={() => addToCart(product)}
          className="w-full py-1.5 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors"
        >
          {text.addToCart}
        </button>
      </div>
    </div>
  );

  // 渲染横滑卡片（实时热销榜、9.9包邮用）
  const renderHorizontalCards = (products: Product[], loading: boolean) => (
    <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
      {loading ? (
        [1,2,3,4].map(i => (
          <div key={i} className="flex-shrink-0 w-36">
            <div className="aspect-square bg-gray-200 rounded-xl animate-pulse" />
            <div className="mt-1.5 space-y-1">
              <div className="h-3 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        ))
      ) : products.length > 0 ? (
        products.map(product => (
          <div key={product.id} className="flex-shrink-0 w-36">
            <div className="aspect-square rounded-xl overflow-hidden border border-gray-100">
              <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
            </div>
            <div className="mt-1.5">
              <p className="text-xs font-medium text-gray-800 truncate">{product.title}</p>
              <p className="text-sm font-bold text-orange-600">¥{product.price}</p>
            </div>
          </div>
        ))
      ) : (
        <div className="text-sm text-gray-400 py-4">{text.noData}</div>
      )}
    </div>
  );

  // 渲染栏目区块
  const renderSection = (title: string, products: Product[], loading: boolean, isHorizontal = false) => (
    <div className="mb-6">
      <h2 className="text-lg font-bold text-gray-800 mb-3">{title}</h2>
      {isHorizontal ? renderHorizontalCards(products, loading) : (
        <div className="grid grid-cols-2 gap-2.5">
          {loading ? (
            [1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-100">
                <div className="aspect-square bg-gray-200 animate-pulse" />
                <div className="p-2.5 space-y-1.5">
                  <div className="h-3 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))
          ) : products.length > 0 ? (
            products.map(product => renderProductCard(product))
          ) : (
            <div className="text-sm text-gray-400 py-4">{text.noData}</div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-3 py-2.5 flex items-center gap-2">
          {/* 返回 + Logo */}
          <button onClick={() => router.push('/')} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <Search className="w-5 h-5 text-gray-700" />
          </button>
          <span className="font-bold text-orange-500 text-lg">SourcePilot</span>

          {/* 搜索框 */}
          <div className="flex-1 mx-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={text.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* 搜索按钮（替换语言切换） */}
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
              <span className="text-xs whitespace-nowrap">{cat.cname}</span>
            </button>
          ))}
        </div>

        {/* 二级分类浮层 */}
        {showSubMenu && activeCategory && categories.find(c => c.cid === activeCategory)?.subcategories && (
          <div className="max-w-6xl mx-auto px-3 pb-3">
            <div className="flex gap-2 flex-wrap">
              {categories.find(c => c.cid === activeCategory)!.subcategories!.map(sub => (
                <button
                  key={sub.subcid}
                  onClick={() => {
                    handleSearch(sub.subcname);
                    setShowSubMenu(false);
                  }}
                  className="px-3 py-1 bg-gray-100 rounded-full text-sm hover:bg-orange-50 hover:text-orange-600 transition-colors"
                >
                  {sub.subcname}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-3 py-4">
        {/* 剪贴板识别 */}
        <div className="mb-6 bg-orange-50 rounded-xl p-4">
          <p className="text-sm text-gray-600 mb-2">{text.pasteHint}</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              placeholder="淘口令或链接..."
              className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              onClick={handlePaste}
              disabled={pasteLoading}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              {pasteLoading ? text.loading : text.pasteButton}
            </button>
          </div>
          {pasteResult && (
            <div className="mt-3 p-3 bg-white rounded-lg text-sm">
              {pasteResult.success ? (
                <div>
                  <p className="font-medium text-gray-800">{pasteResult.data?.itemName || '识别成功'}</p>
                  <p className="text-gray-500 mt-1">价格: ¥{pasteResult.data?.actualPrice || 'N/A'}</p>
                </div>
              ) : (
                <p className="text-red-500">识别失败: {pasteResult.raw?.msg || 'Unknown error'}</p>
              )}
            </div>
          )}
        </div>

        {/* 搜索结果 */}
        {products.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-3">搜索结果</h2>
            <div className="grid grid-cols-2 gap-2.5">
              {products.map(product => renderProductCard(product))}
            </div>
          </div>
        )}

        {/* 5大栏目 */}
        {renderSection(text.realTime, realTime, realTimeLoading, true)}
        {renderSection(text.nineNine, nineNine, nineNineLoading, true)}
        {renderSection(text.highCommission, highCommission, highCommissionLoading, false)}
        {renderSection(text.dailyHot, dailyHot, dailyHotLoading, false)}
        {renderSection(text.guessLike, guessLike, guessLikeLoading, false)}

        {/* 加载指示器 */}
        {loading && (
          <div className="text-center py-8 text-sm text-gray-400">{text.loading}</div>
        )}
      </div>
    </div>
  );
}
