'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Wand2, Download, Sparkles, AlertCircle, Loader2, Menu, X, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';

// ... (保持原有的 avatarAttributes 和 promptMapping 不变)
const avatarAttributes = {
  gender: {
    key: 'gender',
    label: { zh: '性别', en: 'Gender', ar: 'الجنس', ru: 'Пол', es: 'Género' },
    options: [
      { value: 'male', labels: { zh: '男性', en: 'Male', ar: 'ذكر', ru: 'Мужской', es: 'Masculino' } },
      { value: 'female', labels: { zh: '女性', en: 'Female', ar: 'أنثى', ru: 'Женский', es: 'Femenino' } }
    ]
  },
  age: {
    key: 'age',
    label: { zh: '年龄段', en: 'Age', ar: 'العمر', ru: 'Возраст', es: 'Edad' },
    options: [
      { value: 'young', labels: { zh: '年轻 (20-30)', en: 'Young (20-30)', ar: 'شاب (20-30)', ru: 'Молодой (20-30)', es: 'Joven (20-30)' } },
      { value: 'middle', labels: { zh: '中年 (30-45)', en: 'Middle (30-45)', ar: 'متوسط (30-45)', ru: 'Средний (30-45)', es: 'Mediana (30-45)' } },
      { value: 'mature', labels: { zh: '成熟 (45-60)', en: 'Mature (45-60)', ar: 'ناضج (45-60)', ru: 'Зрелый (45-60)', es: 'Maduro (45-60)' } }
    ]
  },
  skinTone: {
    key: 'skinTone',
    label: { zh: '肤色', en: 'Skin Tone', ar: 'لون البشرة', ru: 'Тон кожи', es: 'Tono de piel' },
    options: [
      { value: 'light', labels: { zh: '白皙', en: 'Light', ar: 'فاتح', ru: 'Светлый', es: 'Claro' } },
      { value: 'medium', labels: { zh: '自然', en: 'Medium', ar: 'متوسط', ru: 'Средний', es: 'Medio' } },
      { value: 'tan', labels: { zh: '健康', en: 'Tan', ar: 'أسمر', ru: 'Загорелый', es: 'Bronceado' } },
      { value: 'dark', labels: { zh: '深肤色', en: 'Dark', ar: 'داكن', ru: 'Темный', es: 'Oscuro' } }
    ]
  },
  style: {
    key: 'style',
    label: { zh: '风格', en: 'Style', ar: 'النمط', ru: 'Стиль', es: 'Estilo' },
    options: [
      { value: 'business', labels: { zh: '商务', en: 'Business', ar: 'أعمال', ru: 'Деловой', es: 'Negocios' } },
      { value: 'casual', labels: { zh: '休闲', en: 'Casual', ar: 'غير رسمي', ru: 'Повседневный', es: 'Casual' } },
      { value: 'cartoon', labels: { zh: '卡通', en: 'Cartoon', ar: 'كرتون', ru: 'Мультфильм', es: 'Dibujos' } },
      { value: 'minimal', labels: { zh: '极简', en: 'Minimal', ar: 'بسيط', ru: 'Минимализм', es: 'Minimalista' } }
    ]
  },
  hairColor: {
    key: 'hairColor',
    label: { zh: '发色', en: 'Hair Color', ar: 'لون الشعر', ru: 'Цвет волос', es: 'Color de pelo' },
    options: [
      { value: 'black', labels: { zh: '黑发', en: 'Black', ar: 'أسود', ru: 'Черный', es: 'Negro' } },
      { value: 'brown', labels: { zh: '棕发', en: 'Brown', ar: 'بني', ru: 'Коричневый', es: 'Castaño' } },
      { value: 'blonde', labels: { zh: '金发', en: 'Blonde', ar: 'أشقر', ru: 'Блонд', es: 'Rubio' } },
      { value: 'gray', labels: { zh: '灰发', en: 'Gray', ar: 'رمادي', ru: 'Седой', es: 'Gris' } }
    ]
  },
  expression: {
    key: 'expression',
    label: { zh: '表情', en: 'Expression', ar: 'التعبير', ru: 'Выражение', es: 'Expresión' },
    options: [
      { value: 'smile', labels: { zh: '微笑', en: 'Smile', ar: 'ابتسامة', ru: 'Улыбка', es: 'Sonrisa' } },
      { value: 'confident', labels: { zh: '自信', en: 'Confident', ar: 'واثق', ru: 'Уверенность', es: 'Seguro' } },
      { value: 'friendly', labels: { zh: '友善', en: 'Friendly', ar: 'ودود', ru: 'Дружелюбие', es: 'Amigable' } }
    ]
  }
};

