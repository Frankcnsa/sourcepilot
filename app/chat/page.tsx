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

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [graceThreadId, setGraceThreadId] = useState<string>('');
  const [graceCollectedInfo, setGraceCollectedInfo] = useState<Record<string, string>>({});
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [pendingPdf, setPendingPdf] = useState<{ name: string; data: string } | null>(null);
  const [activeRole, setActiveRole] = useState<'grace' | 'frank'>('grace');
  const [conversationId, setConversationId] = useState<string>('');
  const [user, setUser] = useState<any>(null); // 当前登录用户
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

  // 获取当前语言（根据用户输入检测）
  const getCurrentLocale = () => {
    // 检测最后一条用户消息是否包含中文
    const lastUserMessage = messages
      .filter(m => m.role === 'user')
      .pop()?.content || '';
    
    // 如果有中文字符，返回 'zh'，否则 'en'
    const hasChinese = /[\u4e00-\u9fa5]/.test(lastUserMessage);
    return hasChinese ? 'zh' : 'en';
  };

  // 开场白
  useEffect(() => {
    if (messages.length === 0) {
      // Frank 开场
      const frankMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        sender: 'frank',
        content: "Hi there! I'm Frank, your sourcing consultant. This is my assistant Grace, she'll help you organize your requirements first.\n\nGrace, say hi to the boss!",
        timestamp: new Date(),
      };
      setMessages([frankMsg]);
      
      // 1秒后 Grace 打招呼
      setTimeout(() => {
        const graceMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          sender: 'grace',
          content: "Hi boss! I'm Grace, Frank's assistant～ 😊\n\nI'll help you organize your sourcing requirements. Tell me:\n• What product are you looking for?\n• What's the approximate quantity?\n• Any special requirements?\n\nI'll take notes and report to Frank!",
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

  // 检测是否应该切换给 Frank
  const shouldSwitchToFrank = (userMessages: Message[], graceStatus?: string): boolean => {
    // 如果 Grace 返回 ready_for_sourcing，切换到 Frank
    if (graceStatus === 'ready_for_sourcing') return true;
    
    // 已登录用户：不限制轮数，只有当 Grace 说收集完成才切换
    if (user) return false;
    
    // 未登录用户：3轮对话后强制切换，或用户明确说"report"、"frank"等
    const count = userMessages.length;
    const lastMessage = userMessages[userMessages.length - 1]?.content.toLowerCase() || '';
    return count >= 3 || lastMessage.includes('report') || lastMessage.includes('frank') || lastMessage.includes('generate');
  };

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
      // 检查是否应该切换给 Frank
      const userMessages = [...messages.filter(m => m.role === 'user'), userMessage];
      
      if (activeRole === 'grace') {
        // 调用 Grace 的百炼 API
        const graceResponse = await fetch('/api/grace/bailian', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: inputValue,
            locale: getCurrentLocale(),
            threadId: graceThreadId,
            conversationId: conversationId || undefined,
          }),
        });

        if (!graceResponse.ok) {
          throw new Error('Grace API error');
        }

        const graceData = await graceResponse.json();
        
        // 保存 threadId 用于后续对话
        if (graceData.threadId) {
          setGraceThreadId(graceData.threadId);
        }
        
        // 保存收集到的信息
        if (graceData.collectedInfo) {
          setGraceCollectedInfo(graceData.collectedInfo);
        }
        
        // 检查是否应该切换给 Frank
        const switchToFrank = shouldSwitchToFrank(userMessages, graceData.status);
        
        if (switchToFrank && graceData.status === 'ready_for_sourcing') {
          // Grace 先说转交语
          const handoverMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            sender: 'grace',
            content: graceData.reply || "Boss, I've got all your requirements! Let me get Frank for professional sourcing advice.",
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, handoverMsg]);
          setActiveRole('frank');
          
          // 保存 conversationId
          if (graceData.conversationId) {
            setConversationId(graceData.conversationId);
          }
          
          // 生成 Frank 的确认消息（基于收集的信息）
          const collectedInfo = graceData.collectedInfo || {};
          const hasChinese = /[\u4e00-\u9fa5]/.test(userMessage.content);
          
          let frankReply: string;
          if (hasChinese) {
            frankReply = `好的，根据 Grace 的汇报，您的需求如下：\n\n` +
              `• 产品：${collectedInfo.product_name || '待确认'}\n` +
              `${collectedInfo.vehicle_model ? `• 适用车型：${collectedInfo.vehicle_model}\n` : ''}` +
              `${collectedInfo.specifications ? `• 规格：${collectedInfo.specifications}\n` : ''}` +
              `• 数量：${collectedInfo.quantity || '待确认'}\n` +
              `${collectedInfo.budget ? `• 预算：${collectedInfo.budget}\n` : ''}` +
              `${collectedInfo.delivery_time ? `• 交货期：${collectedInfo.delivery_time}\n` : ''}` +
              `${collectedInfo.certifications ? `• 认证：${collectedInfo.certifications}\n` : ''}` +
              `\n我现在为您组织安排《寻源需求分析报告》，报告将以邮件形式发送到您的邮箱，请注意查收。` +
              `\n\n💰 本次报告收费：0 Credits\n\n请确认是否继续？`;
          } else {
            frankReply = `Got it! Based on Grace's summary, here are your requirements:\n\n` +
              `• Product: ${collectedInfo.product_name || 'To be confirmed'}\n` +
              `${collectedInfo.vehicle_model ? `• Vehicle Model: ${collectedInfo.vehicle_model}\n` : ''}` +
              `${collectedInfo.specifications ? `• Specifications: ${collectedInfo.specifications}\n` : ''}` +
              `• Quantity: ${collectedInfo.quantity || 'To be confirmed'}\n` +
              `${collectedInfo.budget ? `• Budget: ${collectedInfo.budget}\n` : ''}` +
              `${collectedInfo.delivery_time ? `• Delivery Time: ${collectedInfo.delivery_time}\n` : ''}` +
              `${collectedInfo.certifications ? `• Certifications: ${collectedInfo.certifications}\n` : ''}` +
              `\nI'm now organizing your Sourcing Requirements Analysis Report. ` +
              `The report will be sent to your email. Please check your inbox.` +
              `\n\n💰 Cost: 0 Credits\n\nPlease confirm to proceed?`;
          }
          
          // Frank 接管消息
          const frankMsg: Message = {
            id: (Date.now() + 2).toString(),
            role: 'assistant',
            sender: 'frank',
            content: frankReply,
            timestamp: new Date(),
          };
          
          setMessages(prev => [...prev, frankMsg]);
          
        } else {
          // Grace 继续回复
          const graceMsg: Message = {
            id: (Date.now() + 2).toString(),
            role: 'assistant',
            sender: 'grace',
            content: graceData.reply || 'I see. Tell me more about your requirements.',
            timestamp: new Date(),
          };
          
          setMessages(prev => [...prev, graceMsg]);
          
          // 保存 conversationId
          if (graceData.conversationId) {
            setConversationId(graceData.conversationId);
          }
        }
        
      } else {
        // Frank 模式
        const userContent = userMessage.content.toLowerCase();
        const isConfirmed = userContent.includes('确认') || userContent.includes('好的') || 
                           userContent.includes('可以') || userContent.includes('yes') || 
                           userContent.includes('ok') || userContent.includes('sure') ||
                           userContent.includes('proceed') || userContent.includes('generate');
        
        if (isConfirmed && activeRole === 'frank') {
          // 用户确认后，Frank 生成报告并介绍后续服务
          const hasChinese = /[\u4e00-\u9fa5]/.test(userMessage.content);
          
          let frankReply: string;
          if (hasChinese) {
            frankReply = `✅ 收到！我正在为您生成《寻源需求分析报告》...\n\n` +
              `📧 报告将在 1-2 分钟内发送至您的邮箱，请留意查收。\n\n` +
              `---\n\n` +
              `💡 **后续我们还为您提供以下服务：**\n\n` +
              `1️⃣ **供应商深度评估报告** - 针对特定供应商的资质、产能、信誉全面评估\n` +
              `2️⃣ **样品检测报告** - 协助安排第三方检测，确保产品质量\n` +
              `3️⃣ **合同审核服务** - 专业法务团队审核采购合同条款\n` +
              `4️⃣ **物流方案咨询** - 最优运输方式和清关方案建议\n\n` +
              `📌 **温馨提示：**\n` +
              `请保存好我们发给您的报告，下次直接传给我们，我们可以继续为您提供服务！\n\n` +
              `有任何问题随时找我。祝采购顺利！🤝`;
          } else {
            frankReply = `✅ Got it! I'm generating your Sourcing Requirements Analysis Report...\n\n` +
              `📧 The report will be sent to your email within 1-2 minutes. Please check your inbox.\n\n` +
              `---\n\n` +
              `💡 **Additional Services We Offer:**\n\n` +
              `1️⃣ **Supplier Deep Dive Report** - Comprehensive assessment of specific suppliers' qualifications, capacity, and reputation\n` +
              `2️⃣ **Sample Inspection Service** - Third-party quality inspection coordination\n` +
              `3️⃣ **Contract Review Service** - Professional legal team review of procurement contracts\n` +
              `4️⃣ **Logistics Consulting** - Optimal shipping and customs clearance solutions\n\n` +
              `📌 **Pro Tip:**\n` +
              `Please save the reports we send you. Upload them to us next time, and we can continue serving you seamlessly!\n\n` +
              `Feel free to reach out anytime. Happy sourcing! 🤝`;
          }
          
          const frankMsg: Message = {
            id: (Date.now() + 2).toString(),
            role: 'assistant',
            sender: 'frank',
            content: frankReply,
            timestamp: new Date(),
          };
          
          setMessages(prev => [...prev, frankMsg]);
          
          // TODO: 触发后台异步任务生成 PDF 报告
          // - 查询供应商数据库
          // - Kimi 分析整理
          // - 生成 PDF
          // - Email 发送
          
        } else {
          // 普通 Frank 对话，调用 API
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
    setGraceCollectedInfo({});
    setConversationId('');
    setActiveRole('grace');
    // 重新触发开场白
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
          content: "Hi boss! I'm Grace, Frank's assistant～ 😊\n\nI'll help you organize your sourcing requirements. Tell me:\n• What product are you looking for?\n• What's the approximate quantity?\n• Any special requirements?\n\nI'll take notes and report to Frank!",
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
      setPendingPdf({ name: file.name, data: event.target?.result as string });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isMobile={isMobile} onNewChat={handleNewChat} />
      
      {sidebarOpen && isMobile && (
        <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(true)} className="p-1.5 -ml-1.5 hover:bg-gray-100 rounded-lg">
              <Menu size={20} className="text-gray-600" />
            </button>
            <div className="w-6 h-6 sm:w-7 sm:h-7 relative">
              <Image src="/sourcepilot-icon.png" alt="SourcePilot" fill className="object-contain" />
            </div>
            <span className="font-medium text-gray-800 text-sm hidden sm:inline">SourcePilot</span>
          </div>
          <Link href="/login" className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm text-[#4F6DF5] hover:bg-blue-50 rounded-xl transition-colors font-medium">Log In</Link>
        </div>

        <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-2.5 sm:gap-4 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center overflow-hidden ${
                message.role === 'user' 
                  ? 'bg-gradient-to-br from-[#4F6DF5] to-[#7B5CF5]' 
                  : message.sender === 'frank'
                    ? 'bg-[#E3F2FD]'
                    : 'bg-[#FCE4EC]'
              }`}>
                {message.role === 'user' ? (
                  <User size={14} className="text-white sm:w-4 sm:h-4" />
                ) : message.sender === 'frank' ? (
                  <Image src="/frank-avatar.png" alt="Frank" width={32} height={32} className="w-full h-full object-cover" />
                ) : (
                  <Image src="/grace-avatar.png" alt="Grace" width={32} height={32} className="w-full h-full object-cover" />
                )}
              </div>

              <div className={`flex-1 max-w-[85%] sm:max-w-[75%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`inline-block px-3.5 sm:px-4 py-2.5 sm:py-3 text-[15px] leading-relaxed whitespace-pre-wrap ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-[#4F6DF5] to-[#7B5CF5] text-white rounded-2xl rounded-tr-sm'
                    : message.sender === 'frank'
                      ? 'bg-[#E3F2FD] text-gray-700 rounded-2xl rounded-tl-sm border border-blue-100'
                      : 'bg-[#FCE4EC] text-gray-700 rounded-2xl rounded-tl-sm border border-pink-100'
                }`}>
                  {message.content}
                  {message.image && (
                    <div className="mt-2">
                      <img src={message.image} alt="Uploaded" className="max-w-[200px] max-h-[150px] rounded-lg object-cover" />
                    </div>
                  )}
                  {message.pdf && (
                    <div className="mt-2 flex items-center gap-2 bg-white/20 px-3 py-2 rounded-lg">
                      <FileText size={16} />
                      <span className="text-sm truncate max-w-[150px]">{message.pdf.name}</span>
                    </div>
                  )}
                </div>
                <div className={`text-[11px] sm:text-xs text-gray-400 mt-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2.5 sm:gap-4">
              <div className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center overflow-hidden ${
                activeRole === 'frank' ? 'bg-[#E3F2FD]' : 'bg-[#FCE4EC]'
              }`}>
                <Image src={activeRole === 'frank' ? '/frank-avatar.png' : '/grace-avatar.png'} alt={activeRole} width={32} height={32} className="w-full h-full object-cover" />
              </div>
              <div className={`px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl rounded-tl-sm border ${
                activeRole === 'frank' ? 'bg-[#E3F2FD] border-blue-100' : 'bg-[#FCE4EC] border-pink-100'
              }`}>
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce [animation-delay:0.1s]" />
                  <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce [animation-delay:0.2s]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-gray-100 bg-white px-3 sm:px-4 py-3 sm:py-4">
          <div className="max-w-3xl mx-auto">
            {(pendingImage || pendingPdf) && (
              <div className="flex gap-2 mb-2">
                {pendingImage && (
                  <div className="relative">
                    <img src={pendingImage} alt="Pending" className="h-16 w-16 object-cover rounded-lg" />
                    <button onClick={() => setPendingImage(null)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">×</button>
                  </div>
                )}
                {pendingPdf && (
                  <div className="relative bg-gray-100 px-3 py-2 rounded-lg flex items-center gap-2">
                    <FileText size={16} />
                    <span className="text-sm truncate max-w-[150px]">{pendingPdf.name}</span>
                    <button onClick={() => setPendingPdf(null)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">×</button>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex gap-2 sm:gap-3">
              <button onClick={() => imageInputRef.current?.click()} className="p-2 sm:p-2.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors">
                <ImageIcon size={20} className="sm:w-5 sm:h-5" />
              </button>
              <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              
              <button onClick={() => fileInputRef.current?.click()} className="p-2 sm:p-2.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors">
                <Paperclip size={20} className="sm:w-5 sm:h-5" />
              </button>
              <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFileSelect} />
              
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your message..."
                className="flex-1 bg-gray-50 border-0 rounded-xl px-4 py-2.5 sm:py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#4F6DF5]/20"
              />
              
              <button onClick={handleSend} disabled={isLoading} className="p-2.5 sm:p-3 bg-gradient-to-br from-[#4F6DF5] to-[#7B5CF5] text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">
                <Send size={20} className="sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
