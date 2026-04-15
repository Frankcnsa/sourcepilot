import crypto from 'crypto';

const ALIYUN_MT_ACCESS_KEY_ID = process.env.ALIYUN_MT_ACCESS_KEY_ID || '';
const ALIYUN_MT_ACCESS_KEY_SECRET = process.env.ALIYUN_MT_ACCESS_KEY_SECRET || '';
const ALIYUN_MT_ENDPOINT = 'https://mt.aliyuncs.com';

// 支持的语言
export const SUPPORTED_LANGUAGES = {
  zh: '中文',
  en: 'English',
  ar: 'العربية',
  ru: 'Русский',
  es: 'Español'
};

// 生成阿里云签名
function generateAliyunSign(params: Record<string, string>, accessKeySecret: string) {
  // 1. 按参数名排序
  const sortedKeys = Object.keys(params).sort();
  
  // 2. 构造规范化查询字符串
  const canonicalQueryString = sortedKeys
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
  
  // 3. 构造待签名字符串
  const stringToSign = `GET&${encodeURIComponent('/')}&${encodeURIComponent(canonicalQueryString)}`;
  
  // 4. HMAC-SHA1签名
  const sign = crypto
    .createHmac('sha1', accessKeySecret + '&')
    .update(stringToSign)
    .digest('base64');
  
  return sign;
}

// 翻译文本
export async function translateText(
  text: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<string> {
  if (!text || !sourceLanguage || !targetLanguage) {
    return text;
  }
  
  if (sourceLanguage === targetLanguage) {
    return text;
  }
  
  if (!ALIYUN_MT_ACCESS_KEY_ID || !ALIYUN_MT_ACCESS_KEY_SECRET) {
    console.warn('[AliyunMT] Missing credentials, returning original text');
    return text;
  }
  
  try {
    // 构建请求参数
    const params: Record<string, string> = {
      Action: 'TranslateGeneral',
      Format: 'JSON',
      Version: '2018-10-12',
      AccessKeyId: ALIYUN_MT_ACCESS_KEY_ID,
      SignatureMethod: 'HMAC-SHA1',
      Timestamp: new Date().toISOString().replace(/\.[0-9]+Z$/, 'Z'),
      SignatureVersion: '1.0',
      SignatureNonce: Math.random().toString(36).substring(2, 15),
      RegionId: 'cn-hangzhou',
      FormatType: 'text',
      SourceLanguage: sourceLanguage,
      TargetLanguage: targetLanguage,
      SourceText: text.substring(0, 2000) // 限制长度
    };
    
    // 生成签名
    params.Signature = generateAliyunSign(params, ALIYUN_MT_ACCESS_KEY_SECRET);
    
    // 构建URL
    const queryString = Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    
    const url = `${ALIYUN_MT_ENDPOINT}/?${queryString}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.Code && data.Code !== '200') {
      console.error('[AliyunMT] Error:', data.Message);
      return text;
    }
    
    return data.Data?.Translated || text;
  } catch (error) {
    console.error('[AliyunMT] Translation failed:', error);
    return text;
  }
}

// 批量翻译
export async function translateBatch(
  texts: string[],
  sourceLanguage: string,
  targetLanguage: string
): Promise<string[]> {
  const results: string[] = [];
  for (const text of texts) {
    const translated = await translateText(text, sourceLanguage, targetLanguage);
    results.push(translated);
    // 添加小延迟避免触发限流
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  return results;
}

// 检测语言（简单版，实际应调用API）
export function detectLanguage(text: string): string {
  // 如果包含中文字符，认为是中文
  if (/[\u4e00-\u9fa5]/.test(text)) {
    return 'zh';
  }
  // 默认英文
  return 'en';
}
