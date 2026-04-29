'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, ShoppingCart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { translateBatch } from '@/lib/aliyun-translate';
import { useLanguage } from '@/context/LanguageContext';

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

interface Category {
  cid: number;
  cname: string;
  cpic: string;
  subcategories?: { subcid: number; subcname: string; scpic: string }[];
}

export default function SearchSourcePage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // 超级分类
  const [categories, setCategories] = useState<Category[]>([]);
  const [catLoading, setCatLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  
  // 猜你喜欢
  const [guessProducts, setGuessProducts] = useState<Product[]>([]);
  const [guessLoading, setGuessLoading] = useState(true);
  const [guessPage, setGuessPage] = useState(1);
  const [hasMoreGuess, setHasMoreGuess] = useState(true);
  const [loadingMoreGuess, setLoadingMoreGuess] = useState(false);

  // 4大栏目状态
  const [hotSales, setHotSales] = useState<Product[]>([]);
  const [hotSalesLoading, setHotSalesLoading] = useState(true);
  const [highCommission, setHighCommission] = useState<Product[]>([]);
  const [highCommissionLoading, setHighCommissionLoading] = useState(true);
  const [nineNine, setNineNine] = useState<Product[]>([]);
  const [nineNineLoading, setNineNineLoading] = useState(true);
  const [dailyHot, setDailyHot] = useState<Product[]>([]);
  const [dailyHotLoading, setDailyHotLoading] = useState(true);

  const { lang } = useLanguage();

  // 翻译文本
  const t = {
    en: {
      searchPlaceholder: 'Search products...',
      guessYouLike: 'Guess You Like',
      hotSales: 'Hot Sales',
      highCommission: 'High Commission',
      nineNine: '9.9 Shipping',
      dailyHot: 'Daily Hot',
      viewMore: 'View More',
      noData: 'No data',
      search: 'Search',
      sales: 'sold',
      addToCart: 'Add to List',
      originalPrice: 'Original',
      save: 'Save',
      loadMore: 'Load More',
      noMore: 'No more products',
      loading: 'Loading...'
    },
    zh: {
      searchPlaceholder: '搜索宝贝...',
      guessYouLike: '猜你喜欢',
      hotSales: '实时热销榜',
      highCommission: '高佣精选',
      nineNine: '9.9包邮',
      dailyHot: '每日爆品',
      viewMore: '查看更多',
      noData: '暂无数据',
      search: '搜索',
      sales: '人付款',
      addToCart: '加入清单',
      originalPrice: '原价',
      save: '省',
      loadMore: '加载更多',
      noMore: '没有更多了',
      loading: '加载中...'
    },
    ar: {
      searchPlaceholder: 'بحث...',
      guessYouLike: 'قد يعجبك',
      hotSales: 'الأكثر مبيعاً',
      highCommission: 'عمولة عالية',
      nineNine: 'شحن 9.9',
      dailyHot: 'الأكثر شعبية',
      viewMore: 'عرض المزيد',
      noData: 'لا توجد بيانات',
      search: 'بحث',
      sales: 'مباع',
      addToCart: 'أضف إلى القائمة',
      originalPrice: 'السعر الأصلي',
      save: 'وفر',
      loadMore: 'تحميل المزيد',
      noMore: 'لا يوجد المزيد',
      loading: 'جاري التحميل...'
    },
    ru: {
      searchPlaceholder: 'Поиск...',
      guessYouLike: 'Вам может понравиться',
      hotSales: 'Горячие продажи',
      highCommission: 'Высокая комиссия',
      nineNine: 'Доставка 9.9',
      dailyHot: 'Ежедневный хит',
      viewMore: 'Посмотреть ещё',
      noData: 'Нет данных',
      search: 'Поиск',
      sales: 'продано',
      addToCart: 'Добавить в список',
      originalPrice: 'Оригинальная цена',
      save: 'Экономия',
      loadMore: 'Загрузить ещё',
      noMore: 'Больше нет',
      loading: 'Загрузка...'
    },
    es: {
      searchPlaceholder: 'Buscar...',
      guessYouLike: 'Quizás te guste',
      hotSales: 'Más Vendidos',
      highCommission: 'Alta Comisión',
      nineNine: 'Envío 9.9',
      dailyHot: 'Popular Hoy',
      viewMore: 'Ver más',
      noData: 'Sin datos',
      search: 'Buscar',
      sales: 'vendidos',
      addToCart: 'Añadir a la lista',
      originalPrice: 'Precio original',
      save: 'Ahorra',
      loadMore: 'Cargar más',
      noMore: 'No hay más',
      loading: 'Cargando...'
    }
  };

  const text = t[lang as keyof typeof t] || t.en;

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

  // 加载超级分类
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success && data.categories) {
        setCategories(data.categories);
      }
    } catch (e) {
      console.error('Failed to load categories:', e);
    } finally {
      setCatLoading(false);
    }
  };

  // 翻译产品列表
  const translateProducts = async (products: Product[], targetLang: string): Promise<Product[]> => {
    if (targetLang === 'zh') return products;
    
    try {
      const titles = products.map(p => p.title || '');
      const shops = products.map(p => p.shop || '');
      const [translatedTitles, translatedShops] = await Promise.all([
        translateBatch(titles, 'zh', targetLang),
        translateBatch(shops, 'zh', targetLang)
      ]);
      
      return products.map((p, i) => ({
        ...p,
        title: translatedTitles[i] || p.title,
        shop: translatedShops[i] || p.shop
      }));
    } catch (err) {
      console.warn('Translation failed, using original:', err);
      return products;
    }
  };

  // 实时热销榜
  const fetchHotSales = async () => {
    setHotSalesLoading(true);
    try {
      const res = await fetch(`/api/hot-sales?page=1&pageSize=20&lang=${lang}`);
      const data = await res.json();
      if (data.success && data.products) {
        setHotSales(data.products);
      }
    } catch (e) {
      console.error('Failed to load hot sales:', e);
    } finally {
      setHotSalesLoading(false);
    }
  };

  // 高佣精选
  const fetchHighCommission = async () => {
    setHighCommissionLoading(true);
    try {
      const res = await fetch(`/api/high-commission?page=1&pageSize=20&lang=${lang}`);
      const data = await res.json();
      if (data.success && data.products) {
        setHighCommission(data.products);
      }
    } catch (e) {
      console.error('Failed to load high commission:', e);
    } finally {
      setHighCommissionLoading(false);
    }
  };

  // 9.9包邮
  const fetchNineNine = async () => {
    setNineNineLoading(true);
    try {
      const res = await fetch(`/api/nine-nine?page=1&pageSize=20&lang=${lang}`);
      const data = await res.json();
      if (data.success && data.products) {
        setNineNine(data.products);
      }
    } catch (e) {
      console.error('Failed to load 9.9 shipping:', e);
    } finally {
      setNineNineLoading(false);
    }
  };

  // 每日爆品
  const fetchDailyHot = async () => {
    setDailyHotLoading(true);
    try {
      const res = await fetch(`/api/daily-hot?page=1&pageSize=20&lang=${lang}`);
      const data = await res.json();
      if (data.success && data.products) {
        setDailyHot(data.products);
      }
    } catch (e) {
      console.error('Failed to load daily hot:', e);
    } finally {
      setDailyHotLoading(false);
    }
  };

  // 加载猜你喜欢 - 修复分页问题
  useEffect(() => {
    setGuessProducts([]); // 切换语言时清空旧数据
    setGuessPage(1);
    setHasMoreGuess(true);
    fetchGuessYouLike(1);
  }, [lang]);

  const fetchGuessYouLike = async (pageNum = 1) => {
    if (pageNum === 1) {
      setGuessLoading(true);
    } else {
      setLoadingMoreGuess(true);
    }
    
    try {
      const res = await fetch(`/api/guess-you-like?lang=${lang}&page=${pageNum}&limit=20`);
      const data = await res.json();
      if (data.success) {
        let newProducts = data.products || [];
        // 用阿里翻译机翻译商品标题和店铺名
        if (lang !== 'zh') {
          newProducts = await translateProducts(newProducts, lang);
        }
        if (pageNum === 1) {
          // 第一页：直接设置（已清空）
          setGuessProducts(newProducts);
        } else {
          // 追加模式：去重后追加
          setGuessProducts(prev => {
            const uniqueNew = newProducts.filter((p: Product) => !prev.some((existing: Product) => existing.id === p.id));
            console.log(`[GuessYouLike] Page ${pageNum}: ${newProducts.length} new, ${uniqueNew.length} unique after dedup`);
            return [...prev, ...uniqueNew];
          });
        }
        // 如果返回少于20条，说明没有更多数据了
        setHasMoreGuess(newProducts.length === 20);
        setGuessPage(pageNum);
      }
    } catch (e) {
      console.error('Failed to load guess you like:', e);
    } finally {
      setGuessLoading(false);
      setLoadingMoreGuess(false);
    }
  };

  // 加载4大栏目
  useEffect(() => {
    fetchHotSales();
    fetchHighCommission();
    fetchNineNine();
    fetchDailyHot();
  }, [lang]);

  // 搜索商品
  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;

    setLoading(true);
    setProducts([]);
    
    try {
      const response = await fetch('/api/search/dataoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          page: 1,
          pageSize: 20,
          targetLang: lang
        })
      });

      const data = await response.json();
      if (data.success) {
        let newProducts = data.products || [];
        // 用阿里翻译机翻译商品标题和店铺名
        if (lang !== 'zh') {
          newProducts = await translateProducts(newProducts, lang);
        }
        setProducts(newProducts);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // 分类搜索
  const handleCategorySearch = (catName: string) => {
    setQuery(catName);
    handleSearch(catName);
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
      } else if (response.status === 409) {
        // Already exists
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

  // 渲染商品网格
  const renderProductGrid = (products: Product[]) => (
    <div className="grid grid-cols-2 gap-2.5">
      {products.map(product => {
        const savings = getSavings(product);
        return (
          <div 
            key={product.id} 
            className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow active:scale-[0.98] cursor-pointer"
            onClick={() => router.push(`/product/${product.id}`)}
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
  );

  // 渲染栏目
  const renderSection = (
    title: string,
    products: Product[],
    loading: boolean,
    viewMoreLink?: string
  ) => (
    <div className="mb-6">
      {/* Content */}
      {loading ? (
        /* 骨架屏 */
        <div className="grid grid-cols-2 gap-2.5">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-100">
              <div className="aspect-[4/5] bg-gray-200 animate-pulse" />
              <div className="p-2 space-y-2">
                <div className="h-3 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
                <div className="flex gap-1">
                  <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
                  <div className="h-5 w-12 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : products.length > 0 ? (
        renderProductGrid(products)
      ) : (
        <div className="text-center py-8 text-sm text-gray-400">
          {text.noData}
        </div>
      )}
    </div>
  );

  // 翻译分类名称
  const translateCatName = (name: string) => {
    const map: Record<string, Record<string, string>> = {
      '美食': { en: 'Food', ar: 'طعام', ru: 'Еда', es: 'Comida' },
      '女装': { en: 'Women', ar: 'نساء', ru: 'Женщины', es: 'Mujeres' },
      '美妆': { en: 'Beauty', ar: 'جمال', ru: 'Красота', es: 'Belleza' },
      '居家日用': { en: 'Home', ar: 'منزل', ru: 'Дом', es: 'Hogar' },
      '数码家电': { en: 'Digital', ar: 'رقمي', ru: 'Цифровой', es: 'Digital' },
      '鞋品': { en: 'Shoes', ar: 'أحذية', ru: 'Обувь', es: 'Zapatos' },
      '内衣': { en: 'Underwear', ar: 'ملابس داخلية', ru: 'Бельё', es: 'Ropa interior' },
      '男装': { en: 'Men', ar: 'رجال', ru: 'Мужчины', es: 'Hombres' },
      '母婴': { en: 'Baby', ar: 'أطفال', ru: 'Дети', es: 'Bebé' },
      '运动户外': { en: 'Sports', ar: 'رياضة', ru: 'Спорт', es: 'Deportes' },
      '箱包': { en: 'Bags', ar: 'حقائب', ru: 'Сумки', es: 'Bolsos' },
      '配饰': { en: 'Accessories', ar: 'إكسسوارات', ru: 'Аксессуары', es: 'Accesorios' },
    };
    return map[name]?.[lang] || name;
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
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3">
        {/* Horizontal Category Navigation - 始终显示 */}
        <div className="py-3 border-b">
          {catLoading ? (
            <div className="flex gap-4 animate-pulse overflow-x-auto">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="h-6 w-16 bg-gray-200 rounded-full flex-shrink-0" />
              ))}
            </div>
          ) : (
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide -mx-3 px-3">
              {categories.map((cat) => (
                <button
                  key={cat.cid}
                  onClick={() => {
                    setActiveCategory(cat.cid);
                    handleCategorySearch(cat.cname);
                  }}
                  className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap flex-shrink-0 transition-colors ${
                    activeCategory === cat.cid 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {translateCatName(cat.cname)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 4大栏目 - 放在猜你喜欢之前 */}
        {/* 暂时隐藏未跑通的栏目 */}
        {/* {renderSection(text.hotSales, hotSales, hotSalesLoading, '/tools/search-source?cat=hot')} */}
        {renderSection(text.highCommission, highCommission, highCommissionLoading, '/tools/search-source?cat=commission')}
        {/* {renderSection(text.nineNine, nineNine, nineNineLoading, '/tools/search-source?cat=nine')} */}
        {/* {renderSection(text.dailyHot, dailyHot, dailyHotLoading, '/tools/search-source?cat=daily')} */}

        {/* Section Header - 猜你喜欢 */}
        <div className="flex items-center gap-2 py-3">
          <span className="text-sm font-bold text-gray-800">{text.guessYouLike}</span>
        </div>

        {/* Products Grid - 猜你喜欢 */}
        {(products.length > 0 || !guessLoading) && (
          <div className="pb-3">
            {products.length > 0 ? (
              renderProductGrid(products)
            ) : guessLoading ? (
              /* 骨架屏 */
              <div className="grid grid-cols-2 gap-2.5">
                {[1,2,3,4].map(i => (
                  <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-100">
                    <div className="aspect-[4/5] bg-gray-200 animate-pulse" />
                    <div className="p-2 space-y-2">
                      <div className="h-3 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
                      <div className="flex gap-1">
                        <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
                        <div className="h-5 w-12 bg-gray-200 rounded animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : guessProducts.length > 0 ? (
              renderProductGrid(guessProducts)
            ) : (
              <div className="text-center py-8 text-sm text-gray-400">
                {text.noData}
              </div>
            )}
          </div>
        )}

        {/* Load More - 猜你喜欢 */}
        {!products.length && guessProducts.length > 0 && (
          <div className="py-4 text-center">
            {hasMoreGuess ? (
              <button
                onClick={() => fetchGuessYouLike(guessPage + 1)}
                disabled={loadingMoreGuess}
                className="px-6 py-2 bg-white border rounded-full text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                {loadingMoreGuess ? text.loading : text.loadMore}
              </button>
            ) : (
              <span className="text-xs text-gray-400">{text.noMore}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
