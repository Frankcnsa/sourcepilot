'use client';

import { useState, useEffect } from 'react';
import { Trash2, FileText, CheckSquare, Square, Send, ExternalLink, ShoppingCart, Store, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { translateBatch } from '@/lib/aliyun-translate';
import { useLanguage } from '@/context/LanguageContext';

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
}

export default function SourcingListPage() {
  const router = useRouter();
  const [items, setItems] = useState<SourcingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const { lang } = useLanguage();
  const [buyingItem, setBuyingItem] = useState<string | null>(null);

  // 翻译文本
  const t = {
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
    }
  };

  const text = t[lang as keyof typeof t] || t.en;

  // 加载采购清单
  useEffect(() => {
    fetchItems();
  }, [lang]);

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/sourcing-items');
      if (response.ok) {
        const data = await response.json();
        let items = data.items || [];
        
        // 用阿里翻译机翻译商品标题和店铺名
        if (lang !== 'zh') {
          try {
            const titles = items.map((item: any) => item.title || '');
            const shops = items.map((item: any) => item.shop_name || '');
            const [translatedTitles, translatedShops] = await Promise.all([
              translateBatch(titles, 'zh', lang),
              translateBatch(shops, 'zh', lang)
            ]);
            items = items.map((item: any, i: number) => ({
              ...item,
              title: translatedTitles[i] || item.title,
              shop_name: translatedShops[i] || item.shop_name
            }));
          } catch (err) {
            console.warn('[Cart] Translation failed, using originals:', err);
          }
        }
        
        setItems(items);
      }
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setLoading(false);
    }
  };

  // 删除商品
  const deleteItem = async (id: string) => {
    try {
      const response = await fetch(`/api/sourcing-items?id=${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setItems(prev => prev.filter(item => item.id !== id));
        setSelectedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  // 批量删除
  const deleteSelected = async () => {
    if (!confirm(text.deleteConfirm)) return;
    for (const id of selectedItems) {
      await deleteItem(id);
    }
    setSelectedItems(new Set());
  };

  // 切换选择
  const toggleSelection = (id: string) => {
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

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(item => item.id)));
    }
  };

  // 生成PDF
  const generatePdf = async () => {
    if (selectedItems.size === 0) {
      alert(text.selectItems);
      return;
    }

    setGeneratingPdf(true);
    try {
      const selectedProducts = items.filter(item => selectedItems.has(item.id));
      
      const response = await fetch('/api/pdf/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: selectedProducts,
          lang: currentLang
        })
      });

      if (response.ok) {
        alert(text.pdfSent);
      } else {
        alert('Failed to generate PDF');
      }
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    } finally {
      setGeneratingPdf(false);
    }
  };

  // 去淘宝购买
  const handleBuyOnTaobao = async (item: SourcingItem) => {
    setBuyingItem(item.id);
    try {
      if (item.pid_link) {
        window.open(item.pid_link, '_blank');
        return;
      }

      const response = await fetch('/api/convert-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goodsId: item.product_id,
          itemId: item.product_id
        })
      });

      const data = await response.json();
      if (data.success && (data.shortUrl || data.longUrl || data.couponClickUrl)) {
        const url = data.couponClickUrl || data.shortUrl || data.longUrl;
        setItems(prev => prev.map(i => 
          i.id === item.id ? { ...i, pid_link: url } : i
        ));
        window.open(url, '_blank');
      } else {
        window.open(item.product_url, '_blank');
      }
    } catch (error) {
      console.error('Buy on Taobao failed:', error);
      window.open(item.product_url, '_blank');
    } finally {
      setBuyingItem(null);
    }
  };

  // 按店铺分组
  const groupedItems = items.reduce((groups, item) => {
    const shop = item.shop_name || 'Unknown Shop';
    if (!groups[shop]) {
      groups[shop] = [];
    }
    groups[shop].push(item);
    return groups;
  }, {} as Record<string, SourcingItem[]>);

  if (loading) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="h-full bg-gray-50 flex flex-col items-center justify-center p-4">
        <ShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
        <p className="text-gray-500 mb-4">{text.empty}</p>
        <button
          onClick={() => router.push('/tools/search-source')}
          className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600"
        >
          {text.startSourcing}
        </button>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">{text.title}</h1>
          <span className="text-sm text-gray-400">({items.length})</span>
        </div>
        
        <div className="flex items-center gap-2">
          {selectedItems.size > 0 && (
            <button
              onClick={deleteSelected}
              className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg"
            >
              {text.delete}
            </button>
          )}
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
          >
            {selectedItems.size === items.length ? (
              <CheckSquare className="w-4 h-4 text-blue-500" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            <span>{text.selectAll}</span>
          </button>
        </div>
      </div>

      {/* Items List - Grouped by Shop */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-3 py-4 space-y-4">
          {Object.entries(groupedItems).map(([shopName, shopItems]) => (
            <div key={shopName} className="bg-white rounded-xl border overflow-hidden">
              {/* Shop Header */}
              <div className="px-3 py-2.5 border-b bg-gray-50 flex items-center gap-2">
                <Store className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">{shopName}</span>
              </div>
              
              {/* Items */}
              <div className="divide-y divide-gray-100">
                {shopItems.map(item => (
                  <div
                    key={item.id}
                    className={`p-3 flex gap-3 ${
                      selectedItems.has(item.id) ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleSelection(item.id)}
                      className="flex-shrink-0 self-center"
                    >
                      {selectedItems.has(item.id) ? (
                        <CheckSquare className="w-5 h-5 text-blue-500" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-300" />
                      )}
                    </button>
                    
                    {/* Image */}
                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150x150?text=No+Image';
                        }}
                      />
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm text-gray-800 line-clamp-2 leading-snug">
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
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Shop Action Bar */}
              <div className="px-3 py-2.5 border-t bg-gray-50 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {shopItems.length} {text.items}
                </span>
                <button
                  onClick={() => handleBuyOnTaobao(shopItems[0])}
                  disabled={buyingItem === shopItems[0].id}
                  className="px-4 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{buyingItem === shopItems[0].id ? '...' : text.buyOnTaobao}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="bg-white border-t px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-1.5 text-sm text-gray-600"
          >
            {selectedItems.size === items.length ? (
              <CheckSquare className="w-5 h-5 text-blue-500" />
            ) : (
              <Square className="w-5 h-5 text-gray-300" />
            )}
            <span>{text.selectAll}</span>
          </button>
          <span className="text-sm text-gray-400">
            {text.total} {selectedItems.size} {text.items}
          </span>
        </div>
        
        <button
          onClick={generatePdf}
          disabled={generatingPdf || selectedItems.size === 0}
          className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 flex items-center gap-2 font-medium"
        >
          <FileText className="w-4 h-4" />
          <span>{generatingPdf ? '...' : text.generatePdf}</span>
        </button>
      </div>
    </div>
  );
}
