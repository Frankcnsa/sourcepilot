'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SinglePage() {
  const params = useParams();
  const pageName = params.pageName as string;
  const [proxyUrl, setProxyUrl] = useState('');

  useEffect(() => {
    if (!pageName) return;
    // 同源代理API（HTTPS）
    setProxyUrl(`/api/proxy/single/${pageName}`);
  }, [pageName]);

  if (!proxyUrl) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {/* 翻译切换栏（可选，暂时隐藏） */}

      {/* 主iframe（同源代理，无混合内容问题） */}
      <iframe
        src={proxyUrl}
        style={{ width: '100%', height: '100%', border: 'none' }}
        title={pageName}
        allow="clipboard-write"
      />
    </div>
  );
}
