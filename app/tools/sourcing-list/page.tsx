'use client';

import React, { useState, useEffect } from 'react';
import { Trash2, ExternalLink, MessageSquare, CheckSquare, Square, Loader2 } from 'lucide-react';
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
    zh: 'Sourcing History - 寻源清单',
    en: 'Sourcing History - Sourcing List',
    ru: 'Sourcing History - Список закупок',
    ar: 'Sourcing History - قائمة التوريد',
    es: 'Sourcing History - Lista de abastecimiento'
  },
  emptyTitle: {
    zh: '清单为空',
    en: 'List is empty',
    ru: 'Список пуст',
    ar: 'القائمة فارغة',
    es: 'La lista está vacía'
  },
  emptyDesc: {
    zh: '去 Search Source 搜索商品并添加到清单',
    en: 'Go to Search Source to find products and add them to your list',
    ru: 'Перейдите в Search Source, чтобы найти товары и добавить их в список',
    ar: 'انتقل إلى Search Source للعثور على منتجات وإضافتها إلى قائمتك',
    es: 'Ve a Search Source para encontrar productos y añadirlos a tu lista'
  },
  goSearch: {
    zh: '去搜索',
    en: 'Go Search',
    ru: 'Искать',
    ar: 'البحث',
    es: 'Buscar'
  },
  selectAll: {
    zh: '全选',
    en: 'Select All',
    ru: 'Выбрать все',
    ar: 'تحديد الكل',
    es: 'Seleccionar todo'
  },
  delete: {
    zh: '删除',
    en: 'Delete',
    ru: 'Удалить',
    ar: 'حذف',
    es: 'Eliminar'
  },
  deleteSelected: {
    zh: '删除选中',
    en: 'Delete Selected',
    ru: 'Удалить выбранное',
    ar: 'حذف المحدد',
    es: 'Eliminar seleccionados'
  },
  consult: {
    zh: '咨询 Pilot',
    en: 'Consult Pilot',
    ru: 'Консультация Pilot',
    ar: 'استشارة بايلوت',
    es: 'Consultar Pilot'
  },
  consultSelected: {
    zh: '咨询选中商品',
    en: 'Consult Selected Items',
    ru: 'Консультация по выбранным',
    ar: 'استشارة المنتجات المحددة',
    es: 'Consultar artículos seleccionados'
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
  searchQuery: {
    zh: '搜索词',
    en: 'Search Query',
    ru: 'Поисковый запрос',
    ar: 'عبارة البحث',
    es: 'Término de búsqueda'
  },
  addedAt: {
    zh: '添加时间',
    en: 'Added At',
    ru: 'Добавлено',
    ar: 'تاريخ الإضافة',
    es: 'Añadido el'
  },
  viewOnTaobao: {
    zh: '查看淘宝链接',
    en: 'View on Taobao',
    ru: 'Открыть на Taobao',
    ar: 'عرض على Taobao',
    es: 'Ver en Taobao'
  },
  itemsCount: {
    zh: '共 {count} 件商品',
    en: '{count} items',
    ru: '{count} товаров',
    ar: '{count} منتج',
    es: '{count} artículos'
  },
  selectedCount: {
    zh: '已选 {count} 件',
    en: '{count} selected',
    ru: 'Выбрано {count}',
    ar: 'تم تحديد {count}',
    es: '{count} seleccionados'
  },
  loading: {
    zh: '加载中...',
    en: 'Loading...',
    ru: 'Загрузка...',
    ar: 'جاري التحميل...',
    es: 'Cargando...'
  },
  pleaseLogin: {
    zh: '请先登录',
    en: 'Please login first',
    ru: 'Пожалуйста, войдите',
    ar: 'يرجى تسجيل الدخول',
    es: 'Por favor inicie sesión'
  }
};

// 检测浏览器语言
function detectLanguage(): string {
  if (typeof window === 'undefined') return 'en';
  const lang = navigator.language || navigator.languages[0] || 'en';
  const primaryLang = lang.split('-')[0];
  return supportedLanguages.find(l => l.code === primaryLang)?.code || 'en';
}

interface SourcingItem {
  id: string;
  product_id: string;
  title: string;
  original_title: string;
  price: string;
  original_price?: string;
  image: string;
  shop: string;
  sales: string;
  link: string;
  description: string;
  query: string;
  created_at: string;
}