type AttributeKey = keyof typeof avatarAttributes;
type OptionValue = string;

const promptMapping: Record<AttributeKey, Record<OptionValue, string>> = {
  gender: { male: 'professional male avatar', female: 'professional female avatar' },
  age: { young: 'in his/her 20s', middle: 'in his/her 30s', mature: 'in his/her 40s' },
  skinTone: { light: 'light skin tone', medium: 'medium skin tone', tan: 'tan skin tone', dark: 'dark skin tone' },
  style: { business: 'wearing professional business attire', casual: 'wearing casual smart clothing', cartoon: '3D cartoon style, Pixar-like rendering', minimal: 'minimalist flat illustration style' },
  hairColor: { black: 'black hair', brown: 'brown hair', blonde: 'blonde hair', gray: 'gray hair' },
  expression: { smile: 'warm smile', confident: 'confident expression', friendly: 'friendly approachable look' }
};

const supportedLanguages = [
  { code: 'zh', name: '中文' },
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'العربية' },
  { code: 'ru', name: 'Русский' },
  { code: 'es', name: 'Español' }
];

function detectLanguage(): string {
  if (typeof window === 'undefined') return 'en';
  const lang = navigator.language || navigator.languages[0] || 'en';
  const primaryLang = lang.split('-')[0];
  return supportedLanguages.find(l => l.code === primaryLang)?.code || 'en';
}

