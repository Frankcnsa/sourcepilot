'use client';

import { useState, useEffect } from 'react';
import { Trash2, FileText, ChevronLeft, CheckSquare, Square, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';

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

interface User {
  email?: string;
  id: string;
}

export default function SourcingListPage({ user }: { user: User }) {
  const router = useRouter();
  const [items, setItems] = useState<SourcingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');

  // 翻译文本
  const t = {
    en: {
      title: 'Sourcing List',
      back: 'Back',
      empty: 'Your sourcing list is empty',
      startSourcing: 'Start Sourcing',
      selectAll: 'Select All',
      delete: 'Delete',
      generatePdf: 'Generate PDF Report',
      price: 'Price',
      shop: 'Shop',
      added: 'Added',
      sendTo: 'Send to',
      pdfSent: 'PDF sent to your email!',
      selectItems: 'Please select items first'
    },
    zh: {
      title: '采购清单',
      back: '返回',
      empty: '您的采购清单为空',
      startSourcing: '开始采购',
      selectAll: '全选',
      delete: '删除',
      generatePdf: '生成PDF报告',
      price: '价格',
      shop: '店铺',
      added: '添加时间',
      sendTo: '发送至',
      pdfSent: 'PDF已发送到您的邮箱！',
      selectItems: '请先选择商品'
    },
    ar: {
      title: 'قائمة المصادر',
      back: 'رجوع',
      empty: 'قائمة المصادر فارغة',
      startSourcing: 'ابدأ الت sourcing',
      selectAll: 'اختر الكل',
      delete: 'حذف',
      generatePdf: 'إنشاء تقرير PDF',
      price: 'السعر',
      shop: 'المتجر',
      added: 'تاريخ الإضافة',
      sendTo: 'إرسال إلى',
      pdfSent: 'تم إرسال PDF إلى بريدك الإلكتروني!',
      selectItems: 'الرجاء اختيار العناصر أولاً'
    },
    ru: {
      title: 'Список закупок',
      back: 'Назад',
      empty: 'Ваш список закупок пуст',
      startSourcing: 'Начать закупку',
      selectAll: 'Выбрать все',
      delete: 'Удалить',
      generatePdf: 'Создать PDF отчет',
      price: 'Цена',
      shop: 'Магазин',
      added: 'Добавлено',
      sendTo: 'Отправить',
      pdfSent: 'PDF отправлен на ваш email!',
      selectItems: 'Пожалуйста, сначала выберите товары'
    },
    es: {
      title: 'Lista de abastecimiento',
      back: 'Volver',
      empty: 'Su lista de abastecimiento está vacía',
      startSourcing: 'Iniciar abastecimiento',
      selectAll: 'Seleccionar todo',
      delete: 'Eliminar',
      generatePdf: 'Generar informe PDF',
      price: 'Precio',
      shop: 'Tienda',
      added: 'Añadido',
      sendTo: 'Enviar a',
      pdfSent: '¡PDF enviado a su correo!',
      selectItems: 'Por favor, seleccione artículos primero'
    }
  };

  const text = t[currentLang as keyof typeof t] || t.en;

  // 加载采购清单
  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/sourcing-items');
      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
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
    for (const id of selectedItems) {
      await deleteItem(id);
    }
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
          to: user.email,
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
      alert('Failed to generate PDF');
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <span className="text-gray-500">Loading...</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-500 mb-4">{text.empty}</p>
          <button
            onClick={() => router.push('/tools/search-source')}
            className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
          >
            {text.startSourcing}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/tools/search-source')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>{text.back}</span>
            </button>
            <h1 className="text-xl font-semibold text-gray-900">{text.title}</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
            >
              {selectedItems.size === items.length ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              <span>{text.selectAll}</span>
            </button>
            
            {selectedItems.size > 0 && (
              <button
                onClick={deleteSelected}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{text.delete}</span>
              </button>
            )}
            
            <button
              onClick={generatePdf}
              disabled={generatingPdf || selectedItems.size === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {generatingPdf ? (
                <span>...</span>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>{text.generatePdf}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Items List */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-4">
          {items.map(item => (
            <div
              key={item.id}
              className={`bg-white border rounded-xl p-4 flex gap-4 ${
                selectedItems.has(item.id) ? 'border-blue-500 bg-blue-50' : ''
              }`}
            >
              <button
                onClick={() => toggleSelection(item.id)}
                className="flex-shrink-0"
              >
                {selectedItems.has(item.id) ? (
                  <CheckSquare className="w-5 h-5 text-blue-600" />
                ) : (
                  <Square className="w-5 h-5 text-gray-400" />
                )}
              </button>
              
              <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 line-clamp-2">
                  {item.title}
                </h3>
                <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                  <span className="text-lg font-bold text-red-600">
                    ¥{item.price}
                  </span>
                  <span>|</span>
                  <span>{text.shop}: {item.shop_name}</span>
                </div>
                <div className="mt-1 text-xs text-gray-400">
                  {text.added}: {new Date(item.created_at).toLocaleDateString()}
                </div>
              </div>
              
              <button
                onClick={() => deleteItem(item.id)}
                className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
        
        {/* PDF Info */}
        {selectedItems.size > 0 && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <Send className="w-4 h-4" />
              <span>
                {text.sendTo}: {user.email || 'your email'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
