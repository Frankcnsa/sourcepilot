'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const supportedLanguages = [
  { code: 'en', name: 'English' },
  { code: 'zh', name: '中文' },
  { code: 'ar', name: 'العربية' },
  { code: 'ru', name: 'Русский' },
  { code: 'es', name: 'Español' }
];

interface LanguageContextType {
  lang: string;
  setLang: (lang: string) => void;
  supportedLanguages: typeof supportedLanguages;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  supportedLanguages
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState('en');

  useEffect(() => {
    // 读取用户偏好，默认英语
    const saved = localStorage.getItem('sourcepilot-lang');
    if (saved && supportedLanguages.some(l => l.code === saved)) {
      setLangState(saved);
    } else {
      // 浏览器检测 fallback 到英语
      const browserLang = navigator.language?.split('-')[0] || 'en';
      setLangState(supportedLanguages.some(l => l.code === browserLang) ? browserLang : 'en');
    }
  }, []);

  const setLang = (newLang: string) => {
    setLangState(newLang);
    localStorage.setItem('sourcepilot-lang', newLang);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, supportedLanguages }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
