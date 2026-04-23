'use client';

// Cache buster: v17 - homepage input redirects to /chat

import React, { useState, useEffect, useRef } from 'react';
import { Menu, Paperclip, Image as ImageIcon, Send, ChevronDown, Sparkles, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface SelectedFile {
  type: 'image' | 'pdf';
  data: string; // base64
  name?: string;
  preview?: string; // for images
}

export default function HomePage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    
    checkMobile();
    
    if (window.innerWidth >= 768) {
      setSidebarOpen(true);
    }

    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // MVP阶段：点击输入框直接跳转到 /tools/consultation
  const handleInputClick = () => {
    router.push('/tools/consultation');
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        isMobile={isMobile}
      />
      
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
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
              href="/login"
              className="px-4 py-2 text-sm text-[#4F6DF5] hover:bg-blue-50 rounded-xl transition-colors font-medium"
            >
              Log In
            </Link>
          </div>
        </header>
        
        {/* Welcome Content with Clickable Input */}
        <div className="flex-1 flex flex-col items-center px-4 sm:px-6 pt-8 sm:pt-12 overflow-y-auto">
          <div className="w-32 h-32 sm:w-40 sm:h-40 relative mb-4 sm:mb-4">
            <Image
              src="/sourcepilot_logo_transparent.png"
              alt="SourcePilot"
              fill
              className="object-contain"
            />
          </div>
          
          <div className="flex flex-col items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-base font-medium">
              <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
                Let&apos;s find your match.
              </span>
              <span className="text-gray-300">|</span>
              <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 bg-clip-text text-transparent">
                Encontremos tu match.
              </span>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-base font-medium">
              <span className="bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 bg-clip-text text-transparent">
                Trouvons votre correspondant.
              </span>
              <span className="text-gray-300">|</span>
              <span className="bg-gradient-to-r from-amber-500 via-yellow-500 to-lime-500 bg-clip-text text-transparent">
                Давайте найдем ваше совпадение.
              </span>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-base font-medium">
              <span className="bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 bg-clip-text text-transparent">
                Kom ons vind jou pasmaat.
              </span>
              <span className="text-gray-300">|</span>
              <span className="bg-gradient-to-r from-teal-500 via-emerald-500 to-lime-500 bg-clip-text text-transparent" dir="rtl">
                فلنجد ما يناسبك
              </span>
            </div>
          </div>
          
          {/* 输入框区域 - MVP阶段点击直接跳转 /chat */}
          <div className="w-full max-w-3xl px-4 sm:px-0">
            <div 
              className="relative bg-white border border-gray-200 rounded-[24px] sm:rounded-[32px] shadow-[0_4px_20px_rgb(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-shadow cursor-pointer"
              onClick={handleInputClick}
            >
              <textarea
                placeholder={`Hi Boss! This is Frank, your sourcepilot today. How can I help?\nI can speak: English, Español, Français, Русский, Afrikaans, عربي`}
                className="w-full px-4 sm:px-6 pt-5 sm:pt-5 pb-20 sm:pb-20 bg-transparent outline-none resize-none text-gray-700 placeholder-gray-400 text-base pointer-events-none"
                rows={isMobile ? 4 : 3}
                readOnly
              />
              
              <div className="absolute bottom-2.5 sm:bottom-3 left-3 sm:left-4 right-3 sm:right-4 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                    <Paperclip size={isMobile ? 18 : 20} className="text-gray-400" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
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
          </div>
        </div>
      </div>
    </div>
  );
}
