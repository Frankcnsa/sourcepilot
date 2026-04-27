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
    const text = await response.text();
    
    // 尝试解析 JSON
    try {
      const data = JSON.parse(text);
      return data;
    } catch (jsonErr) {
      console.error('JSON parse error:', jsonErr.message, 'Response:', text.substring(0, 200));
      return { code: -1, msg: `Invalid JSON response: ${text.substring(0, 100)}` };
    }
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

// 根路径处理 - 根据 action 路由
app.post('/', async (req, res) => {
  try {
    const { action, ...params } = req.body;
    
    if (!action) {
      return res.status(400).json({ success: false, error: 'Missing action field' });
    }
    
    let result;
    
    switch (action) {
      case 'guess-you-like': {
        // 猜你喜欢 - 使用商品列表接口
        const { size = 10, page = 1, type = '0' } = params;
        result = await callDataokeAPI('/api/goods/get-goods-list', {
          pageSize: String(size),
          pageId: String(page),
          sort: 'total_sales_des',
          type
        }, 'v1.2.3');
        // 统一返回格式：把 result.data.list 提取出来
        if (result.code === 0 && result.data && result.data.list) {
          result = { code: 0, data: result.data.list, raw: result };
        }
        break;
      }
      
      case 'hot-products': {
        // 热销商品 - 使用商品列表接口，按销量排序
        const { pageSize = 8, page = 1, type = '0' } = params;
        result = await callDataokeAPI('/api/goods/list-super-goods', {
          pageSize: String(pageSize),
          pageId: String(page),
          keyWords: '手机',
          sort: 'total_sales_des',
          type
        }, 'v1.0.0');
        break;
      }
      
      case 'super-categories': {
        // 超级分类
        result = await callDataokeAPI('/api/category/get-super-category', {}, 'v1.1.0');
        break;
      }
      
      case 'search':
      case 'search/taobao':
      case 'search/dataoke': {
        // 搜索商品
        const { query, page = 1, pageSize = 20, sort, hasCoupon, type = '0' } = params;
        result = await callDataokeAPI('/api/goods/list-super-goods', {
          pageSize: String(pageSize),
          pageId: String(page),
          keyWords: query || '',
          sort: sort || 'total_sales_des',
          hasCoupon: hasCoupon || '0',
          type
        }, 'v1.0.0');
        break;
      }
      
      case 'convert-link': {
        // 转链
        const { goodsId, itemId, pid, couponId } = params;
        result = await callDataokeAPI('/api/tb-service/get-privilege-link', {
          goodsId: goodsId || itemId || '',
          pid: pid || 'mm_123_456_789',
          couponId: couponId || ''
        }, 'v1.3.1');
        break;
      }
      
      case 'hot-words': {
        // 热搜词
        const { type = '1' } = params;
        result = await callDataokeAPI('/api/category/get-top100', { type }, 'v1.0.1');
        break;
      }
      
      case 'rank-list': {
        // 榜单
        const { pageSize = 20, page = 1, rankType = '1' } = params;
        result = await callDataokeAPI('/api/goods/get-rank-list', {
          pageSize: String(pageSize),
          pageId: String(page),
          rankType
        }, 'v1.2.2');
        break;
      }
      
      case 'nine-nine': {
        // 9.9包邮
        const { pageSize = 20, page = 1, nineCid = '1' } = params;
        result = await callDataokeAPI('/api/goods/nine-nine-goods', {
          pageSize: String(pageSize),
          pageId: String(page),
          nineCid
        }, 'v1.2.0');
        break;
      }
      
      case 'goods-list': {
        // 商品列表
        const { pageSize = 20, page = 1, sort = '0', cids } = params;
        result = await callDataokeAPI('/api/goods/get-goods-list', {
          pageSize: String(pageSize),
          pageId: String(page),
          sort,
          cids: cids || ''
        }, 'v1.2.3');
        break;
      }
      
      default:
        return res.status(400).json({ success: false, error: `Unknown action: ${action}` });
    }
    
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
      'POST / (with action field)',
      'GET /health'
    ]
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`大淘客代理服务运行在 http://0.0.0.0:${PORT}`);
  console.log(`健康检查: http://111.230.10.101:${PORT}/health`);
  console.log(`支持的动作 (action): guess-you-like, hot-products, super-categories, search, convert-link, hot-words, rank-list, nine-nine, goods-list`);
});
