'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ShoppingCart, Store, Tag, Truck, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';
import { getSupabaseBrowserClient } from '@/lib/supabase';

interface ProductModalProps {
  productId: string;
  lang?: string;
  onClose: () => void;
}

export default function ProductModal({ productId, lang: propLang, onClose }: ProductModalProps) {
  const router = useRouter();
  const { lang: contextLang } = useLanguage();
  const lang = propLang || contextLang;
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // 翻译（使用 useTranslation Hook）
  const { translatedItems: translatedProduct, loading: translateLoading } = useTranslation(
    product ? [product] : [],
    lang,
    ['title', 'desc', 'seller_nick', 'shop_name']
  );
  
  const displayProduct = translatedProduct[0] || product;

  // 获取用户登录状态
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }: any) => setUser(data.user));
  }, []);

  // 加载商品详情（sessionStorage 优先 + API 兜底）
  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    setError('');
    
    console.log(`[ProductModal] 加载商品, ID: ${productId}, 语言: ${lang}`);
    
    const loadDetail = async () => {
      // 1. 先尝试从 sessionStorage 读取（搜索页点击时存储的）
      try {
        const cached = sessionStorage.getItem('currentProduct');
        if (cached) {
          const cachedProduct = JSON.parse(cached);
          if (cachedProduct.id === productId || cachedProduct.goodsId === productId) {
            console.log('[ProductModal] 从 sessionStorage 读取成功');
            setProduct(cachedProduct);
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn('[ProductModal] sessionStorage 读取失败:', e);
      }
      
      // 2. 兜底：调后端 API（Phase 1 已瘦身，返回全量中文数据）
      try {
        const res = await fetch('/api/product-detail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ num_iid: productId })
        });
        
        const data = await res.json();
        console.log('[ProductModal] API 返回:', data);
        
        if (data.success && data.data) {
          setProduct(data.data);
        } else {
          setError('产品加载失败: ' + (data.error || data.details || '未知错误'));
        }
      } catch (e) {
        console.error('[ProductModal] API 错误:', e);
        setError('网络错误: ' + (e as Error).message);
      } finally {
        setLoading(false);
      }
    };
    
    loadDetail();
  }, [productId, lang]);

  // 图片列表（主图 + 详情图）
  const images = displayProduct 
    ? [
        displayProduct.pic || displayProduct.mainPic,
        ...(displayProduct.item_imgs || []).map((img: any) => typeof img === 'string' ? img : img.url),
        ...(displayProduct.desc_imgs || []).map((img: any) => typeof img === 'string' ? img : img.url)
      ].filter(Boolean)
    : [];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (loading || translateLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">加载中...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !displayProduct) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4">
          <div className="text-red-500 text-center">{error || '产品不存在'}</div>
          <button 
            onClick={onClose}
            className="mt-4 w-full py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            关闭
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* 顶部栏 */}
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold">产品详情</h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 左侧：图片展示 */}
            <div>
              <div className="relative aspect-square w-full bg-gray-100 rounded-xl overflow-hidden">
                {images.length > 0 && (
                  <>
                    <img 
                      src={images[currentImageIndex]?.replace('http://', 'https://')} 
                      alt={displayProduct.title || displayProduct.dtitle}
                      className="w-full h-full object-contain"
                    />
                    
                    {images.length > 1 && (
                      <>
                        <button 
                          onClick={prevImage}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 hover:bg-white"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={nextImage}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 hover:bg-white"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                        
                        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                          {images.map((_: any, i: number) => (
                            <button
                              key={i}
                              onClick={() => setCurrentImageIndex(i)}
                              className={`w-2 h-2 rounded-full ${i === currentImageIndex ? 'bg-orange-500' : 'bg-gray-300'}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
              
              {/* 缩略图 */}
              {images.length > 1 && (
                <div className="flex gap-2 mt-4 overflow-x-auto">
                  {images.map((img: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImageIndex(i)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${i === currentImageIndex ? 'border-orange-500' : 'border-transparent'}`}
                    >
                      <img src={img.replace('http://', 'https://')} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 右侧：信息展示（充分利用全量数据） */}
            <div>
              {/* 标题 */}
              <h1 className="text-2xl font-bold mb-4">{displayProduct.title || displayProduct.dtitle}</h1>
              
              {/* 价格信息 */}
              <div className="mb-6 p-4 bg-red-50 rounded-xl">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl text-red-600 font-bold">¥{displayProduct.actualPrice || displayProduct.zkFinalPrice || displayProduct.price}</span>
                  {(displayProduct.yuanjia || displayProduct.originalPrice) && (displayProduct.yuanjia || displayProduct.originalPrice) > (displayProduct.actualPrice || 0) && (
                    <span className="text-gray-400 line-through">¥{displayProduct.yuanjia || displayProduct.originalPrice}</span>
                  )}
                </div>
                
                {/* 优惠券信息 */}
                {(displayProduct.couponInfo || displayProduct.coupon) && (
                  <div className="mt-2 text-sm text-orange-600">
                    <Tag className="w-4 h-4 inline mr-1" />
                    优惠券: {displayProduct.couponInfo || displayProduct.coupon}
                  </div>
                )}
              </div>

              {/* 销量和店铺信息 */}
              <div className="mb-6 space-y-2 text-gray-600">
                {(displayProduct.monthSales || displayProduct.sales) && (
                  <p>📊 月销 {(displayProduct.monthSales || displayProduct.sales).toLocaleString()}+</p>
                )}
                
                {(displayProduct.seller_nick || displayProduct.shop_name || displayProduct.shop) && (
                  <p className="flex items-center gap-1">
                    <Store className="w-4 h-4" />
                    {displayProduct.seller_nick || displayProduct.shop_name || displayProduct.shop}
                  </p>
                )}
                
                {displayProduct.brandName && (
                  <p>🏷️ 品牌: {displayProduct.brandName}</p>
                )}
              </div>

              {/* SKU 规格参数（如果有） */}
              {displayProduct.skus && displayProduct.skus.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">规格选择</h3>
                  <div className="flex flex-wrap gap-2">
                    {displayProduct.skus.map((sku: any, i: number) => (
                      <button
                        key={i}
                        className="px-3 py-1 border rounded-lg text-sm hover:border-orange-500 hover:text-orange-600"
                      >
                        {sku.properties_name || sku.props_name || `规格${i+1}`}
                        {sku.price && <span className="ml-1 text-orange-600">¥{sku.price}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 商品属性（如果有） */}
              {displayProduct.props && displayProduct.props.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">商品属性</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {displayProduct.props.map((prop: any, i: number) => (
                      <div key={i} className="flex gap-1">
                        <span className="text-gray-500">{prop.name}:</span>
                        <span>{prop.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 商品描述 */}
              {displayProduct.desc && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">商品描述</h3>
                  <p className="text-gray-700 leading-relaxed">{displayProduct.desc}</p>
                </div>
              )}

              {/* 服务信息 */}
              <div className="mb-6 flex flex-wrap gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Truck className="w-4 h-4" />
                  快递包邮
                </span>
                <span className="flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  正品保障
                </span>
              </div>
            </div>
          </div>

          {/* 底部操作栏 */}
          <div className="sticky bottom-0 bg-white border-t p-4 flex gap-4">
            <button
              onClick={() => {
                // 加入清单（简化版，实际需要调 /api/sourcing-items）
                alert('加入清单功能（待完善）');
              }}
              className="flex-1 bg-orange-500 text-white py-3 rounded-xl hover:bg-orange-600 font-semibold flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              加入清单
            </button>
            
            {(displayProduct.itemLink || displayProduct.link) && (
              <a
                href={displayProduct.itemLink || displayProduct.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-red-500 text-white py-3 rounded-xl hover:bg-red-600 font-semibold text-center"
              >
                去淘宝购买
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
