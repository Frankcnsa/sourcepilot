'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Menu, Paperclip, Image as ImageIcon, Send, ChevronDown, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    
    checkMobile();
    
    // 初始化时，PC端自动打开侧边栏
    if (window.innerWidth >= 768) {
      setSidebarOpen(true);
    }

    // 监听窗口大小变化
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
    
  const handleNewChat = () => {
    // 清空输入框和消息列表，开始新对话
    setInputValue('');
    setMessages([]);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    
    // 添加用户消息到列表
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // 调用后端 API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          model: 'qwen-turbo',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      // 添加 AI 回复到列表
      if (data.choices && data.choices[0]?.message) {
        setMessages([...newMessages, {
          role: 'assistant',
          content: data.choices[0].message.content,
        }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages([...newMessages, {
        role: 'assistant',
        content: '抱歉，服务暂时不可用，请稍后重试。',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 是否显示欢迎界面（没有消息时）
  const showWelcome = messages.length === 0;

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* 侧边栏 */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        isMobile={isMobile}
        onNewChat={handleNewChat}
      />

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col relative min-w-0">
        {/* 顶部导航栏 */}
        <div className="flex items-center justify-between px-4 py-3 relative z-50">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-14 h-14 flex items-center justify-center hover:bg-gray-100 rounded-xl transition-colors touch-manipulation relative z-50"
          >
            <Menu size={24} className="text-gray-300" />
          </button>
          
          <Link 
            href="/login"
            className="px-4 py-2 text-sm text-[#4F6DF5] hover:bg-blue-50 rounded-xl transition-colors font-medium"
          >
            Log In
          </Link>
        </div>

        {/* 消息列表区域 */}
        {!showWelcome && (
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] sm:max-w-[70%] px-4 py-3 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-[#4F6DF5] text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 px-4 py-3 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-[#4F6DF5] animate-pulse" />
                      <span className="text-sm text-gray-500">思考中...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* 中央内容区 - 欢迎界面 */}
        {showWelcome && (
          <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 -mt-24 sm:-mt-32">
            {/* Logo */}
            <div className="flex flex-col items-center mb-6 sm:mb-10">
              <div className="w-40 h-40 sm:w-48 sm:h-48 relative mb-4 sm:mb-5">
                <Image
                  src="/sourcepilot_logo_transparent.png"
                  alt="SourcePilot"
                  fill
                  className="object-contain"
                />
              </div>
              
              {/* 多语言 Slogan - 渐变色排列 */}
              <div className="flex flex-col items-center gap-2 sm:gap-3">
                {/* 第一排：英语 + 西班牙语 */}
                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-lg font-medium">
                  <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
                    Let&apos;s find your match.
                  </span>
                  <span className="text-gray-300">|</span>
                  <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 bg-clip-text text-transparent">
                    Encontremos tu match.
                  </span>
                </div>
                
                {/* 第二排：法语 + 俄语 */}
                <div className="flex items-center gap-2 sm:gap-3 text-sm sm:text-lg font-medium">
                  <span className="bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 bg-clip-text text-transparent">
                    Trouvons votre correspondant.
                  </span>
                  <span className="text-gray-300">|</span>
                  <span className="bg-gradient-to-r from-amber-500 via-yellow-500 to-lime-500 bg-clip-text text-transparent">
                    Давайте найдем ваше совпадение.
                  </span>
                </div>
                
                {/* 第三排：南非语 + 阿拉伯语（RTL） */}
                <div className="flex items-center gap-2 sm:gap-3 text-sm sm:text-lg font-medium">
                  <span className="bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 bg-clip-text text-transparent">
                    Kom ons vind jou pasmaat.
                  </span>
                  <span className="text-gray-300">|</span>
                  <span className="bg-gradient-to-r from-teal-500 via-emerald-500 to-lime-500 bg-clip-text text-transparent" dir="rtl">
                    فلنجد ما يناسبك
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 输入框区域 */}
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-0 pb-10 sm:pb-8">
          <div className="relative bg-white border border-gray-200 rounded-[24px] sm:rounded-[32px] shadow-[0_4px_20px_rgb(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-shadow">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="How can I help you, Boss?"
              disabled={isLoading}
              className="w-full px-4 sm:px-6 pt-4 sm:pt-5 pb-14 sm:pb-16 bg-transparent outline-none resize-none text-gray-700 placeholder-gray-400 text-base disabled:opacity-50"
              rows={isMobile ? 1 : 2}
            />
            
            <div className="absolute bottom-2.5 sm:bottom-3 left-3 sm:left-4 right-3 sm:right-4 flex items-center justify-between">
              <div className="flex items-center gap-0.5 sm:gap-1">
                <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors" title="Attach file">
                  <Paperclip size={isMobile ? 18 : 20} className="text-gray-400" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors" title="Upload image">
                  <ImageIcon size={isMobile ? 18 : 20} className="text-gray-400" />
                </button>
              </div>
              
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button className="hidden sm:flex items-center gap-1 px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                  <span>Sourcing AI</span>
                  <ChevronDown size={12} />
                </button>
                <button 
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="p-2 sm:p-2.5 bg-[#4F6DF5] hover:bg-[#4353C7] disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full transition-colors shadow-sm"
                >
                  <Send size={isMobile ? 16 : 18} className="text-white" />
                </button>
              </div>
            </div>
          </div>
          

        </div>
      </div>
    </div>
  );
}
