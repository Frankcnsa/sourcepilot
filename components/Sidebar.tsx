'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  X, 
  Plus, 
  MessageSquare, 
  Settings, 
  Globe, 
  HelpCircle, 
  ChevronDown,
  User,
  Gem,
  FileText,
  ShoppingCart,
  Search,
  BarChart3,
  CreditCard,
  LogOut
} from 'lucide-react';
import Image from 'next/image';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile?: boolean;
  onNewChat?: () => void;
  currentSessionId?: string;
  currentTool?: string;
}

export default function Sidebar({ isOpen, onClose, isMobile = false, onNewChat, currentSessionId, currentTool }: SidebarProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const isAuthenticated = !!user;

  // 主导航项
  const mainNavItems = [
    { 
      icon: Search, 
      label: 'Search Source', 
      href: '/tools/search-source',
      id: 'search-source'
    },
    { 
      icon: ShoppingCart, 
      label: 'Sourcing History', 
      href: '/tools/sourcing-list',
      id: 'sourcing-history'
    },
    { 
      icon: MessageSquare, 
      label: 'Consultation', 
      href: '/tools/consultation',
      id: 'consultation'
    },
    { 
      icon: FileText, 
      label: 'My Reports', 
      href: '/tools/reports',
      id: 'my-reports'
    },
  ];

  // 工具项（分隔区）
  const toolItems = [
    { icon: BarChart3, label: 'Analytics', badge: 'Beta', href: '/analytics' },
    { icon: CreditCard, label: 'Credits & Billing', href: '/billing' },
    { icon: User, label: 'Image Design', badge: 'NEW', href: '/tools/image-design' },
  ];

  // 底部项
  const bottomItems = [
    { icon: Settings, label: 'Settings', href: '/settings' },
    { icon: Globe, label: 'Language' },
    { icon: HelpCircle, label: 'Help & Feedback' },
  ];

  return (
    <>
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      <div
        className={`${
          isOpen 
            ? 'translate-x-0 opacity-100' 
            : '-translate-x-full opacity-0'
        } ${
          !isOpen ? 'pointer-events-none' : ''
        } ${
          !isOpen && !isMobile ? 'w-0 min-w-0' : ''
        } fixed md:relative z-50 h-full bg-[#f9f9f9] flex flex-col transition-all duration-300 ease-in-out overflow-hidden`}
        style={{ width: isMobile ? (isOpen ? '85%' : '0') : (isOpen ? '260px' : '0') }}
      >
        {/* 顶部区域 - 固定 */}
        <div className="flex items-center justify-between p-4 flex-shrink-0">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 relative">
              <Image
                src="/sourcepilot-icon.png"
                alt="SourcePilot"
                fill
                className="object-contain"
              />
            </div>
            <span className="font-semibold text-gray-800 text-sm">SourcePilot</span>
          </Link>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* New Chat 按钮 - 固定，点击返回首页 */}
        <div className="px-3 mb-2 flex-shrink-0">
          <Link 
            href="/tools/consultation"
            onClick={() => isMobile && onClose()}
            className="w-full flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 shadow-sm hover:shadow-md"
          >
            <Plus size={18} />
            <span>New Chat</span>
          </Link>
        </div>

        {/* 主导航区 - Search Source / Sourcing History / Consultation / My Reports */}
        <div className="px-3 flex-shrink-0">
          <div className="space-y-0.5">
            {mainNavItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => isMobile && onClose()}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors ${
                  currentTool === item.id || (item.id === 'consultation' && currentSessionId)
                    ? 'bg-[#e8eaf6] text-[#4F6DF5]'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* 分隔区 - Tools */}
        <div className="flex-1 overflow-y-auto px-3 min-h-0 pt-4">
          <div className="space-y-0.5">
            {toolItems.map((item) => (
              <Link
                key={item.label}
                href={item.href || '#'}
                onClick={() => isMobile && onClose()}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <item.icon size={16} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* 底部区域 - Settings（分隔） */}
        <div className="px-3 pt-2 pb-1 flex-shrink-0 border-t border-gray-200">
          <div className="space-y-0.5">
            {bottomItems.map((item) => (
              item.href ? (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => isMobile && onClose()}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  <item.icon size={16} />
                  <span>{item.label}</span>
                </Link>
              ) : (
                <button
                  key={item.label}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  <item.icon size={16} />
                  <span>{item.label}</span>
                </button>
              )
            ))}
          </div>
        </div>

        {/* 用户状态栏 - 最底部固定 */}
        <div className="p-3 flex-shrink-0 bg-[#f9f9f9]">
          {isAuthenticated ? (
            <>
              <div className="flex items-center justify-between px-2 py-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <User size={16} className="text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-800">{user?.user_metadata?.name || user?.email?.split('@')[0] || 'Boss'}</div>
                    <div className="text-xs text-gray-500">{user?.email}</div>
                  </div>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 mt-2 text-sm text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
              >
                <LogOut size={16} />
                <span>Log Out</span>
              </button>
            </>
          ) : (
            <>
              <Link 
                href="/login"
                onClick={() => isMobile && onClose()}
                className="w-full flex items-center justify-between px-2 py-2 hover:bg-gray-200 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <User size={16} className="text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-800">Guest User</div>
                    <div className="text-xs text-gray-500">Click to login</div>
                  </div>
                </div>
                <ChevronDown size={16} className="text-gray-400" />
              </Link>
              
              <div className="flex items-center justify-between px-3 py-2 mt-2 bg-blue-50 rounded-xl">
                <div className="flex items-center gap-1.5">
                  <Gem size={14} className="text-blue-500" />
                  <span className="text-sm text-gray-600">Credits</span>
                </div>
                <span className="text-sm font-semibold text-blue-600">0</span>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
