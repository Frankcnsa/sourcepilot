'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, ExternalLink, MessageSquare, CheckSquare, Square, Loader2, Menu, ChevronDown, ArrowLeft, FileText, Send } from 'lucide-react';
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
    zh: '采购清单',
    en: 'Sourcing List',
    ru: 'Список закупок',
    ar: 'قائمة التوريد',
    es: 'Lista de Abastecimiento'
  },
  pageSubtitle: {
    zh: '管理您的商品收藏',
    en: 'Manage your saved products',
    ru: 'Управляйте сохраненными товарами',
    ar: 'إدارة منتجاتك المحفوظة',
    es: 'Gestiona tus productos guardados'
  },
  emptyTitle: {
    zh: '清单为空',
    en: 'Your list is empty',
    ru: 'Список пуст',
    ar: 'القائمة فارغة',
    es: 'Tu lista está vacía'
  },
  emptyDesc: {
    zh: '去 Search Source 搜索商品并添加到清单',
    en: 'Go to Search Source to find and add products',
    ru: 'Перейдите в Search Source, чтобы найти товары',
    ar: 'انتقل إلى Search Source للعثور على منتجات',
    es: 'Ve a Search Source para encontrar productos'
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
  deselectAll: {
    zh: '取消全选',
    en: 'Deselect All',
    ru: 'Снять выделение',
    ar: 'إلغاء التحديد',
    es: 'Deseleccionar'
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
  consultSelected: {
    zh: '咨询选中',
    en: 'Consult Selected',
    ru: 'Консультация',
    ar: 'استشارة',
    es: 'Consultar'
  },
  generatePDF: {
    zh: '生成PDF并发送',
    en: 'Generate PDF \u0026 Send',
    ru: 'Создать PDF и отправить',
    ar: 'إنشاء PDF وإرسال',
    es: 'Generar PDF y enviar'
  },
  sending: {
    zh: '发送中...',
    en: 'Sending...',
    ru: 'Отправка...',
    ar: 'جاري الإرسال...',
    es: 'Enviando...'
  },
  sentSuccess: {
    zh: '已发送到您的邮箱',
    en: 'Sent to your email',
    ru: 'Отправлено на вашу почту',
    ar: 'تم الإرسال إلى بريدك',
    es: 'Enviado a tu correo'
  },
  sentError: {
    zh: '发送失败，请重试',
    en: 'Failed to send, please retry',
    ru: 'Ошибка отправки',
    ar: 'فشل الإرسال',
    es: 'Error al enviar'
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
    en: 'Search',
    ru: 'Поиск',
    ar: 'البحث',
    es: 'Búsqueda'
  },
  addedAt: {
    zh: '添加时间',
    en: 'Added',
    ru: 'Добавлено',
    ar: 'تاريخ الإضافة',
    es: 'Añadido'
  },
  viewOnTaobao: {
    zh: '去淘宝查看',
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
  },
  login: {
    zh: '登录',
    en: 'Login',
    ru: 'Вход',
    ar: 'دخول',
    es: 'Iniciar sesión'
  },
  home: {
    zh: '返回首页',
    en: 'Back to Home',
    ru: 'На главную',
    ar: 'العودة للرئيسية',
    es: 'Volver al inicio'
  },
  searchSource: {
    zh: '搜索商品',
    en: 'Search Products',
    ru: 'Поиск товаров',
    ar: 'البحث عن المنتجات',
    es: 'Buscar productos'
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

export default function SourcingListPage() {
  const [lang, setLang] = useState('en');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  
  const [items, setItems] = useState<SourcingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [sendingPDF, setSendingPDF] = useState(false);
  const [sendStatus, setSendStatus] = useState<'success' | 'error' | null>(null);

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
    
    // 跳转到 Consultation 页面
    const encodedMessage = encodeURIComponent(message);
    window.location.href = `/chat?message=${encodedMessage}`;
  };

  // 生成PDF并发送
  const generateAndSendPDF = async () => {
    if (!session || items.length === 0) return;
    
    setSendingPDF(true);
    setSendStatus(null);
    
    try {
      const response = await fetch('/api/pdf/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            title: item.title,
            price: item.price,
            image: item.image,
            shop: item.shop,
            link: item.link,
          })),
          email: session.user.email,
          lang,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSendStatus('success');
      } else {
        setSendStatus('error');
      }
    } catch (e) {
      console.error('Failed to send PDF:', e);
      setSendStatus('error');
    } finally {
      setSendingPDF(false);
    }
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

  const currentLangName = supportedLanguages.find(l => l.code === lang)?.name || 'English';

  // 格式化时间
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(lang === 'zh' ? 'zh-CN' : lang === 'ru' ? 'ru-RU' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // 未登录状态
  if (!session) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isMobile={isMobile} />
        {sidebarOpen && isMobile && <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
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

              <Link href="/" className="text-sm text-[#4F6DF5] hover:underline flex items-center gap-1">
                <ArrowLeft size={14} />
                {t('home')}
              </Link>
            </div>
          </header>

          <div className="flex-1 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center max-w-md">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText size={32} className="text-[#4F6DF5]" />
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

              <Link href="/tools/search-source" className="text-sm text-[#4F6DF5] hover:underline">
                {t('searchSource')}
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
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-[#4F6DF5]" />
              </div>
            ) : items.length === 0 ? (
              // 空状态
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText size={40} className="text-gray-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">{t('emptyTitle')}</h2>
                <p className="text-gray-500 mb-6">{t('emptyDesc')}</p>
                <Link 
                  href="/tools/search-source"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#4F6DF5] text-white rounded-xl font-medium hover:opacity-90"
                >
                  {t('goSearch')}
                </Link>
              </div>
            ) : (
              <>
                {/* 操作栏 */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={toggleSelectAll}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
                    >
                      {selectedItems.size === items.length ? (
                        <CheckSquare size={20} className="text-[#4F6DF5]" />
                      ) : (
                        <Square size={20} className="text-gray-400" />
                      )}
                      {selectedItems.size === items.length ? t('deselectAll') : t('selectAll')}
                    </button>
                    
                    {selectedItems.size > 0 && (
                      <span className="text-sm text-[#4F6DF5]">
                        {t('selectedCount', { count: selectedItems.size })}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {selectedItems.size > 0 && (
                      <>
                        <button
                          onClick={consultSelected}
                          className="flex items-center gap-2 px-4 py-2 bg-[#4F6DF5] text-white rounded-xl font-medium hover:opacity-90"
                        >
                          <MessageSquare size={16} />
                          {t('consultSelected')}
                        </button>
                        
                        <button
                          onClick={deleteSelected}
                          className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-xl font-medium hover:bg-red-200"
                        >
                          <Trash2 size={16} />
                          {t('deleteSelected')}
                        </button>
                      </>
                    )}

                    {/* 生成PDF按钮 */}
                    <button
                      onClick={generateAndSendPDF}
                      disabled={sendingPDF || items.length === 0}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50"
                    >
                      {sendingPDF ? (
                        <><Loader2 size={16} className="animate-spin" />{t('sending')}</>
                      ) : (
                        <><Send size={16} />{t('generatePDF')}</>
                      )}
                    </button>
                  </div>
                </div>

                {/* 发送状态提示 */}
                {sendStatus === 'success' && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
                    {t('sentSuccess')}
                  </div>
                )}
                {sendStatus === 'error' && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
                    {t('sentError')}
                  </div>
                )}

                {/* 商品列表 */}
                <div className="space-y-4">
                  {items.map((item) => (
                    <div 
                      key={item.id}
                      className={`bg-white rounded-2xl shadow-sm border transition-all ${
                        selectedItems.has(item.id) ? 'border-[#4F6DF5] ring-1 ring-[#4F6DF5]' : 'border-gray-100'
                      }`}
                    >
                      <div className="p-4 flex gap-4">
                        {/* 选择框 */}
                        <button
                          onClick={() => toggleSelect(item.id)}
                          className="flex-shrink-0 mt-8"
                        >
                          {selectedItems.has(item.id) ? (
                            <CheckSquare size={20} className="text-[#4F6DF5]" />
                          ) : (
                            <Square size={20} className="text-gray-400" />
                          )}
                        </button>
                        
                        {/* 商品图片 */}
                        <div className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
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
                              <FileText size={24} />
                            </div>
                          )}
                        </div>
                        
                        {/* 商品信息 */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-800 mb-1 line-clamp-2 text-sm">
                            {item.title}
                          </h3>
                          
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm mb-2">
                            <span className="text-lg font-bold text-red-600">¥{item.price}</span>
                            <span className="text-gray-500 text-xs">{item.shop}</span>
                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{item.query}</span>
                            <span className="text-xs text-gray-400">{formatDate(item.created_at)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-[#4F6DF5] hover:underline"
                            >
                              <ExternalLink size={14} />
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
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 底部统计 */}
                <div className="mt-6 text-center text-sm text-gray-500">
                  {t('itemsCount', { count: items.length })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
