'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Paperclip, Image as ImageIcon, Menu, X, FileText } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  sender?: 'frank' | 'grace';
  content: string;
  image?: string;
  pdf?: { name: string; data: string };
  timestamp: Date;
}

interface Product {
  product_name: string;
  vehicle_model?: string;
  specifications?: string;
  quantity: string;
  budget?: string;
  delivery_time?: string;
  certifications?: string;
  images?: string[];
}

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [graceThreadId, setGraceThreadId] = useState<string>('');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [pendingPdf, setPendingPdf] = useState<{ name: string; data: string } | null>(null);
  const [activeRole, setActiveRole] = useState<'grace' | 'frank'>('grace');
  const [conversationId, setConversationId] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  const [awaitingDestination, setAwaitingDestination] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // 检测用户登录状态
  useEffect(() => {
    const checkUser = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.log('Not logged in');
      }
    };
    checkUser();
  }, []);

  // 获取当前语言（根据当前消息实时检测，用户可能混用多语言）
  const getCurrentLocale = () => {
    const lastUserMessage = messages
      .filter(m => m.role === 'user')
      .pop()?.content || '';
    
    // 检测中文字符
    const hasChinese = /[\u4e00-\u9fa5]/.test(lastUserMessage);
    
    // 检测阿拉伯语
    const hasArabic = /[\u0600-\u06FF]/.test(lastUserMessage);
    
    // 检测俄语/西里尔字母
    const hasRussian = /[\u0400-\u04FF]/.test(lastUserMessage);
    
    if (hasChinese) return 'zh';
    if (hasArabic) return 'ar';
    if (hasRussian) return 'ru';
    return 'en';
  };

  // 开场白
  useEffect(() => {
    if (messages.length === 0) {
      const frankMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        sender: 'frank',
        content: "Hi there! I'm Frank, your sourcing consultant. This is my assistant Grace, she'll help you organize your requirements first.\n\nGrace, say hi to the boss!",
        timestamp: new Date(),
      };
      setMessages([frankMsg]);
      
      setTimeout(() => {
        const graceMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          sender: 'grace',
          content: "Hi boss! I'm Grace, Frank's assistant～ 😊\n\nI'll help you organize your sourcing requirements. What product are you looking for? If you have product images, please feel free to upload them - it will help us search more accurately!",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, graceMsg]);
      }, 1000);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() && !pendingImage && !pendingPdf) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      image: pendingImage || undefined,
      pdf: pendingPdf || undefined,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setPendingImage(null);
    setPendingPdf(null);
    setIsLoading(true);

    try {
      if (activeRole === 'grace') {
        // Grace 模式
        const graceResponse = await fetch('/api/grace/bailian', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: inputValue,
            image: pendingImage || undefined,
            locale: getCurrentLocale(),
            threadId: graceThreadId,
            conversationId: conversationId || undefined,
            allProducts: allProducts,
          }),
        });

        if (!graceResponse.ok) {
          throw new Error('Grace API error');
        }

        const graceData = await graceResponse.json();
        
        if (graceData.threadId) {
          setGraceThreadId(graceData.threadId);
        }
        
        // 更新产品列表
        if (graceData.allProducts) {
          setAllProducts(graceData.allProducts);
        }
        
        // Grace 回复
        const graceMsg: Message = {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          sender: 'grace',
          content: graceData.reply || 'I see. Tell me more about your requirements.',
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, graceMsg]);
        
        if (graceData.conversationId) {
          setConversationId(graceData.conversationId);
        }
        
        // 检查是否应该切换给 Frank
        if (graceData.status === 'ready_for_sourcing') {
          // Grace 转交
          setTimeout(() => {
            const handoverMsg: Message = {
              id: (Date.now() + 3).toString(),
              role: 'assistant',
              sender: 'grace',
              content: "Boss, I've collected all your requirements! Let me get Frank to help you with the sourcing analysis.",
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, handoverMsg]);
            setActiveRole('frank');
            
            // Frank 接管
            setTimeout(() => {
              const hasChinese = /[\u4e00-\u9fa5]/.test(userMessage.content);
              const products = graceData.allProducts || allProducts;
              
              let frankReply: string;
              if (hasChinese) {
                frankReply = "您好！根据 Grace 的汇报，我已为您整理以下采购需求：\n\n";
                products.forEach((p: Product, idx: number) => {
                  frankReply += `${idx + 1}. ${p.product_name}\n`;
                  frankReply += `   数量：${p.quantity}\n`;
                  if (p.specifications) frankReply += `   规格：${p.specifications}\n`;
                  if (p.budget) frankReply += `   预算：${p.budget}\n`;
                  frankReply += "\n";
                });
                frankReply += "📦 请问您的货物需要发往哪个国家/地区？\n\n";
                frankReply += "了解目的地后，我可以为您提供更准确的运输建议和成本评估。";
              } else {
                frankReply = "Hi! Based on Grace's summary, here's your sourcing request:\n\n";
                products.forEach((p: Product, idx: number) => {
                  frankReply += `${idx + 1}. ${p.product_name}\n`;
                  frankReply += `   Quantity: ${p.quantity}\n`;
                  if (p.specifications) frankReply += `   Specs: ${p.specifications}\n`;
                  if (p.budget) frankReply += `   Budget: ${p.budget}\n`;
                  frankReply += "\n";
                });
                frankReply += "📦 Which country/region do you need the goods shipped to?\n\n";
                frankReply += "Knowing the destination helps me provide accurate shipping advice and cost estimates.";
              }
              
              const frankMsg: Message = {
                id: (Date.now() + 4).toString(),
                role: 'assistant',
                sender: 'frank',
                content: frankReply,
                timestamp: new Date(),
              };
              
              setMessages(prev => [...prev, frankMsg]);
              setAwaitingDestination(true);
            }, 1000);
          }, 1000);
        }
        
      } else if (awaitingDestination) {
        // Frank 询问目的地后的处理
        const destination = inputValue;
        const hasChinese = /[\u4e00-\u9fa5]/.test(destination);
        const isOutsideChina = !destination.toLowerCase().includes('china') && 
                               !destination.toLowerCase().includes('中国');
        
        let frankReply: string;
        
        if (isOutsideChina) {
          // 计算总数量/重量（简化逻辑）
          const totalProducts = allProducts.length;
          const hasChinese = /[\u4e00-\u9fa5]/.test(inputValue);
          
          if (hasChinese) {
            frankReply = `收到！目的地：${destination}\n\n`;
            frankReply += "⚠️ **运输提示**：\n\n";
            
            if (totalProducts === 1) {
              frankReply += "由于您目前只采购单一产品，如果数量较少，国际运输可能会比较繁琐且成本较高。\n\n";
              frankReply += "💡 **建议**：您可以考虑多采购几种不同的产品，凑够一定重量（建议2公斤以上）后选择集运服务，这样可以大幅降低运费成本。\n\n";
              frankReply += "我们也有合作的集运服务商可以推荐给您。\n\n";
            } else {
              frankReply += "您采购了多种产品，建议确认总重量是否超过2公斤。\n";
              frankReply += "• 2公斤以上：集运服务比较划算\n";
              frankReply += "• 2公斤以下：运费成本相对较高，建议适当增加采购量\n\n";
              frankReply += "我们可以为您推荐合适的集运服务商。\n\n";
            }
            
            frankReply += "---\n\n";
            frankReply += "✅ 我现在为您生成《寻源需求分析报告》：\n\n";
            frankReply += "📧 报告将以邮件形式发送到您的邮箱，请注意查收\n";
            frankReply += "💰 本次服务收费：0 Credits\n\n";
            frankReply += "📋 **报告将包含**：\n";
            frankReply += "• 供应商匹配建议\n";
            frankReply += "• 出厂价参考（不含运费、税费、关税等）\n";
            frankReply += "• 运输方案建议\n\n";
            frankReply += "请确认是否继续？";
          } else {
            frankReply = `Got it! Destination: ${destination}\n\n`;
            frankReply += "⚠️ **Shipping Notice**: \n\n";
            
            if (totalProducts === 1) {
              frankReply += "Since you're sourcing a single product type, if the quantity is small, international shipping may be complicated and costly.\n\n";
              frankReply += "💡 **Suggestion**: Consider sourcing multiple different products to reach a combined weight of 2kg or more. This makes consolidation shipping much more cost-effective.\n\n";
              frankReply += "We can also recommend our partnered consolidation shipping providers.\n\n";
            } else {
              frankReply += "You're sourcing multiple products. Please check if the total weight exceeds 2kg.\n";
              frankReply += "• Over 2kg: Consolidation shipping is cost-effective\n";
              frankReply += "• Under 2kg: Shipping costs are relatively high, consider increasing order volume\n\n";
              frankReply += "We can recommend suitable consolidation shipping services.\n\n";
            }
            
            frankReply += "---\n\n";
            frankReply += "✅ I'm now generating your Sourcing Requirements Analysis Report:\n\n";
            frankReply += "📧 The report will be sent to your email\n";
            frankReply += "💰 Service fee: 0 Credits\n\n";
            frankReply += "📋 **Report includes**: \n";
            frankReply += "• Supplier matching suggestions\n";
            frankReply += "• Factory price reference (excl. shipping, taxes, duties)\n";
            frankReply += "• Shipping recommendations\n\n";
            frankReply += "Please confirm to proceed?";
          }
        } else {
          // 发往中国境内
          if (hasChinese) {
            frankReply = `收到！目的地：${destination}\n\n`;
            frankReply += "✅ 我现在为您生成《寻源需求分析报告》：\n\n";
            frankReply += "📧 报告将以邮件形式发送到您的邮箱，请注意查收\n";
            frankReply += "💰 本次服务收费：0 Credits\n\n";
            frankReply += "📋 **报告将包含**：\n";
            frankReply += "• 供应商匹配建议\n";
            frankReply += "• 出厂价参考（不含运费、税费等）\n";
            frankReply += "• 物流配送方案\n\n";
            frankReply += "请确认是否继续？";
          } else {
            frankReply = `Got it! Destination: ${destination}\n\n`;
            frankReply += "✅ I'm now generating your Sourcing Requirements Analysis Report:\n\n";
            frankReply += "📧 The report will be sent to your email\n";
            frankReply += "💰 Service fee: 0 Credits\n\n";
            frankReply += "📋 **Report includes**: \n";
            frankReply += "• Supplier matching suggestions\n";
            frankReply += "• Factory price reference (excl. shipping, taxes)\n";
            frankReply += "• Logistics recommendations\n\n";
            frankReply += "Please confirm to proceed?";
          }
        }
        
        const frankMsg: Message = {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          sender: 'frank',
          content: frankReply,
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, frankMsg]);
        setAwaitingDestination(false);
        
      } else {
        // 普通 Frank 对话
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...messages, userMessage].map(m => ({
              role: m.role,
              content: m.content,
            })),
            sessionId,
            role: 'frank',
          }),
        });

        const data = await response.json();
        
        const aiMessage: Message = {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          sender: 'frank',
          content: data.response || data.choices?.[0]?.message?.content || 'Sorry, I could not process that.',
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, aiMessage]);
        if (data.sessionId) setSessionId(data.sessionId);
      }
      
    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        sender: activeRole,
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setSessionId('');
    setGraceThreadId('');
    setAllProducts([]);
    setConversationId('');
    setActiveRole('grace');
    setAwaitingDestination(false);
    
    setTimeout(() => {
      const frankMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        sender: 'frank',
        content: "Hi there! I'm Frank, your sourcing consultant. This is my assistant Grace, she'll help you organize your requirements first.\n\nGrace, say hi to the boss!",
        timestamp: new Date(),
      };
      setMessages([frankMsg]);
      setTimeout(() => {
        const graceMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          sender: 'grace',
          content: "Hi boss! I'm Grace, Frank's assistant～ 😊\n\nI'll help you organize your sourcing requirements. What product are you looking for? If you have product images, please feel free to upload them - it will help us search more accurately!",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, graceMsg]);
      }, 1000);
    }, 100);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setPendingImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('Please select a PDF file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('PDF size should be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setPendingPdf({
        name: file.name,
        data: event.target?.result as string
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removePendingImage = () => setPendingImage(null);
  const removePendingPdf = () => setPendingPdf(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-screen bg-white">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        isMobile={isMobile}
        onNewChat={handleNewChat}
      />
      
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu size={20} className="text-gray-600" />
            </button>
            <Link href="/" className="flex items-center gap-2">
              <Image 
                src="/sourcepilot_logo_transparent.png" 
                alt="SourcePilot" 
                width={28} 
                height={28}
                className="rounded-lg"
              />
              <span className="text-lg font-semibold text-gray-800">SourcePilot</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-2">
            <Link 
              href="/register"
              className="px-4 py-2 text-sm bg-[#4F6DF5] hover:bg-[#4353C7] text-white rounded-xl transition-colors font-medium"
            >
              Get Started
            </Link>
            <Link 
              href="/login"
              className="px-4 py-2 text-sm text-[#4F6DF5] hover:bg-blue-50 rounded-xl transition-colors font-medium"
            >
              Log In
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-[#4F6DF5] text-white'
                      : message.sender === 'grace'
                      ? 'bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-100 text-gray-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {message.role === 'assistant' && message.sender && (
                    <div className="flex items-center gap-2 mb-2">
                      {message.sender === 'frank' ? (
                        <>
                          <div className="w-7 h-7 rounded-full overflow-hidden bg-[#4F6DF5]">
                            <Image 
                              src="/frank-avatar.png" 
                              alt="Frank" 
                              width={28} 
                              height={28}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="text-xs font-medium text-[#4F6DF5]">Frank</span>
                        </>
                      ) : (
                        <>
                          <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-br from-pink-400 to-purple-500">
                            <Image 
                              src="/grace-avatar.png" 
                              alt="Grace" 
                              width={28} 
                              height={28}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="text-xs font-medium text-purple-600">Grace</span>
                        </>
                      )}
                    </div>
                  )}
                  
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  
                  {message.image && (
                    <div className="mt-2">
                      <img 
                        src={message.image} 
                        alt="Uploaded" 
                        className="max-w-full max-h-48 rounded-lg object-contain"
                      />
                    </div>
                  )}
                  
                  {message.pdf && (
                    <div className="mt-2 flex items-center gap-2 text-sm opacity-90">
                      <FileText size={16} />
                      <span>{message.pdf.name}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-4 py-3 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="w-full max-w-3xl mx-auto px-4 sm:px-0 pb-6 sm:pb-6">
          {(pendingImage || pendingPdf) && (
            <div className="flex gap-2 mb-3 px-1">
              {pendingImage && (
                <div className="relative">
                  <img 
                    src={pendingImage} 
                    alt="Pending" 
                    className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                  />
                  <button 
                    onClick={removePendingImage}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              {pendingPdf && (
                <div className="relative flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                  <FileText size={16} className="text-gray-600" />
                  <span className="text-sm text-gray-700">{pendingPdf.name}</span>
                  <button 
                    onClick={removePendingPdf}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          )}
          
          <div className="relative bg-white border border-gray-200 rounded-[24px] sm:rounded-[32px] shadow-[0_4px_20px_rgb(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-shadow">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={activeRole === 'grace' ? "Describe what you're looking for, or upload images..." : "How can I help you, Boss?"}
              disabled={isLoading}
              className="w-full px-4 sm:px-6 pt-4 sm:pt-5 pb-14 sm:pb-16 bg-transparent outline-none resize-none text-gray-700 placeholder-gray-400 text-base disabled:opacity-50"
              rows={isMobile ? 2 : 2}
            />
            
            <div className="absolute bottom-2.5 sm:bottom-3 left-3 sm:left-4 right-3 sm:right-4 flex items-center justify-between">
              <div className="flex items-center gap-0.5 sm:gap-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".pdf"
                  className="hidden"
                />
                <input
                  type="file"
                  ref={imageInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                />
                
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors" 
                  title="Attach PDF"
                >
                  <Paperclip size={isMobile ? 18 : 20} className="text-gray-400" />
                </button>
                <button 
                  onClick={() => imageInputRef.current?.click()}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors" 
                  title="Upload image"
                >
                  <ImageIcon size={isMobile ? 18 : 20} className="text-gray-400" />
                </button>
              </div>
              
              <button 
                onClick={handleSend}
                disabled={(!inputValue.trim() && !pendingImage && !pendingPdf) || isLoading}
                className="p-2 sm:p-2.5 bg-[#4F6DF5] hover:bg-[#4353C7] disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full transition-colors shadow-sm"
              >
                <Send size={isMobile ? 16 : 18} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
