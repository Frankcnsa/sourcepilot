# 大淘客API调用规律总结

从6个单页实例中提取的API调用模式，用于开发我们自己的搜索页功能。

## 通用信息

- **我们的AppKey**: `69dd9a4187317`（或 `qrysqi`）
- **签名方式**: 部分接口需要MD5签名（`timer` + `nonce` + `signRan`），部分接口直接传 `appKey` 参数。
- **基础URL**: 
  - 大淘客官方: `https://openapi.dataoke.com`
  - 第三方封装（单页用）: `https://dtkapi.ffquan.cn`, `https://cmsjapi.dataoke.com`

---

## 各单页对应API

### 1. 9.9包邮 (9.9-baoyou)
- **端点**: `https://dtkapi.ffquan.cn/dtk_go_app_api/v1/page-goods-nine-cate`
- **方法**: GET
- **参数**:
  - 无额外参数（或可选 `app_key`）
- **返回示例**:
  ```json
  { "code": 1, "data": [{ "id": 分类ID, "title": "3.9元区", "navList": [...] }] }
  ```
- **后续商品列表**: 用分类ID调 `/page-goods-nine`

### 2. 百亿补贴 (baiyi-butie)
- **端点**: `https://dtkapi.ffquan.cn/dtk_java_views_api/api/tb/activity/promote/bybt`
- **方法**: GET
- **参数**:
  - `pageId`: 页码（默认1）
  - `pageSize`: 每页数量（默认20）
  - `appKey`: 我们的Key`
- **返回示例**:
  ```json
  { "code": 200, "data": { "list": [...], "sys": {...}, "kzWebsite": "..." } }
  ```
- **注意**: 如果 `sys` 为 `null`，页面显示“已过期”。

### 3. 咚咚抢 (dongdongqiang)
- **端点**: `https://dtkapi.ffquan.cn/dtk_go_app_api/v1/page-goods-ddq`
- **方法**: GET
- **参数**:
  - `pageId`: 场次ID（从分类接口获取）
  - `pageSize`: 每页数量`
  - `appKey`: 我们的Key`
- **返回示例**:
  ```json
  { "code": 200, "data": { "ddqSessions": [...], ... } }
  ```

### 4. 疯抢榜 (fengqiangbang)
- **端点**: `https://dtkapi.ffquan.cn/dtk_go_app_api/v1/page-goods-ranking`
- **方法**: GET
- **参数**:
  - `cId`: 分类ID（从分类接口获取）
  - `pageNo`: 页码`
  - `pageSize`: 每页数量`
  - `singlePageId`: 单页标识（如9）
  - `appKey`: 我们的Key`
- **返回示例**:
  ```json
  { "code": 1, "data": { "lists": [...] } }
  ```
- **注意**: 单页里用 `cmsjapi.dataoke.com` 的接口，但 `dtkapi` 应该也支持。

### 5. 高佣精选 (gaoyong-jingxuan)
- **端点**: 
  - 分类: `https://cmsjapi.dataoke.com/api/category/single/page/get-single-page?pageId=9&userId=1&entityId=`
  - 商品: `https://cmsjapi.dataoke.com/api/category/single/page/get-goods-by-categoryId?categoryId=...&pageNo=1&pageSize=10&singlePageId=9&appKey=...`
- **方法**: GET
- **参数**:
  - `categoryId`: 分类ID`
  - `pageNo`, `pageSize`
  - `singlePageId`: 9（代表高佣精选）
  - `appKey`: 我们的Key`
- **返回示例**:
  ```json
  { "code": 0, "data": { "banner": "...", "categoryRespVOS": [...], "lists": [...] } }
  ```

### 6. 折上折 (zheshangzhe)
- **端点**: `https://dtkapi.ffquan.cn/dtk_go_app_api/v1/page-goods-zheshangzhe` （推测）
- **方法**: GET
- **参数**: 类似9.9包邮，可能有 `activityId` 或分类ID。

---

## 通用商品详情接口（生成淘口令）

### 生成淘口令
- **端点**: `https://dtkapi.ffquan.cn/dtk_go_app_api/api/tb/activity/promote/bybt/tkl`
- **方法**: GET
- **参数**:
  - `itemId`: 商品ID`
  - `appKey`: 我们的Key`
- **返回**: `{ "code": 200, "data": { "longTpwd": "淘口令..." } }`

### 短链接
- **端点**: `https://dtkapi.ffquan.cn/taobaoapi/kz-create-short`
- **参数**: `url`: 需要缩短的链接（带 `app_key` 参数）

---

## 我们的调用策略

1. **对于需要签名的接口**（如 `openapi.dataoke.com` 官方接口）：
   - 使用 `dataoke-new-proxy/app.js` 中的签名逻辑：
     ```javascript
     const signStr = `appKey=${APP_KEY}&timer=${timer}&nonce=${nonce}&key=${APP_SECRET}`;
     const signRan = crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();
     ```
   - 从环境变量获取 `APP_SECRET`（目前未知，可能需要申请）。

2. **对于直接传appKey的接口**（单页用的大部分）：
   - 直接在GET参数里加 `appKey=69dd9a4187317`。
   - 简单，但可能限制较多。

3. **开发自己的搜索页**：
   - 用Node代理（已有 `dataoke-new-proxy/`）转发，避免浏览器CORS问题。
   - 或直接在Next.js API路由里调用，走服务端。

---

## 下一步

- [ ] 用我们的appKey测试一个接口（如疯抢榜），确保能调通。
- [ ] 在Vercel项目中创建自己的搜索页，调用这些API。
- [ ] 设计UI，参考单页但用我们自己的风格。

---

**文档创建时间**: 2026-04-29 12:45  
**创建者**: Sunshine (AI管家）