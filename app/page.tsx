'use client';

// Cache buster: v16 - mobile textarea height increase

import React, { useState, useEffect, useRef } from 'react';
import { Menu, Paperclip, Image as ImageIcon, Send, ChevronDown, Sparkles, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
    
  const handleNewChat = () => {
    setInputValue('');
    setMessages([]);
    setSelectedFiles([]);
  };

  // 处理图片选择
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setSelectedFiles(prev => [...prev, {
        type: 'image',
        data: base64,
        preview: base64,
        name: file.name
      }]);
    };
    reader.readAsDataURL(file);
  };

  // 处理PDF选择
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
      const base64 = event.target?.result as string;
      setSelectedFiles(prev => [...prev, {
        type: 'pdf',
        data: base64,
        name: file.name
      }]);
    };
    reader.readAsDataURL(file);
  };

  // 移除已选文件
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = () => {
    const hasContent = inputValue.trim() || selectedFiles.length > 0;
    if (!hasContent) return;
    
    setIsLoading(true);
    
    // 构建URL参数
    const params = new URLSearchParams();
    
    if (inputValue.trim()) {
      params.set('initial', inputValue.trim());
    }
    
    // 添加图片参数（只取第一个图片）
    const imageFile = selectedFiles.find(f => f.type === 'image');
    if (imageFile) {
      params.set('image', imageFile.data);
    }
    
    // 添加PDF参数（只取第一个PDF）
    const pdfFile = selectedFiles.find(f => f.type === 'pdf');
    if (pdfFile) {
      params.set('pdf', pdfFile.data);
      if (pdfFile.name) {
        params.set('pdfName', pdfFile.name);
      }
    }
    
    // 跳转到 chat 页面
    window.location.href = `/chat?${params.toString()}`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const showWelcome = messages.length === 0;

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        isMobile={isMobile}
        onNewChat={handleNewChat}
      />

      <div className="flex-1 flex flex-col relative min-w-0">
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

        {showWelcome && (
          <div className="flex flex-col items-center px-4 sm:px-6 pt-8 sm:pt-12">
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
            
            {/* 输入框区域 */}
            <div className="w-full max-w-3xl px-4 sm:px-0">
              {/* 已选文件预览 */}
              {selectedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="relative group">
                      {file.type === 'image' ? (
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                          <img 
                            src={file.preview} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg border border-gray-200">
                          <Paperclip size={16} className="text-gray-500" />
                          <span className="text-sm text-gray-700 truncate max-w-[120px]">
                            {file.name}
                          </span>
                        </div>
                      )}
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="relative bg-white border border-gray-200 rounded-[24px] sm:rounded-[32px] shadow-[0_4px_20px_rgb(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-shadow">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Hi Boss! This is Frank, your sourcepilot today. How can I help?\nI can speak: English, Español, Français, Русский, Afrikaans, عربي`}
                  disabled={isLoading}
                  className="w-full px-4 sm:px-6 pt-5 sm:pt-5 pb-20 sm:pb-20 bg-transparent outline-none resize-none text-gray-700 placeholder-gray-400 text-base disabled:opacity-50"
                  rows={isMobile ? 4 : 3}
                />
                
                <div className="absolute bottom-2.5 sm:bottom-3 left-3 sm:left-4 right-3 sm:right-4 flex items-center justify-between">
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    {/* 隐藏的文件输入 */}
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
                      title="Attach PDF file"
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
                  
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <button className="hidden sm:flex items-center gap-1 px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                      <span>Sourcing AI</span>
                      <ChevronDown size={12} />
                    </button>
                    <button 
                      onClick={handleSendMessage}
                      disabled={(!inputValue.trim() && selectedFiles.length === 0) || isLoading}
                      className="p-2 sm:p-2.5 bg-[#4F6DF5] hover:bg-[#4353C7] disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full transition-colors shadow-sm"
                    >
                      <Send size={isMobile ? 16 : 18} className="text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!showWelcome && (
          <div className="w-full max-w-3xl mx-auto px-4 sm:px-0 pb-6 sm:pb-6">
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
        )}
      </div>
    </div>
  );
}
