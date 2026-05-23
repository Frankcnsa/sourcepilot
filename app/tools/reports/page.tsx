'use client';

import React, { useState, useEffect } from 'react';
import { Menu, FileText } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

export default function ReportsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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
    <div className="flex h-screen bg-white">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        isMobile={isMobile}
      />
      
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
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

        <div className="flex-1 overflow-y-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <FileText size={24} className="text-[#4F6DF5]" />
              <h1 className="text-2xl font-semibold text-gray-800">My Reports</h1>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText size={32} className="text-[#4F6DF5]" />
              </div>
              <h2 className="text-lg font-medium text-gray-800 mb-2">No Reports Yet</h2>
              <p className="text-gray-500 mb-4">
                Complete a consultation to generate your sourcing reports.
              </p>
              <Link 
                href="/tools/consultation"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#4F6DF5] hover:bg-[#4353C7] text-white rounded-xl transition-colors font-medium"
              >
                Start a Consultation
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
