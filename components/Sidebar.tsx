'use client';

import React from 'react';
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
  CreditCard
} from 'lucide-react';
import Image from 'next/image';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

export default function Sidebar({ isOpen, onClose, isMobile }: SidebarProps) {
  // 模拟聊天历史
  const chatHistory = [
    { id: 1, title: 'Sourcing Requirements Analysis', active: true },
    { id: 2, title: 'Fuel Injector Inquiry' },
    { id: 3, title: 'LED Strip Lights RFQ' },
    { id: 4, title: 'Carburetor Parts Search' },
  ];

  // 功能菜单
  const menuItems = [
    { icon: FileText, label: 'My Reports', badge: null },
    { icon: ShoppingCart, label: 'Sourcing History', badge: null },
    { icon: BarChart3, label: 'Analytics', badge: 'Beta' },
    { icon: CreditCard, label: 'Credits & Billing', badge: null },
  ];

  // 底部设置项
  const bottomItems = [
    { icon: Settings, label: 'Settings' },
    { icon: Globe, label: 'Language' },
    { icon: HelpCircle, label: 'Help & Feedback' },
  ];

  return (
    <>
      {/* 遮罩层 - 仅在手机端展开时显示 */}
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      <div
        className={`${
          isOpen 
            ? 'translate-x-0' 
            : '-translate-x-full'
        } ${
          !isOpen && isMobile ? 'invisible' : 'visible'
        } ${
          !isOpen && !isMobile ? 'w-0 min-w-0' : ''
        } fixed md:relative z-50 h-full bg-[#f9f9f9] flex flex-col transition-all duration-300 ease-in-out overflow-hidden`}
        style={{ width: isMobile ? (isOpen ? '85%' : '0') : '260px' }}
      >
      {/* 顶部区域 */}
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

      {/* New Chat 按钮 */}
      <div className="px-3 mb-2 flex-shrink-0">
        <button className="w-full flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 shadow-sm hover:shadow-md">
          <Plus size={18} />
          <span>New Chat</span>
        </button>
      </div>

      {/* 中间可滚动区域：Recent Chats + Tools + Settings */}
      <div className="flex-1 overflow-y-auto px-3 min-h-0">
        {/* Recent Chats */}
        <div className="mb-4">
          <div className="text-xs text-gray-400 mb-2 px-2 font-medium">Recent Chats</div>
          <div className="space-y-0.5">
            {chatHistory.map((chat) => (
              <button
                key={chat.id}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-colors text-left ${
                  chat.active
                    ? 'bg-[#e8eaf6] text-[#4F6DF5]'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                <MessageSquare size={16} className="flex-shrink-0" />
                <span className="truncate">{chat.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tools */}
        <div className="mb-4">
          <div className="text-xs text-gray-400 mb-2 px-2 font-medium">Tools</div>
          <div className="space-y-0.5">
            {menuItems.map((item) => (
              <button
                key={item.label}
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
              </button>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="mb-4">
          <div className="text-xs text-gray-400 mb-2 px-2 font-medium">Settings</div>
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
      </div>

      {/* 用户状态栏 - 最底部固定 */}
      <div className="p-3 border-t border-gray-200 flex-shrink-0 bg-[#f9f9f9]">
        <button className="w-full flex items-center justify-between px-2 py-2 hover:bg-gray-200 rounded-xl transition-colors">
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
        </button>
        
        {/* Credits显示 */}
        <div className="flex items-center justify-between px-3 py-2 mt-2 bg-blue-50 rounded-xl">
          <div className="flex items-center gap-1.5">
            <Gem size={14} className="text-blue-500" />
            <span className="text-sm text-gray-600">Credits</span>
          </div>
          <span className="text-sm font-semibold text-blue-600">0</span>
        </div>
      </div>
    </div>
  );
}
