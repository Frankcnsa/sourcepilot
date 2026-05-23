const crypto = require('crypto');

// 大淘客配置
const APP_KEY = process.env.DATAOKE_APP_KEY || '69dd9a4187317';
const APP_SECRET = process.env.DATAOKE_APP_SECRET || '1e13c6ff3546d62dcb1974512fe3f012';
const BASE_URL = 'https://openapi.dataoke.com';

// 生成大淘客签名（新版本）
function generateSign(params, appSecret) {
  // 新验签方式：appKey=xxx&timer=xxx&nonce=xxx&key=xxx
  const nonce = Math.random().toString().substr(2, 6);
  const timer = Date.now().toString();
  
  const signStr = `appKey=${params.appKey}&timer=${timer}&nonce=${nonce}&key=${appSecret}`;
  const signRan = crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();
  
  // 返回新参数
  return { signRan, nonce, timer };
}

// 调用大淘客API（新验签方式）
async function callDataokeAPI(endpoint, params, version = 'v1.0.0') {
  const allParams = {
    appKey: APP_KEY,
    version,
    ...params
  };
  
  // 生成新签名
  const { signRan, nonce, timer } = generateSign(allParams, APP_SECRET);
  
  // 拼接URL参数
  const queryParams = { ...allParams, signRan, nonce, timer };
  const queryStr = new URLSearchParams(queryParams).toString();
  const url = `${BASE_URL}${endpoint}?${queryStr}`;
  
  try {
    const response = await fetch(url, { method: 'GET' });
    const data = await response.json();
    return data;
  } catch (err) {
    return { code: -1, msg: err.message };
  }
}

// 处理函数
exports.handler = async (req, res, context) => {
  // 设置CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.setStatusCode(204);
    return res.send('');
  }
  
  const path = req.path || req.url;
  let body = {};
  
  try {
    if (req.method === 'POST') {
      const bodyStr = await req.text();
      body = JSON.parse(bodyStr);
    } else if (req.method === 'GET') {
      body = req.queries || {};
    }
  } catch (e) {
    // ignore
  }
  
  try {
    let result;
    
    switch (path) {
      // 1. 搜索 (id=9)
      case '/search':
        result = await callDataokeAPI('/api/goods/list-super-goods', {
          pageSize: body.pageSize || '20',
          pageId: body.pageId || '1',
          keyWords: body.query || body.keyWords || '',
          sort: body.sort || 'total_sales_des',
          hasCoupon: body.hasCoupon || '0'
        }, 'v1.0.0');
        break;
        
      // 2. 转链 (id=7)
      case '/convert-link':
        result = await callDataokeAPI('/api/tb-service/get-privilege-link', {
          goodsId: body.goodsId || body.itemId || '',
          pid: body.pid || 'mm_123_456_789',
          couponId: body.couponId || ''
        }, 'v1.3.1');
        break;
        
      // 3. 热搜记录 (id=4)
      case '/hot-words':
        result = await callDataokeAPI('/api/category/get-top100', {
          type: body.type || '1'
        }, 'v1.0.1');
        break;
        
      // 4. 超级分类 (id=10)
      case '/super-category':
        result = await callDataokeAPI('/api/category/get-super-category', {}, 'v1.1.0');
        break;
        
      // 5. 各大榜单 (id=6)
      case '/rank-list':
        result = await callDataokeAPI('/api/goods/get-rank-list', {
          pageSize: body.pageSize || '20',
          pageId: body.pageId || '1',
          rankType: body.rankType || '1'
        }, 'v1.2.2');
        break;
        
      // 6. 9.9包邮 (id=15)
      case '/nine-nine':
        result = await callDataokeAPI('/api/goods/nine-nine-goods', {
          pageSize: body.pageSize || '20',
          pageId: body.pageId || '1',
          nineCid: body.nineCid || '1'
        }, 'v1.2.0');
        break;
        
      // 7. 商品列表 (id=5)
      case '/goods-list':
        result = await callDataokeAPI('/api/goods/get-goods-list', {
          pageSize: body.pageSize || '20',
          pageId: body.pageId || '1',
          sort: body.sort || '0',
          cids: body.cids || ''
        }, 'v1.2.3');
        break;
        
      default:
        res.setStatusCode(404);
        return res.send(JSON.stringify({ 
          success: false, 
          error: 'Unknown endpoint',
          available: ['/search', '/convert-link', '/hot-words', '/super-category', '/rank-list', '/nine-nine', '/goods-list']
        }));
    }
    
    res.setStatusCode(200);
    res.setHeader('Content-Type', 'application/json');
    return res.send(JSON.stringify({
      success: result.code === 0 || result.status === 200,
      data: result.data || result,
      raw: result
    }));
    
  } catch (error) {
    res.setStatusCode(500);
    res.setHeader('Content-Type', 'application/json');
    return res.send(JSON.stringify({
      success: false,
      error: error.message
    }));
  }
};
