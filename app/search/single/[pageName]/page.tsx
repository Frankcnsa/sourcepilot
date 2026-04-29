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

export default function SinglePage() {
  const params = useParams();
  const pageName = params.pageName as string;
  const [iframeUrl, setIframeUrl] = useState('');

  useEffect(() => {
    if (!pageName) return;
    const fileName = FILE_MAP[pageName] || `${pageName}.html`;
    setIframeUrl(`http://111.230.10.101:3003/${fileName}`);
  }, [pageName]);

  if (!iframeUrl) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <iframe
        src={iframeUrl}
        style={{ width: '100%', height: '100%', border: 'none' }}
        title={pageName}
        allow="clipboard-write"
      />
    </div>
  );
}
