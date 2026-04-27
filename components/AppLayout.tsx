'use client';

import React, { useState, useEffect } from 'react';
import { Menu, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';

// 内部组件，使用 useLanguage
function AppLayoutInner({ children, currentTool }: { children: React.ReactNode; currentTool?: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const { lang, setLang, supportedLanguages } = useLanguage();
  const currentLangName = supportedLanguages.find(l => l.code === lang)?.name || 'English';

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

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        isMobile={isMobile}
        currentTool={currentTool}
      />
      
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
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
            
            {/* Back to Home */}
            <Link href="/" className="text-sm text-[#4F6DF5] hover:underline">
              ← {lang === 'zh' ? '返回首页' : lang === 'ar' ? 'العودة للرئيسية' : lang === 'ru' ? 'На главную' : lang === 'es' ? 'Volver al inicio' : 'Back to Home'}
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

// 外层包裹 LanguageProvider
export default function AppLayout({ children, currentTool }: { children: React.ReactNode; currentTool?: string }) {
  return (
    <LanguageProvider>
      <AppLayoutInner currentTool={currentTool}>{children}</AppLayoutInner>
    </LanguageProvider>
  );
}
