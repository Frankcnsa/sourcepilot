'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Paperclip, Image as ImageIcon, Menu } from 'lucide-react';
import Image from 'next/image';
import Sidebar from '@/components/Sidebar';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Frank 的开场白
const FRANK_OPENING = `Hi boss? This is Frank, your sourcepilot today. How can I help?
I can speak : English, Español, Français, Русский, Afrikaans, عربي`;

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: FRANK_OPENING,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [initialProcessed, setInitialProcessed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 生成或获取 session ID
  useEffect(() => {
    const stored = localStorage.getItem('sourcepilot_session_id');
    if (stored) {
      setSessionId(stored);
      // 加载历史对话
      loadConversationHistory(stored);
    } else {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('sourcepilot_session_id', newSessionId);
      setSessionId(newSessionId);
    }
  }, []);

  // 检测移动端
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(true);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 加载对话历史
  const loadConversationHistory = async (sid: string) => {
    try {
      const response = await fetch(`/api/chat?sessionId=${sid}`);
      if (response.ok) {
        const data = await response.json();
        if (data.messages && data.messages.length > 0) {
          // 有历史记录，显示历史
          const historyMessages: Message[] = data.messages.map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: new Date(m.created_at),
          }));
          setMessages(historyMessages);
        }
        // 如果没有历史记录，保持 Frank 的开场白
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  // 处理从首页跳转过来的 initial 消息
  useEffect(() => {
    if (initialProcessed) return;
    
    const params = new URLSearchParams(window.location.search);
    const initialMessage = params.get('initial');
    
    if (initialMessage) {
      setInitialProcessed(true);
      const decodedMessage = decodeURIComponent(initialMessage);
      // 发送用户消息
      handleSendMessage(decodedMessage);
      // 清除 URL 参数
      window.history.replaceState({}, '', '/chat');
    }
  }, [initialProcessed, sessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !sessionId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      const assistantContent = data.choices?.[0]?.message?.content;

      if (assistantContent) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: assistantContent,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      // 显示错误消息
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    await handleSendMessage(inputValue);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    // 生成新会话
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('sourcepilot_session_id', newSessionId);
    setSessionId(newSessionId);
    // 重置消息为 Frank 的开场白
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: FRANK_OPENING,
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* 侧边栏 */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        isMobile={isMobile}
        onNewChat={handleNewChat}
      />

      {/* 遮罩层 */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部导航 */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 -ml-1.5 hover:bg-gray-100 rounded-lg"
            >
              <Menu size={20} className="text-gray-600" />
            </button>
            <div className="w-6 h-6 sm:w-7 sm:h-7 relative">
              <Image
                src="/sourcepilot-icon.png"
                alt="SourcePilot"
                fill
                className="object-contain"
              />
            </div>
            <span className="font-medium text-gray-800 text-sm hidden sm:inline">SourcePilot</span>
          </div>
          <button className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm text-[#4F6DF5] hover:bg-blue-50 rounded-xl transition-colors font-medium">
            Log In
          </button>
        </div>

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-2.5 sm:gap-4 ${
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* 头像 */}
              <div className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                message.role === 'user' 
                  ? 'bg-gradient-to-br from-[#4F6DF5] to-[#7B5CF5]' 
                  : 'bg-gradient-to-br from-gray-100 to-gray-200'
              }`}>
                {message.role === 'user' ? (
                  <User size={14} className="text-white sm:w-4 sm:h-4" />
                ) : (
                  <Bot size={14} className="text-gray-600 sm:w-4 sm:h-4" />
                )}
              </div>

              {/* 消息内容 */}
              <div className={`flex-1 max-w-[85%] sm:max-w-[75%] ${
                message.role === 'user' ? 'items-end' : 'items-start'
              }`}>
                <div className={`inline-block px-3.5 sm:px-4 py-2.5 sm:py-3 text-[15px] leading-relaxed whitespace-pre-wrap ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-[#4F6DF5] to-[#7B5CF5] text-white rounded-2xl rounded-tr-sm'
                    : 'bg-gray-50 text-gray-700 rounded-2xl rounded-tl-sm border border-gray-100'
                }`}>
                  {message.content}
                </div>
                <div className={`text-[11px] sm:text-xs text-gray-400 mt-1 ${
                  message.role === 'user' ? 'text-right' : 'text-left'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}

          {/* Loading 状态 */}
          {isLoading && (
            <div className="flex gap-2.5 sm:gap-4">
              <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <Bot size={14} className="text-gray-600 sm:w-4 sm:h-4" />
              </div>
              <div className="bg-gray-50 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl rounded-tl-sm border border-gray-100">
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

        {/* 底部输入区 */}
        <div className="border-t border-gray-100 bg-white px-3 sm:px-4 py-3 sm:py-4">
          <div className="max-w-3xl mx-auto">
            {/* 输入框容器 */}
            <div className="relative bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-[#4F6DF5] focus-within:ring-1 focus-within:ring-[#4F6DF5]/20 transition-all">
              {/* 输入框 */}
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="How can I help you, Boss?"
                className="w-full bg-transparent px-3 sm:px-4 py-3 sm:py-3.5 pr-12 sm:pr-14 text-[15px] text-gray-700 placeholder-gray-400 resize-none outline-none min-h-[48px] max-h-[120px]"
                rows={1}
                disabled={isLoading}
              />
              
              {/* 右侧按钮组 */}
              <div className="absolute right-2 sm:right-3 bottom-2 sm:bottom-2.5 flex items-center gap-1.5 sm:gap-2">
                {/* 附件按钮 */}
                <button className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                  <Paperclip size={18} className="sm:w-5 sm:h-5" />
                </button>
                {/* 图片按钮 */}
                <button className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                  <ImageIcon size={18} className="sm:w-5 sm:h-5" />
                </button>
                {/* 发送按钮 */}
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isLoading}
                  className="p-1.5 sm:p-2 bg-gradient-to-r from-[#4F6DF5] to-[#7B5CF5] text-white rounded-xl hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <Send size={18} className="sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            {/* 底部提示 */}
            <div className="text-center mt-2 sm:mt-3">
              <p className="text-[11px] sm:text-xs text-gray-400">
                AI can make mistakes. Please verify important information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