export default function SourcingHistoryPage() {
  const [lang, setLang] = useState('en');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [session, setSession] = useState<any>(null);
  
  const [items, setItems] = useState<SourcingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

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
        fetchItems(session.user.id);
      } else {
        setLoading(false);
      }
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchItems(session.user.id);
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

  // 获取清单数据
  const fetchItems = async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sourcing_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Failed to fetch items:', error);
      } else {
        setItems(data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  // 删除单个商品
  const deleteItem = async (id: string) => {
    if (!session) return;
    
    try {
      const { error } = await supabase
        .from('sourcing_items')
        .delete()
        .eq('id', id);
      
      if (!error) {
        setItems(prev => prev.filter(item => item.id !== id));
        setSelectedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }
    } catch (e) {
      console.error('Failed to delete item:', e);
    }
  };

  // 删除选中的商品
  const deleteSelected = async () => {
    if (!session || selectedItems.size === 0) return;
    
    try {
      const { error } = await supabase
        .from('sourcing_items')
        .delete()
        .in('id', Array.from(selectedItems));
      
      if (!error) {
        setItems(prev => prev.filter(item => !selectedItems.has(item.id)));
        setSelectedItems(new Set());
      }
    } catch (e) {
      console.error('Failed to delete selected:', e);
    }
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(item => item.id)));
    }
  };

  // 切换选中状态
  const toggleSelect = (id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // 咨询选中的商品
  const consultSelected = () => {
    if (selectedItems.size === 0) return;
    
    const selectedProducts = items.filter(item => selectedItems.has(item.id));
    const productInfo = selectedProducts.map(p => 
      `- ${p.title} (¥${p.price}) - ${p.link}`
    ).join('\n');
    
    const message = `I found these products on Taobao:\n${productInfo}\n\nCan you help me analyze these products and suggest the best sourcing strategy?`;
    
    // 跳转到 Consultation 页面，带上商品信息
    const encodedMessage = encodeURIComponent(message);
    window.location.href = `/chat?message=${encodedMessage}`;
  };

  // 获取翻译文本
  const t = (key: keyof typeof translations, params?: { [key: string]: string | number }) => {
    let text = translations[key][lang as keyof typeof translations[typeof key]] || translations[key]['en'];
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        text = text.replace(`{${key}}`, String(value));
      });
    }
    return text;
  };

  // 格式化时间
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(lang === 'zh' ? 'zh-CN' : lang === 'ru' ? 'ru-RU' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!session) {
    return (
      <div className="flex h-screen bg-[#f5f5f5]">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} currentTool="sourcing-history" />
        <div className={`flex-1 flex items-center justify-center transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <div className="text-center">
            <p className="text-gray-500 mb-4">{t('pleaseLogin')}</p>
            <a href="/auth/login" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f5f5f5]">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        currentTool="sourcing-history"
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
            <h1 className="text-lg font-semibold text-gray-800">Sourcing History</h1>
          </div>
          
          <div className="text-sm text-gray-500">
            {t('itemsCount', { count: items.length })}
          </div>
        </header>
        
        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{t('loading')}</span>
              </div>
            </div>
          ) : items.length === 0 ? (
            // 空状态
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('emptyTitle')}</h3>
              <p className="text-gray-500 mb-6 max-w-md">{t('emptyDesc')}</p>
              <a 
                href="/tools/search-source"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('goSearch')}
              </a>
            </div>
          ) : (
            // 清单列表
            <div className="max-w-6xl mx-auto px-4 py-6">
              {/* 操作栏 */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleSelectAll}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
                  >
                    {selectedItems.size === items.length ? (
                      <CheckSquare className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                    {t('selectAll')}
                  </button>
                  
                  {selectedItems.size > 0 && (
                    <span className="text-sm text-blue-600">
                      {t('selectedCount', { count: selectedItems.size })}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {selectedItems.size > 0 && (
                    <>
                      <button
                        onClick={consultSelected}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                        {t('consultSelected')}
                      </button>
                      
                      <button
                        onClick={deleteSelected}
                        className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        {t('deleteSelected')}
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              {/* 商品列表 */}
              <div className="space-y-3">
                {items.map((item) => (
                  <div 
                    key={item.id}
                    className={`bg-white rounded-xl border transition-colors ${
                      selectedItems.has(item.id) ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'
                    }`}
                  >
                    <div className="p-4 flex gap-4">
                      {/* 选择框 */}
                      <button
                        onClick={() => toggleSelect(item.id)}
                        className="flex-shrink-0 mt-1"
                      >
                        {selectedItems.has(item.id) ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      
                      {/* 商品图片 */}
                      <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={item.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder-product.png';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      {/* 商品信息 */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-medium text-gray-800 mb-1 line-clamp-2">
                          {item.title}
                        </h3>
                        
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mb-2">
                          <span className="text-lg font-bold text-red-600">¥{item.price}</span>
                          <span>{item.shop}</span>
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{item.query}</span>
                          <span className="text-xs">{formatDate(item.created_at)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                          >
                            <ExternalLink className="w-4 h-4" />
                            {t('viewOnTaobao')}
                          </a>
                        </div>
                      </div>
                      
                      {/* 操作按钮 */}
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title={t('delete')}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
