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
  BarChart3,
  CreditCard,
  LogOut
} from 'lucide-react';
import Image from 'next/image';

interface Chat {
  id: string;
  title: string;
  updated_at: string;
  active?: boolean;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
  onNewChat?: () => void;
  currentSessionId?: string;
}

export default function Sidebar({ isOpen, onClose, isMobile, onNewChat, currentSessionId }: SidebarProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chatHistory, setChatHistory] = useState<Chat[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [showAllChats, setShowAllChats] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
      
      if (user) {
        await loadChatHistory();
      }
    };
    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await loadChatHistory();
      } else {
        setChatHistory([]);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // 当 currentSessionId 变化时，重新加载聊天记录
  useEffect(() => {
    if (user) {
      loadChatHistory();
    }
  }, [currentSessionId, user]);

  const loadChatHistory = async () => {
    setLoadingChats(true);
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        setChatHistory(data.conversations || []);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    } finally {
      setLoadingChats(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setChatHistory([]);
  };

  const isAuthenticated = !!user;

  const menuItems = [
    { icon: FileText, label: 'My Reports', badge: null, href: '/reports' },
    { icon: ShoppingCart, label: 'Sourcing History', badge: null, href: '/history' },
    { icon: BarChart3, label: 'Analytics', badge: 'Beta', href: '/analytics' },
    { icon: CreditCard, label: 'Credits & Billing', badge: null, href: '/billing' },
    { icon: User, label: 'Image Design', badge: 'NEW', href: '/tools/image-design' },
  ];

  const bottomItems = [
    { icon: Settings, label: 'Settings' },
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
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 relative">
              <Image
                src="/sourcepilot-icon.png"
                alt="SourcePilot"
                fill
                className="object-contain"
              />
            </div>
            <span className="font-semibold text-gray-800 text-sm">SourcePilot</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* New Chat 按钮 - 固定 */}
        <div className="px-3 mb-2 flex-shrink-0">
          <button 
            onClick={() => {
              onNewChat?.();
              if (isMobile) onClose();
            }}
            className="w-full flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 shadow-sm hover:shadow-md"
          >
            <Plus size={18} />
            <span>New Chat</span>
          </button>
        </div>

        {/* Tools - 无标题，与 Recent Chats 上沿重合 */}
        <div className="px-3 flex-shrink-0">
          <div className="space-y-0.5">
            {menuItems.map((item) => (
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

        {/* 中间可滚动区域 - Recent Chats（保留标题） */}
        <div className="flex-1 overflow-y-auto px-3 min-h-0">
          <div className="mb-2">
            <div className="text-xs text-gray-400 mb-2 px-2 font-medium">Recent Chats</div>
            {!isAuthenticated ? (
              // 未登录：显示提示
              <div className="px-3 py-4 text-center">
                <div className="text-xs text-gray-400 mb-2">Sign in to view your chat history</div>
                <Link 
                  href="/login"
                  onClick={() => isMobile && onClose()}
                  className="inline-block px-3 py-1.5 text-xs bg-[#4F6DF5] text-white rounded-lg hover:bg-[#4353C7] transition-colors"
                >
                  Log In / Sign Up
                </Link>
              </div>
            ) : loadingChats ? (
              <div className="px-3 py-4 text-center">
                <div className="w-5 h-5 border-2 border-gray-300 border-t-[#4F6DF5] rounded-full animate-spin mx-auto" />
              </div>
            ) : chatHistory.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-gray-400">
                No chat history yet
              </div>
            ) : (
              <>
                <div className="space-y-0.5">
                  {(showAllChats ? chatHistory : chatHistory.slice(0, 4)).map((chat) => (
                    <Link
                      key={chat.id}
                      href={`/chat?sessionId=${chat.id}`}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors text-left ${
                        chat.id === currentSessionId
                          ? 'bg-[#e8eaf6] text-[#4F6DF5]'
                          : 'text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <MessageSquare size={16} className="flex-shrink-0" />
                      <span className="truncate">{chat.title}</span>
                    </Link>
                  ))}
                </div>
                
                {chatHistory.length > 4 && (
                  <button
                    onClick={() => setShowAllChats(!showAllChats)}
                    className="w-full mt-1 px-3 py-1.5 text-xs text-gray-500 hover:text-[#4F6DF5] hover:bg-gray-100 rounded-xl transition-colors text-left flex items-center gap-1"
                  >
                    <ChevronDown 
                      size={14} 
                      className={`transition-transform ${showAllChats ? 'rotate-180' : ''}`} 
                    />
                    <span>{showAllChats ? 'Show less' : `Show ${chatHistory.length - 4} more`}</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* 底部区域 - Settings 无标题 */}
        <div className="px-3 pt-2 pb-1 flex-shrink-0 border-t border-gray-200">
          <div className="space-y-0.5">
            {bottomItems.map((item) => (
              <button
                key={item.label}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </button>
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