export default function ImageDesignPage() {
  const [lang, setLang] = useState('en');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [selections, setSelections] = useState<Record<string, string>>({
    gender: 'male', age: 'middle', skinTone: 'medium', style: 'business', hairColor: 'black', expression: 'confident'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [freeUsed, setFreeUsed] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  useEffect(() => {
    setLang(detectLanguage());
    const mobile = window.innerWidth < 768;
    setIsMobile(mobile);
    setSidebarOpen(!mobile); // 桌面端默认打开 Sidebar
    
    const handleResize = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
    };
    window.addEventListener('resize', handleResize);
    
    // Get session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkFreeUsage(session.access_token);
        fetchCredits(session.access_token);
      }
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    
    return () => {
      window.removeEventListener('resize', handleResize);
      subscription.unsubscribe();
    };
  }, []);

  const checkFreeUsage = async (token: string) => {
    try {
      const res = await fetch('/api/tools/image-design/free-check', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setFreeUsed(data.used);
    } catch {
      setFreeUsed(false);
    }
  };

  const fetchCredits = async (token: string) => {
    try {
      const res = await fetch('/api/user/credits', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setCredits(data.credits);
    } catch {
      setCredits(null);
    }
  };

  const handleSelect = (key: string, value: string) => {
    setSelections(prev => ({ ...prev, [key]: value }));
    setGeneratedImage(null);
  };

  const generatePrompt = (): string => {
    const parts = [
      promptMapping.gender[selections.gender],
      promptMapping.age[selections.age],
      promptMapping.skinTone[selections.skinTone],
      promptMapping.style[selections.style],
      promptMapping.hairColor[selections.hairColor],
      promptMapping.expression[selections.expression],
      'high quality, centered composition, professional headshot, clean background, 1:1 square format'
    ];
    return parts.join(', ');
  };

  const handleGenerate = async () => {
    if (!session) {
      setError('Please log in to generate');
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const prompt = generatePrompt();
      const res = await fetch('/api/tools/image-design/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ prompt, attributes: selections })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Generation failed');
      }
      
      setGeneratedImage(data.imageUrl);
      setFreeUsed(data.freeUsed);
      setCredits(data.remainingCredits);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `avatar-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getLabel = (attr: typeof avatarAttributes.gender) => attr.label[lang as keyof typeof attr.label] || attr.label.en;
  const getOptionLabel = (option: typeof avatarAttributes.gender.options[0]) => option.labels[lang as keyof typeof option.labels] || option.labels.en;
  const currentLangName = supportedLanguages.find(l => l.code === lang)?.name || 'English';

  const texts: Record<string, any> = {
    zh: { title: '形象设计', subtitle: '定制您的专业形象', generate: '生成形象', generating: '生成中...', download: '下载', free: '免费', credit: '积分', needLogin: '请登录后生成', login: '登录', home: '返回首页' },
    en: { title: 'Image Design', subtitle: 'Create your professional look', generate: 'Generate', generating: 'Generating...', download: 'Download', free: 'FREE', credit: 'credits', needLogin: 'Please log in to generate', login: 'Log In', home: 'Back to Home' },
    ar: { title: 'تصميم الصورة', subtitle: 'أنشئ مظهرك المهني', generate: 'إنشاء', generating: 'جارٍ الإنشاء...', download: 'تحميل', free: 'مجاني', credit: 'نقاط', needLogin: 'الرجاء تسجيل الدخول', login: 'دخول', home: 'العودة للرئيسية' },
    ru: { title: 'Дизайн образа', subtitle: 'Создайте свой профессиональный образ', generate: 'Создать', generating: 'Создание...', download: 'Скачать', free: 'БЕСПЛАТНО', credit: 'кредитов', needLogin: 'Войдите для создания', login: 'Войти', home: 'На главную' },
    es: { title: 'Diseño de Imagen', subtitle: 'Crea tu look profesional', generate: 'Generar', generating: 'Generando...', download: 'Descargar', free: 'GRATIS', credit: 'créditos', needLogin: 'Inicie sesión', login: 'Iniciar', home: 'Volver al inicio' }
  };
  const t = texts[lang] || texts.en;

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isMobile={isMobile} onNewChat={() => {}} />
      
      {sidebarOpen && isMobile && <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="p-1.5 -ml-1.5 hover:bg-gray-100 rounded-lg">
                <Menu size={20} className="text-gray-600" />
              </button>
              <div className="w-10 h-10 relative">
                <Image src="/sourcepilot-icon.png" alt="SourcePilot" fill className="object-contain" />
              </div>
              <div>
                <h1 className="font-bold text-gray-800">{t.title}</h1>
                <p className="text-xs text-gray-500">{t.subtitle}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Language Switcher */}
              <div className="relative">
                <button 
                  onClick={() => setShowLangDropdown(!showLangDropdown)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  {currentLangName}
                  <ChevronDown size={14} />
                </button>
                {showLangDropdown && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px] z-50">
                    {supportedLanguages.map(l => (
                      <button
                        key={l.code}
                        onClick={() => { setLang(l.code); setShowLangDropdown(false); }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${lang === l.code ? 'text-[#4F6DF5] font-medium' : 'text-gray-700'}`}
                      >
                        {l.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <Link href="/" className="text-sm text-[#4F6DF5] hover:underline">
                ← {t.home}
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left: Selection */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles className="w-5 h-5 text-[#4F6DF5]" />
                  <h2 className="font-semibold text-gray-800">Customize Your Avatar</h2>
                </div>

                <div className="space-y-5">
                  {Object.values(avatarAttributes).map((attr) => (
                    <div key={attr.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{getLabel(attr)}</label>
                      <div className="flex flex-wrap gap-2">
                        {attr.options.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => handleSelect(attr.key, option.value)}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                              selections[attr.key] === option.value
                                ? 'bg-[#4F6DF5] text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {getOptionLabel(option)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Credits / Generate */}
                <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                  {!session ? (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">{t.needLogin}</p>
                      <Link href="/login" className="px-4 py-2 bg-[#4F6DF5] text-white rounded-lg text-sm font-medium hover:opacity-90">
                        {t.login}
                      </Link>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">
                          {!freeUsed ? <span className="text-green-600 font-medium">{t.free}</span> : <span>1 {t.credit}</span>}
                        </p>
                        {credits !== null && <p className="text-xs text-gray-500 mt-1">Balance: {credits} {t.credit}</p>}
                      </div>
                      <button
                        onClick={handleGenerate}
                        disabled={isGenerating || (freeUsed && (credits === null || credits < 1))}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#4F6DF5] to-[#7B5CF5] text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" />{t.generating}</> : <><Wand2 className="w-4 h-4" />{t.generate}</>}
                      </button>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />{error}
                  </div>
                )}
              </div>

              {/* Right: Preview */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="font-semibold text-gray-800 mb-6">Preview</h2>
                <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                  {generatedImage ? (
                    <img src={generatedImage} alt="Generated" className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-center text-gray-400">
                      <div className="w-20 h-20 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-sm">Your avatar will appear here</p>
                    </div>
                  )}
                </div>
                {generatedImage && (
                  <button onClick={handleDownload} className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-xl font-medium hover:bg-gray-900">
                    <Download className="w-4 h-4" />{t.download}
                  </button>
                )}
                <div className="mt-6 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 font-mono break-all">{generatePrompt()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
