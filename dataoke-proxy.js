const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 大淘客配置
const APP_KEY = process.env.DATAOKE_APP_KEY || '69dd9a4187317';
const APP_SECRET = process.env.DATAOKE_APP_SECRET || '1e13c6ff3546d62dcb1974512fe3f012';
const BASE_URL = 'https://openapi.dataoke.com';
const PORT = process.env.PORT || 3001;

// 生成大淘客签名（新版本）
function generateSign(params, appSecret) {
  const nonce = Math.random().toString().substr(2, 6);
  const timer = Date.now().toString();
  
  const signStr = `appKey=${params.appKey}&timer=${timer}&nonce=${nonce}&key=${appSecret}`;
  const signRan = crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();
  
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

// CORS 中间件
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// 1. 搜索 (id=9)
app.post('/api/search/taobao', async (req, res) => {
  try {
    const { query, page = 1, pageSize = 20, sort, hasCoupon, type = '0' } = req.body;
    const result = await callDataokeAPI('/api/goods/list-super-goods', {
      pageSize: String(pageSize),
      pageId: String(page),
      keyWords: query || '',
      sort: sort || 'total_sales_des',
      hasCoupon: hasCoupon || '0',
      type
    }, 'v1.0.0');
    
    res.json({
      success: result.code === 0,
      data: result.data || result,
      raw: result
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. 转链 (id=7)
app.post('/api/convert-link', async (req, res) => {
  try {
    const { goodsId, itemId, pid, couponId } = req.body;
    const result = await callDataokeAPI('/api/tb-service/get-privilege-link', {
      goodsId: goodsId || itemId || '',
      pid: pid || 'mm_123_456_789',
      couponId: couponId || ''
    }, 'v1.3.1');
    
    res.json({
      success: result.code === 0,
      data: result.data || result,
      raw: result
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. 热搜记录 (id=4)
app.get('/api/hot-words', async (req, res) => {
  try {
    const { type = '1' } = req.query;
    const result = await callDataokeAPI('/api/category/get-top100', {
      type
    }, 'v1.0.1');
    
    res.json({
      success: result.code === 0,
      data: result.data || result,
      raw: result
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. 超级分类 (id=10)
app.get('/api/super-category', async (req, res) => {
  try {
    const result = await callDataokeAPI('/api/category/get-super-category', {}, 'v1.1.0');
    
    res.json({
      success: result.code === 0,
      data: result.data || result,
      raw: result
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. 各大榜单 (id=6)
app.post('/api/rank-list', async (req, res) => {
  try {
    const { pageSize = 20, page = 1, rankType = '1' } = req.body;
    const result = await callDataokeAPI('/api/goods/get-rank-list', {
      pageSize: String(pageSize),
      pageId: String(page),
      rankType
    }, 'v1.2.2');
    
    res.json({
      success: result.code === 0,
      data: result.data || result,
      raw: result
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. 9.9包邮 (id=15)
app.post('/api/nine-nine', async (req, res) => {
  try {
    const { pageSize = 20, page = 1, nineCid = '1' } = req.body;
    const result = await callDataokeAPI('/api/goods/nine-nine-goods', {
      pageSize: String(pageSize),
      pageId: String(page),
      nineCid
    }, 'v1.2.0');
    
    res.json({
      success: result.code === 0,
      data: result.data || result,
      raw: result
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. 商品列表 (id=5)
app.post('/api/goods-list', async (req, res) => {
  try {
    const { pageSize = 20, page = 1, sort = '0', cids } = req.body;
    const result = await callDataokeAPI('/api/goods/get-goods-list', {
      pageSize: String(pageSize),
      pageId: String(page),
      sort,
      cids: cids || ''
    }, 'v1.2.3');
    
    res.json({
      success: result.code === 0,
      data: result.data || result,
      raw: result
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Unknown endpoint',
    available: [
      'POST /api/search/taobao',
      'POST /api/convert-link',
      'GET /api/hot-words',
      'GET /api/super-category',
      'POST /api/rank-list',
      'POST /api/nine-nine',
      'POST /api/goods-list',
      'GET /health'
    ]
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`大淘客代理服务运行在 http://0.0.0.0:${PORT}`);
  console.log(`健康检查: http://111.230.10.101:${PORT}/health`);
});
