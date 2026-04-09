'use client';

import React, { useState, useEffect } from 'react';
import { Menu, Paperclip, Image as ImageIcon, Send, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import Sidebar from '@/components/Sidebar';

export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isMobile, setIsMobile] = useState(false);

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
    
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* 侧边栏 */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        isMobile={isMobile}
      />

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col relative min-w-0">
        {/* 顶部导航栏 - 修复汉堡按钮点击区域 */}
        <div className="flex items-center justify-between px-4 py-3 relative z-50">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-14 h-14 flex items-center justify-center hover:bg-gray-100 rounded-xl transition-colors touch-manipulation relative z-50"
          >
            <Menu size={24} className="text-gray-300" />
          </button>
          
          <button className="px-4 py-2 text-sm text-[#4F6DF5] hover:bg-blue-50 rounded-xl transition-colors font-medium">
            Log In
          </button>
        </div>

        {/* 中央内容区 */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 -mt-10 sm:-mt-20">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8 sm:mb-16">
            <div className="w-48 h-48 relative mb-4 sm:mb-6">
              <Image
                src="/sourcepilot_logo_transparent.png"
                alt="SourcePilot"
                fill
                className="object-contain"
              />
            </div>
            <p className="text-gray-500 text-sm tracking-wider text-center">
              Let&apos;s find your match.
            </p>
          </div>

          {/* 输入框区域 */}
          <div className="w-full max-w-3xl px-2 sm:px-0">
            <div className="relative bg-white border border-gray-200 rounded-[24px] sm:rounded-[32px] shadow-[0_4px_20px_rgb(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-shadow">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="How can I help you Boss?"
                className="w-full px-4 sm:px-6 pt-4 sm:pt-5 pb-14 sm:pb-16 bg-transparent outline-none resize-none text-gray-700 placeholder-gray-400 text-base"
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
                  <button className="p-2 sm:p-2.5 bg-[#4F6DF5] hover:bg-[#4353C7] rounded-full transition-colors shadow-sm">
                    <Send size={isMobile ? 16 : 18} className="text-white" />
                  </button>
                </div>
              </div>
            </div>
            
            <p className="text-center text-[10px] sm:text-xs text-gray-400 mt-4 sm:mt-6 px-4">
              AI can make mistakes. Please verify important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
