// 谷歌翻译插件初始化（免费版）
function googleTranslateElementInit() {
  new google.translate.TranslateElement({
    pageLanguage: 'zh-CN',
    includedLanguages: 'en,zh-CN,zh-TW,ja,ko',
    layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
    autoDisplay: false
  }, 'google_translate_element');
}

// 动态加载谷歌翻译脚本
function loadGoogleTranslate() {
  if (window.google || document.getElementById('google-translate-script')) return;
  
  const script = document.createElement('script');
  script.id = 'google-translate-script';
  script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  script.onerror = () => console.warn('谷歌翻译加载失败，使用备用方案');
  document.head.appendChild(script);
}

// 备用翻译方案（基于本地规则）
const fallbackTranslations = {
  'zh-CN': {
    '9.9包邮': '9.9 Bao You',
    '百亿补贴': '10 Billion Subsidy',
    '疯抢榜': 'Crazy Rush List',
    // 可扩展...
  }
};

// 初始化：当页面加载完成后
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadGoogleTranslate);
} else {
  loadGoogleTranslate();
}
