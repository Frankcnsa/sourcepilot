'use client';

import { useState, useEffect } from 'react';
import { Search, ShoppingCart, Globe, ChevronRight, TrendingUp, Grid3X3 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ProductDetailModal from './ProductDetailModal';
import { SUPPORTED_LANGUAGES } from '@/lib/aliyun-translate';

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

export default function SearchSourcePage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartCount, setCartCount] = useState(0);

  // 模拟热搜词
  const hotWords = [
    'phone case', 'cable', 'headphones', 'charger', 
    'screen protector', 'bluetooth speaker', 'power bank', 'smart watch'
  ];

  // 模拟分类
  const categories = [
    { id: '1', name: 'Electronics', icon: '💻' },
    { id: '2', name: 'Fashion', icon: '👕' },
    { id: '3', name: 'Home', icon: '🏠' },
    { id: '4', name: 'Beauty', icon: '💄' },
    { id: '5', name: 'Sports', icon: '⚽' },
    { id: '6', name: 'Toys', icon: '🧸' }
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
      searchPlaceholder: 'Search for products...',
      hotSearch: 'Popular Searches',
      categories: 'Categories',
      search: 'Search',
      price: 'Price',
      sales: 'Sales',
      shop: 'Shop',
      addToCart: 'Add to List',
      view: 'View Details',
      sourcingList: 'Sourcing List'
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
      sourcingList: '采购清单'
    },
    ar: {
      searchPlaceholder: 'البحث عن المنتجات...',
      hotSearch: 'عمليات البحث الشائعة',
      categories: 'التصنيفات',
      search: 'بحث',
      price: 'السعر',
      sales: 'المبيعات',
      shop: 'المتجر',
      addToCart: 'إضافة إلى القائمة',
      view: 'عرض التفاصيل',
      sourcingList: 'قائمة المصادر'
    },
    ru: {
      searchPlaceholder: 'Поиск товаров...',
      hotSearch: 'Популярные запросы',
      categories: 'Категории',
      search: 'Поиск',
      price: 'Цена',
      sales: 'Продажи',
      shop: 'Магазин',
      addToCart: 'Добавить в список',
      view: 'Подробнее',
      sourcingList: 'Список закупок'
    },
    es: {
      searchPlaceholder: 'Buscar productos...',
      hotSearch: 'Búsquedas populares',
      categories: 'Categorías',
      search: 'Buscar',
      price: 'Precio',
      sales: 'Ventas',
      shop: 'Tienda',
      addToCart: 'Añadir a la lista',
      view: 'Ver detalles',
      sourcingList: 'Lista de abastecimiento'
    }
  };

  const text = t[currentLang as keyof typeof t] || t.en;

  // 搜索商品
  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          targetLang: currentLang,
          page: 1,
          pageSize: 20
        })
      });

      const data = await response.json();
      if (data.success) {
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加入采购清单
  const addToCart = async (product: Product) => {
    try {
      const response = await fetch('/api/sourcing-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.num_iid,
          title: product.title,
          image_url: product.pic_url,
          price: product.price,
          shop_name: product.seller_nick,
          product_url: product.detail_url
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">SourcePilot</h1>
          
          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100">
                <Globe className="w-4 h-4" />
                <span>{languages.find(l => l.code === currentLang)?.flag}</span>
                <span className="text-sm">{languages.find(l => l.code === currentLang)?.name}</span>
              </button>
              
              <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                {languages.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => setCurrentLang(lang.code)}
                    className={`flex items-center gap-2 px-4 py-2 w-full text-left hover:bg-gray-50 ${
                      currentLang === lang.code ? 'bg-blue-50 text-blue-600' : ''
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span className="text-sm">{lang.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sourcing List Button */}
            <button 
              onClick={() => router.push('/tools/sourcing-list')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="text-sm">{text.sourcingList}</span>
              {cartCount > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-white text-blue-600 text-xs rounded-full">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Search Section */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Search Box */}
        <div className="relative mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={text.searchPlaceholder}
            className="w-full px-4 py-4 pl-12 pr-24 text-lg border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    setQuery(cat.name);
                    handleSearch(cat.name);
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
            {products.map(product => (
              <div key={product.num_iid} className="bg-white border rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                <div 
                  className="aspect-square bg-gray-100 cursor-pointer"
                  onClick={() => setSelectedProduct(product)}
                >
                  <img
                    src={product.pic_url}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <h3 
                    className="text-sm font-medium text-gray-900 line-clamp-2 cursor-pointer hover:text-blue-600"
                    onClick={() => setSelectedProduct(product)}
                  >
                    {product.title}
                  </h3>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-lg font-bold text-red-600">
                      ¥{product.price}
                    </span>
                    <span className="text-xs text-gray-500">
                      {product.sales} {text.sales}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{product.seller_nick}</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => addToCart(product)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                    >
                      {text.addToCart}
                    </button>
                    <button
                      onClick={() => setSelectedProduct(product)}
                      className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50"
                    >
                      {text.view}
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
