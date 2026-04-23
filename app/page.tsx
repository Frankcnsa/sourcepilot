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

        {/* Hero Section */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 -mt-16">
          <div className="max-w-2xl w-full text-center">
            {/* Logo */}
            <div className="mb-6 flex justify-center">
              <Image 
                src="/sourcepilot_logo_transparent.png" 
                alt="SourcePilot" 
                width={80} 
                height={80}
                className="rounded-2xl"
              />
            </div>
            
            {/* Title */}
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              SourcePilot
            </h1>
            <p className="text-lg text-gray-500 mb-8">
              Navigate the Sea. Find Your Match.
            </p>

            {/* Input Box - Click to redirect */}
            <div 
              onClick={handleInputClick}
              className="relative w-full cursor-pointer"
            >
              <div className="flex items-center gap-3 px-4 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:border-gray-300 transition-all">
                <Paperclip size={20} className="text-gray-400" />
                <input 
                  type="text"
                  placeholder="Ask SourcePilot anything about sourcing..."
                  className="flex-1 bg-transparent outline-none text-gray-600 cursor-pointer"
                  readOnly
                />
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <ImageIcon size={18} className="text-gray-400" />
                  </button>
                  <button className="p-2 bg-[#4F6DF5] hover:bg-[#4353C6] rounded-lg transition-colors">
                    <Send size={18} className="text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button 
                onClick={() => router.push('/tools/search-source')}
                className="px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm text-gray-600 transition-colors flex items-center gap-2"
              >
                <Sparkles size={16} />
                Search Products
              </button>
              <button 
                onClick={() => router.push('/tools/consultation')}
                className="px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm text-gray-600 transition-colors"
              >
                Sourcing Consultation
              </button>
              <button 
                onClick={() => router.push('/tools/sourcing-list')}
                className="px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm text-gray-600 transition-colors"
              >
                View Sourcing List
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
