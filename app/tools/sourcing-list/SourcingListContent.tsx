'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trash2, FileText, CheckSquare, Square, ExternalLink, ShoppingCart, Store, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';
import { getSupabaseBrowserClient } from '@/lib/supabase';

interface SourcingItem {
  id: string;
  product_id: string;
  title: string;
  image_url: string;
  price: string;
  shop_name: string;
  product_url: string;
  pid_link?: string;
  created_at: string;
  [key: string]: any;
}

export default function SourcingListPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const [items, setItems] = useState<SourcingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [user, setUser] = useState<any>(null);

  // 翻译清单项（使用 useTranslation Hook）
  const { translatedItems: translatedItems, loading: translateLoading } = useTranslation(
    items,
    lang,
    ['title', 'shop_name']
  );

  // 获取用户信息
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }: any) => {
      setUser(data.user);
      if (!data.user) {
        router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      }
    });
  }, [router]);

  // 加载清单（关键：只加载当前用户的，确保数据隔离）
  const loadItems = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/sourcing-items?userId=' + user.id);
      const data = await res.json();
      if (data.success && data.items) {
        setItems(data.items);
      }
    } catch (e) {
      console.error('Load items failed:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadItems();
    }
  }, [user, lang, loadItems]);

  // 删除单个商品
  const deleteItem = async (id: string) => {
    if (!user) return;
    try {
      await fetch('/api/sourcing-items', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, userId: user.id })
      });
      setItems(prev => prev.filter(item => item.id !== id));
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } catch (e) {
      console.error('Delete failed:', e);
    }
  };

  // 批量删除
  const deleteSelected = async () => {
    if (selectedItems.size === 0) return;
    if (!confirm(t.deleteConfirm)) return;
    
    try {
      await Promise.all(
        Array.from(selectedItems).map(id =>
          fetch('/api/sourcing-items', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, userId: user?.id })
          })
        )
      );
      setSelectedItems(new Set());
      loadItems();
    } catch (e) {
      console.error('Batch delete failed:', e);
    }
  };

  // 切换选择
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(item => item.id)));
    }
  };

  // 生成 PDF
  const generatePdf = async () => {
    if (selectedItems.size === 0) {
      alert(t.selectItems);
      return;
    }
    setGeneratingPdf(true);
    try {
      const selectedData = items.filter(item => selectedItems.has(item.id));
      const res = await fetch('/api/generate-sourcing-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: selectedData, lang })
      });
      const data = await res.json();
      if (data.success) {
        alert(t.pdfSent);
      }
    } catch (e) {
      console.error('Generate PDF failed:', e);
    } finally {
      setGeneratingPdf(false);
    }
  };

  // 去淘宝购买
  const handleBuyOnTaobao = (item: SourcingItem) => {
    window.open(item.pid_link || item.product_url, '_blank');
  };

  // 多语言文本
  const t = {
    zh: {
      title: '采购清单',
      back: '返回',
      empty: '清单为空',
      startSourcing: '去采购',
      selectAll: '全选',
      delete: '删除',
      generatePdf: '生成报告',
      price: '价格',
      shop: '店铺',
      added: '添加时间',
      sendTo: '发送至',
      pdfSent: '报告已发送！',
      selectItems: '请先选择商品',
      buyOnTaobao: '去淘宝',
      total: '共',
      items: '件商品',
      deleteConfirm: '删除选中的商品？',
      manage: '管理'
    },
    en: {
      title: 'Sourcing Cart',
      back: 'Back',
      empty: 'Your sourcing cart is empty',
      startSourcing: 'Start Sourcing',
      selectAll: 'Select All',
      delete: 'Delete',
      generatePdf: 'Generate Report',
      price: 'Price',
      shop: 'Shop',
      added: 'Added',
      sendTo: 'Send to',
      pdfSent: 'PDF sent!',
      selectItems: 'Select items first',
      buyOnTaobao: 'Go to Taobao',
      total: 'Total',
      items: 'items',
      deleteConfirm: 'Delete selected items?',
      manage: 'Manage'
    },
    ru: {
      title: 'Корзина закупок',
      back: 'Назад',
      empty: 'Ваша корзина пуста',
      startSourcing: 'Начать закупку',
      selectAll: 'Выбрать все',
      delete: 'Удалить',
      generatePdf: 'Создать отчёт',
      price: 'Цена',
      shop: 'Магазин',
      added: 'Добавлено',
      sendTo: 'Отправить в',
      pdfSent: 'PDF отправлен!',
      selectItems: 'Сначала выберите товары',
      buyOnTaobao: 'Перейти на Taobao',
      total: 'Всего',
      items: 'товаров',
      deleteConfirm: 'Удалить выбранные товары?',
      manage: 'Управление'
    },
    es: {
      title: 'Carrito de Sourcing',
      back: 'Volver',
      empty: 'Tu carrito está vacío',
      startSourcing: 'Empezar Sourcing',
      selectAll: 'Seleccionar todo',
      delete: 'Eliminar',
      generatePdf: 'Generar informe',
      price: 'Precio',
      shop: 'Tienda',
      added: 'Añadido',
      sendTo: 'Enviar a',
      pdfSent: '¡PDF enviado!',
      selectItems: 'Seleccione productos primero',
      buyOnTaobao: 'Ir a Taobao',
      total: 'Total',
      items: 'productos',
      deleteConfirm: '¿Eliminar productos seleccionados?',
      manage: 'Gestionar'
    },
    ar: {
      title: 'قائمة التسوق',
      back: 'العودة',
      empty: 'قائمتك فارغة',
      startSourcing: 'ابدأ التسوق',
      selectAll: 'تحديد الكل',
      delete: 'حذف',
      generatePdf: 'إنشاء تقرير',
      price: 'السعر',
      shop: 'المتجر',
      added: 'أضيف',
      sendTo: 'إرسال إلى',
      pdfSent: 'تم إرسال PDF!',
      selectItems: 'حدد العناصر أولاً',
      buyOnTaobao: 'اذهب إلى تاوباو',
      total: 'المجموع',
      items: 'عنصر',
      deleteConfirm: 'حذف العناصر المحددة؟',
      manage: 'إدارة'
    }
  }[lang] || {
    title: 'Sourcing Cart',
    back: 'Back',
    empty: 'Your cart is empty',
    startSourcing: 'Start Sourcing',
    selectAll: 'Select All',
    delete: 'Delete',
    generatePdf: 'Generate Report',
    price: 'Price',
    shop: 'Shop',
    added: 'Added',
    sendTo: 'Send to',
    pdfSent: 'PDF sent!',
    selectItems: 'Select items first',
    buyOnTaobao: 'Go to Taobao',
    total: 'Total',
    items: 'items',
    deleteConfirm: 'Delete selected items?',
    manage: 'Manage'
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-3 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-1 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold">{t.title}</h1>
            <span className="text-sm text-gray-400">{t.total} {items.length} {t.items}</span>
          </div>
          
          <div className="flex gap-2">
            {selectedItems.size > 0 && (
              <button
                onClick={deleteSelected}
                className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg"
              >
                {t.delete}
              </button>
            )}
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"
            >
              {selectedItems.size === items.length ? (
                <CheckSquare className="w-4 h-4 text-blue-500" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              <span>{t.selectAll}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 py-4">
        {loading || translateLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-xl p-4 border animate-pulse">
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-gray-200 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">{t.empty}</p>
            <button
              onClick={() => router.push('/tools/search-source')}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              {t.startSourcing}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 按店铺分组 */}
            {Object.entries(
              translatedItems.reduce((groups: any, item) => {
                const shop = item.shop_name || 'Unknown Shop';
                if (!groups[shop]) groups[shop] = [];
                groups[shop].push(item);
                return groups;
              }, {})
            ).map((entry: any) => {
              const [shopName, shopItems] = entry as [string, any[]];
              return (
                <div key={shopName} className="bg-white rounded-xl border overflow-hidden">
                  {/* 店铺头部 */}
                  <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-2">
                    <Store className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">{shopName}</span>
                  </div>
                  
                  {/* 商品列表 */}
                  <div className="divide-y divide-gray-100">
                    {shopItems.map((item: any) => (
                      <div 
                        key={item.id}
                        className={`p-4 flex gap-4 ${selectedItems.has(item.id) ? 'bg-blue-50/50' : ''}`}
                      >
                        {/* 选择框 */}
                        <button 
                          onClick={() => toggleSelect(item.id)}
                          className="flex-shrink-0 self-center"
                        >
                          {selectedItems.has(item.id) ? (
                            <CheckSquare className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-300" />
                          )}
                        </button>
                      
                        {/* 图片 */}
                        <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={item.image_url?.replace('http://', 'https://')}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80x80?text=No+Image';
                            }}
                          />
                        </div>
                      
                        {/* 信息 */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug">
                            {item.title}
                          </h3>
                          <div className="mt-1.5 flex items-center justify-between">
                            <span className="text-lg font-bold text-red-500">
                              ¥{item.price}
                            </span>
                            <button
                              onClick={() => deleteItem(item.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {t.added}: {new Date(item.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                
                  {/* 店铺操作栏 */}
                  <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {shopItems.length} {t.items}
                    </span>
                    <button
                      onClick={() => handleBuyOnTaobao(shopItems[0])}
                      className="px-4 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {t.buyOnTaobao}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 底部操作栏 */}
      <div className="sticky bottom-0 bg-white border-t px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-1.5 text-sm"
          >
            {selectedItems.size === items.length ? (
              <CheckSquare className="w-5 h-5 text-blue-500" />
            ) : (
              <Square className="w-5 h-5 text-gray-300" />
            )}
            <span>{t.selectAll}</span>
          </button>
          <span className="text-sm text-gray-400">
            {t.total} {selectedItems.size} {t.items}
          </span>
        </div>
        
        <button
          onClick={generatePdf}
          disabled={generatingPdf || selectedItems.size === 0}
          className="px-5 py-2.5 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 font-medium"
        >
          <FileText className="w-4 h-4" />
          <span>{generatingPdf ? '...' : t.generatePdf}</span>
        </button>
      </div>
    </div>
  );
}
