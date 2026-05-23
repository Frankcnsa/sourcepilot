'use client';

import { useParams } from 'next/navigation';

export default function SinglePage() {
  const params = useParams();
  const pageName = params.pageName as string;

  if (!pageName) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* 直接加载同域静态单页（HTTPS，无混合内容，无需登录） */}
      <iframe
        src={`/${pageName}.html`}
        style={{ width: '100%', height: '100%', border: 'none' }}
        title={pageName}
        allow="clipboard-write"
      />
    </div>
  );
}
