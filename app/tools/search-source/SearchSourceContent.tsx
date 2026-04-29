'use client';

import { useState, useEffect } from 'react';
import { Search, ShoppingCart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';

interface Product {
  id: string;
  goodsId: string;
  dtitle: string;
  actualPrice: number;
  pic: string;
  shop: string;
  sales: string;
  yuanjia?: number;
  marketPrice?: number;
  couponInfo?: string;
  link?: string;
  sellerId?: string;
  salesNum?: number;
  renqi?: number;
}

export default function SearchSourceContent() {
  const router = useRouter();
  const { lang, setLang } = useLanguage();
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [realTime, setRealTime] = useState<Product[]>([]);
  const [nineNine, setNineNine] = useState<Product[]>([]);
  const [highCommission, setHighCommission] = useState<Product[]>([]);
  const [dailyHot, setDailyHot] = useState<Product[]>([]);
  const [guessLike, setGuessLike] = useState<Product[]>([]);
  const [realTimeLoading, setRealTimeLoading] = useState(true);
  const [nineNineLoading, setNineNineLoading] = useState(true);
  const [highCommissionLoading, setHighCommissionLoading] = useState(true);
  const [dailyHotLoading, setDailyHotLoading] = useState(true);
  const [guessLikeLoading, setGuessLikeLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [pasteContent, setPasteContent] = useState('');
  const [pasteLoading, setPasteLoading] = useState(false);
  const [pasteResult, setPasteResult] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState<number|null>(null);
  const [showSubMenu, setShowSubMenu] = useState(false);

  // 文本（多语言）
  const text: any = {
    zh: { searchPlaceholder: '搜索产品...', realTime: '实时热销榜', nineNine: '9.9包邮', highCommission: '高佣精选', dailyHot: '每日爆品', guessLike: '猜你喜欢', search: '搜索', loading: '加载中...', noData: '暂无数据', addToCart: '加入清单', sales: '已售', originalPrice: '原价', save: '节省', viewMore: '查看更多', pasteHint: '粘贴淘口令或链接', pasteButton: '识别', cart: '清单' },
    en: { searchPlaceholder: 'Search products...', realTime: 'Hot Sales', nineNine: '9.9 Shipping', highCommission: 'High Commission', dailyHot: 'Daily Hot', guessLike: 'Guess You Like', search: 'Search', loading: 'Loading...', noData: 'No data', addToCart: 'Add to List', sales: 'sold', originalPrice: 'Original', save: 'Save', viewMore: 'View More', pasteHint: 'Paste Taobao code or link', pasteButton: 'Parse', cart: 'Cart' },
    ru: { searchPlaceholder: 'Поиск...', realTime: 'Горячие продажи', nineNine: 'Доставка 9.9', highCommission: 'Высокая комиссия', dailyHot: 'Ежедневный хит', guessLike: 'Вам может понравиться', search: 'Поиск', loading: 'Загрузка...', noData: 'Нет данных', addToCart: 'Добавить в список', sales: 'продано', originalPrice: 'Оригинальная цена', save: 'Экономия', viewMore: 'Посмотреть ещё', pasteHint: 'Вставьте код или ссылку', pasteButton: 'Распознать', cart: 'Корзина' },
    es: { searchPlaceholder: 'Buscar...', realTime: 'Más Vendidos', nineNine: 'Envío 9.9', highCommission: 'Alta Comisión', dailyHot: 'Popular Hoy', guessLike: 'Quizás te guste', search: 'Buscar', loading: 'Cargando...', noData: 'Sin datos', addToCart: 'Añadir a la lista', sales: 'vendidos', originalPrice: 'Precio original', save: 'Ahorra', viewMore: 'Ver más', pasteHint: 'Pega código o enlace', pasteButton: 'Analizar', cart: 'Carrito' },
    ar: { searchPlaceholder: 'بحث...', realTime: 'الأكثر مبيعاً', nineNine: 'شحن 9.9', highCommission: 'عمولة عالية', dailyHot: 'الأكثر شعبية', guessLike: 'قد يعجبك', search: 'بحث', loading: 'جاري التحميل...', noData: 'لا توجد بيانات', addToCart: 'أضف إلى القائمة', sales: 'مباع', originalPrice: 'السعر الأصلي', save: 'وفر', viewMore: 'عرض المزيد', pasteHint: 'الصق الكود أو الرابط', pasteButton: 'تحليل', cart: 'السلة' }
  }[lang] || {
    searchPlaceholder: 'Search...', realTime: 'Hot Sales', nineNine: '9.9 Shipping', highCommission: 'High Commission', dailyHot: 'Daily Hot', guessLike: 'Guess You Like', search: 'Search', loading: 'Loading...', noData: 'No data', addToCart: 'Add to List', sales: 'sold', originalPrice: 'Original', save: 'Save', viewMore: 'View More', pasteHint: 'Paste Taobao code or link', pasteButton: 'Parse', cart: 'Cart'
  };

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

  // 加载栏目数据
  useEffect(() => {
    // 实时热销榜
    setRealTimeLoading(true);
    fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'real-time', pageSize: 10, page: 1 })
    })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          const items = data.data.data || data.data.list || data.data || [];
          setRealTime(items.slice(0, 10));
        }
        setRealTimeLoading(false);
      })
      .catch(() => setRealTimeLoading(false));

    // 9.9包邮
    setNineNineLoading(true);
    fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'nine-nine', pageSize: 10, page: 1 })
    })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          const items = Array.isArray(data.data) ? data.data : (data.data.list || data.data.data || []);
          setNineNine(items.slice(0, 10));
        }
        setNineNineLoading(false);
      })
      .catch(() => setNineNineLoading(false));

    // 高佣精选
    setHighCommissionLoading(true);
    fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'hot-products', pageSize: 10, page: 1 })
    })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          const items = data.data.list || data.data.data || data.data || [];
          setHighCommission(items.slice(0, 10));
        }
        setHighCommissionLoading(false);
      })
      .catch(() => setHighCommissionLoading(false));

    // 每日爆品
    setDailyHotLoading(true);
    fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'daily-hot', pageSize: 10, page: 1 })
    })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          const items = data.data.list || data.data.data || data.data || [];
          setDailyHot(items.slice(0, 10));
        }
        setDailyHotLoading(false);
      })
      .catch(() => setDailyHotLoading(false));

    // 猜你喜欢
    setGuessLikeLoading(true);
    fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'guess-you-like', size: 10, page: 1 })
    })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          const items = data.data.list || data.data.data || data.data || [];
          setGuessLike(items.slice(0, 10));
        }
        setGuessLikeLoading(false);
      })
      .catch(() => setGuessLikeLoading(false));
  }, [lang]);

  // 搜索
  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'search', query: q, pageSize: 20, page: 1 })
      });
      const data = await res.json();
      if (data.success && data.data) {
        const items = data.data.list || data.data.data || data.data || [];
        setProducts(items.slice(0, 20));
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
        body: JSON.stringify({ action: 'parse-content', content: pasteContent })
      });
      const data = await res.json();
      setPasteResult(data);
    } catch (e) {
      console.error('Parse failed:', e);
    } finally {
      setPasteLoading(false);
    }
  };

  // 加入购物车
  const addToCart = async (product: Product) => {
    try {
      const res = await fetch('/api/sourcing-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.goodsId || product.id,
          title: product.dtitle,
          image_url: product.pic,
          price: String(product.actualPrice || product.yuanjia || 0),
          shop_name: product.shop,
          product_url: product.link || ''
        })
      });
      if (res.ok) {
        setCartCount(prev => prev + 1);
      }
    } catch (e) {
      console.error('Add to cart failed:', e);
    }
  };

  // 渲染商品卡片（使用正确的字段名）
  const renderProductCard = (product: Product) => (
    <div key={product.goodsId || product.id} className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
      <div className="aspect-square relative">
        <img src={product.pic} alt={product.dtitle} className="w-full h-full object-cover" />
        {product.couponInfo && (
          <div className="absolute top-1 left-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded">
            {product.couponInfo}
          </div>
        )}
      </div>
      <div className="p-2.5 space-y-1.5">
        <h3 className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug">
          {product.dtitle}
        </h3>
        <div className="flex items-center gap-1.5">
          <span className="text-orange-600 font-bold text-base">¥{product.actualPrice || product.yuanjia || 'N/A'}</span>
          {product.marketPrice && product.marketPrice > (product.actualPrice || 0) && (
            <span className="text-xs text-gray-400 line-through">¥{product.marketPrice}</span>
          )}
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{product.shop || product.sellerId || ''}</span>
          <span>{(product.salesNum || product.renqi || 0).toLocaleString()} {text.sales}</span>
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

  // 渲染栏目区块
  const renderSection = (title: string, items: Product[], isLoading: boolean) => (
    <div className="mb-6">
      <h2 className="text-lg font-bold text-gray-800 mb-3">{title}</h2>
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
      ) : items.length > 0 ? (
        <div className="grid grid-cols-2 gap-2.5">
          {items.map(product => renderProductCard(product))}
        </div>
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
          {/* Logo */}
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
                <span className="text-xs whitespace-nowrap">{cat.cname}</span>
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
      )}

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
        {renderSection(text.realTime, realTime, realTimeLoading)}
        {renderSection(text.nineNine, nineNine, nineNineLoading)}
        {renderSection(text.highCommission, highCommission, highCommissionLoading)}
        {renderSection(text.dailyHot, dailyHot, dailyHotLoading)}
        {renderSection(text.guessLike, guessLike, guessLikeLoading)}

        {/* 加载指示器 */}
        {loading && (
          <div className="text-center py-8 text-sm text-gray-400">{text.loading}</div>
        )}
      </div>
    </div>
  );
}
