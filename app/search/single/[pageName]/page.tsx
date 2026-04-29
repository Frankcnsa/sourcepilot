// 服务端组件：直接代理单页内容（无混合内容问题）
export default async function SinglePage({
  params,
}: {
  params: { pageName: string };
}) {
  const pageName = params.pageName;

  // 白名单校验
  const ALLOWED = ['9.9-baoyou', 'baiyi-butie', 'dongdongqiang', 'fengqiangbang', 'gaoyong-jingxuan', 'zheshangzhe'];
  if (!ALLOWED.includes(pageName)) {
    return <h1>Invalid page</h1>;
  }

  try {
    // 服务端请求腾讯云单页（无浏览器混合内容限制）
    const targetUrl = `http://111.230.10.101:3003/${pageName}.html`;
    const res = await fetch(targetUrl, {
      headers: { 'User-Agent': 'SourcePilot-Proxy/1.0' },
      // 超时10秒
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return <h1>Upstream error: {res.statusText}</h1>;
    }

    const html = await res.text();

    // 直接返回单页HTML（服务端渲染）
    return (
      <div
        style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  } catch (error: any) {
    console.error('Proxy error:', error);
    return <h1>Failed to load page</h1>;
  }
}
