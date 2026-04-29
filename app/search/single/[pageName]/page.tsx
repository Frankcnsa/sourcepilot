'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

// 文件名映射（英文slug → 实际HTML文件名）
const FILE_MAP: Record<string, string> = {
  '9.9-baoyou': '9.9-baoyou.html',
  'baiyi-butie': 'baiyi-butie.html',
  'dongdongqiang': 'dongdongqiang.html',
  'fengqiangbang': 'fengqiangbang.html',
  'gaoyong-jingxuan': 'gaoyong-jingxuan.html',
  'zheshangzhe': 'zheshangzhe.html',
};

// 支持的语言
type Lang = 'zh' | 'en' | 'ja' | 'ko';
const LANG_LABELS: Record<Lang, string> = {
  zh: '中文',
  en: 'English',
  ja: '日本語',
  ko: '한국어',
};

export default function SinglePage() {
  const params = useParams();
  const pageName = params.pageName as string;
  const [iframeUrl, setIframeUrl] = useState('');
  const [lang, setLang] = useState<Lang>('zh');

  useEffect(() => {
    if (!pageName) return;
    const fileName = FILE_MAP[pageName] || `${pageName}.html`;
    setIframeUrl(`http://111.230.10.101:3003/${fileName}`);
  }, [pageName]);

  // 切换语言
  const switchLang = (l: Lang) => {
    setLang(l);
    if (typeof window !== 'undefined' && (window as any).google?.translate?.TranslateElement) {
      (window as any).google.translate.TranslateElement().setLanguage(l);
    }
  };

  if (!iframeUrl) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {/* 翻译切换栏 */}
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        zIndex: 9999,
        display: 'flex',
        gap: '4px',
        background: 'rgba(255,255,255,0.9)',
        padding: '6px 10px',
        borderRadius: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}>
        {Object.entries(LANG_LABELS).map(([code, label]) => (
          <button
            key={code}
            onClick={() => switchLang(code as Lang)}
            style={{
              padding: '4px 10px',
              borderRadius: '12px',
              border: lang === code ? '2px solid #0070f3' : '1px solid #ccc',
              background: lang === code ? '#0070f3' : '#fff',
              color: lang === code ? '#fff' : '#333',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 谷歌翻译容器（隐藏） */}
      <div id="google_translate_element" style={{ display: 'none' }}></div>

      {/* 主iframe */}
      <iframe
        src={iframeUrl}
        style={{ width: '100%', height: '100%', border: 'none' }}
        title={pageName}
        allow="clipboard-write"
      />

      {/* 加载翻译脚本 */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            function googleTranslateElementInit() {
              new google.translate.TranslateElement({
                pageLanguage: 'zh-CN',
                includedLanguages: 'en,zh-CN,zh-TW,ja,ko',
                layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
                autoDisplay: false
              }, 'google_translate_element');
            }
            if (!document.getElementById('google-translate-script')) {
              var s = document.createElement('script');
              s.id = 'google-translate-script';
              s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
              document.head.appendChild(s);
            }
          `,
        }}
      />
    </div>
  );
}
