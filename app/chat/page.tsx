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

interface ConversationState {
  language?: string;
  productName?: string;
  productUsage?: string;
  modelSpec?: string;
  originalOrAlternative?: string;
}

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your AI Sourcing Assistant. What language would you prefer for our conversation?\n\n您好！我是您的AI采购助理。请问您希望使用哪种语言交流？",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationState, setConversationState] = useState<ConversationState>({});
  const [step, setStep] = useState(0);
  const [initialProcessed, setInitialProcessed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // 处理从首页跳转过来的 initial 消息
  useEffect(() => {
    if (initialProcessed) return;
    
    const params = new URLSearchParams(window.location.search);
    const initialMessage = params.get('initial');
    
    if (initialMessage) {
      setInitialProcessed(true);
      // 解码并自动发送
      const decodedMessage = decodeURIComponent(initialMessage);
      handleInitialMessage(decodedMessage);
      // 清除 URL 参数
      window.history.replaceState({}, '', '/chat');
    }
  }, [initialProcessed]);

  const handleInitialMessage = async (message: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    setTimeout(() => {
      const newState = { ...conversationState };
      newState.language = message;
      setConversationState(newState);
      
      const nextStep = 1;
      setStep(nextStep);

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getNextQuestion(nextStep, newState),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getNextQuestion = (currentStep: number, state: ConversationState): string => {
    switch (currentStep) {
      case 1:
        return 'Great! What product are you looking to source?';
      case 2:
        return `What is "${state.productName}" used for? (This helps me understand the exact type you need)`;
      case 3:
        return 'Do you have a specific model number? You can tell me directly or upload a product image.';
      case 4:
        return 'Do you need original/genuine parts, or are Chinese alternative parts acceptable?';
      case 5:
        return generateSummary(state);
      default:
        return '';
    }
  };

  const generateSummary = (state: ConversationState): string => {
    return `Here's what I've gathered:\n\n` +
      `📦 Product: ${state.productName || 'Not provided'}\n` +
      `🎯 Usage: ${state.productUsage || 'Not provided'}\n` +
      `🔧 Model/Spec: ${state.modelSpec || 'Not provided'}\n` +
      `🏭 Type: ${state.originalOrAlternative || 'Not provided'}\n` +
      `🌐 Language: ${state.language || 'Not provided'}\n\n` +
      `Would you like to:\n` +
      `1. Generate the "Sourcing Requirements Analysis" report (0 credits)\n` +
      `2. Add or modify any information`;
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    setTimeout(() => {
      const newState = { ...conversationState };
      
      switch (step) {
        case 0:
          newState.language = inputValue;
          break;
        case 1:
          newState.productName = inputValue;
          break;
        case 2:
          newState.productUsage = inputValue;
          break;
        case 3:
          newState.modelSpec = inputValue;
          break;
        case 4:
          newState.originalOrAlternative = inputValue;
          break;
      }

      setConversationState(newState);
      
      const nextStep = step + 1;
      setStep(nextStep);

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getNextQuestion(nextStep, newState),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* 侧边栏 */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        isMobile={isMobile}
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
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user' ? 'bg-[#4F6DF5]' : 'bg-[#F5F5F5]'
                }`}
              >
                {message.role === 'user' ? (
                  <User size={14} className="text-white sm:hidden" />
                ) : (
                  <Bot size={14} className="text-gray-600 sm:hidden" />
                )}
                {message.role === 'user' ? (
                  <User size={16} className="text-white hidden sm:block" />
                ) : (
                  <Bot size={16} className="text-gray-600 hidden sm:block" />
                )}
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[80%] px-3.5 sm:px-5 py-2.5 sm:py-3.5 rounded-2xl whitespace-pre-wrap text-sm sm:text-[15px] leading-relaxed ${
                  message.role === 'user'
                    ? 'bg-[#4F6DF5] text-white rounded-br-md'
                    : 'bg-[#F5F5F5] text-gray-800 rounded-bl-md'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-2.5 sm:gap-4">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <Bot size={14} className="text-gray-600 sm:hidden" />
                <Bot size={16} className="text-gray-600 hidden sm:block" />
              </div>
              <div className="bg-gray-100 px-3 sm:px-4 py-2 sm:py-3 rounded-2xl">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* 输入框 */}
        <div className="border-t border-gray-100 px-2.5 sm:px-4 pt-2.5 sm:pt-4 pb-8 sm:pb-6 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="relative bg-white border border-gray-200 rounded-[20px] sm:rounded-[24px] shadow-[0_2px_12px_rgb(0,0,0,0.06)] hover:shadow-[0_4px_20px_rgb(0,0,0,0.1)] transition-shadow">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="w-full px-3.5 sm:px-5 pt-3 sm:pt-4 pb-12 sm:pb-14 bg-transparent outline-none resize-none text-gray-700 placeholder-gray-400 text-sm sm:text-base"
                rows={isMobile ? 1 : 2}
              />
              
              <div className="absolute bottom-2 sm:bottom-3 left-2.5 sm:left-3 right-2.5 sm:right-3 flex items-center justify-between">
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <button className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg sm:rounded-xl transition-colors">
                    <Paperclip size={18} className="text-gray-400 sm:hidden" />
                    <Paperclip size={20} className="text-gray-400 hidden sm:block" />
                  </button>
                  <button className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg sm:rounded-xl transition-colors">
                    <ImageIcon size={18} className="text-gray-400 sm:hidden" />
                    <ImageIcon size={20} className="text-gray-400 hidden sm:block" />
                  </button>
                </div>
                
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isLoading}
                  className="p-2 sm:p-2.5 bg-[#4F6DF5] hover:bg-[#4353C7] disabled:bg-gray-300 rounded-full transition-colors"
                >
                  <Send size={16} className="text-white sm:hidden" />
                  <Send size={18} className="text-white hidden sm:block" />
                </button>
              </div>
            </div>
            
            <p className="text-center text-[10px] sm:text-xs text-gray-400 mt-2 sm:mt-3">
              AI can make mistakes. Please verify important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
