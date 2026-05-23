# 大淘客API应用规律整理

基于6个单页实例总结，并结合我们自己的appKey测试，整理出实际开发中的应用规律。

## 一、端点选择规律

根据需要的商品类型，选择对应端点：

| 单页类型   | 端点（Endpoint） | 说明 |
|--------------|-------------------|------|
| 疯抢榜     | `/dtk_go_app_api/v1/page-goods-ranking` | 返回实时抢购排行榜 |
| 9.9包邮     | `/dtk_go_app_api/v1/page-goods-nine-cate` | 先获取分类，再用分类ID调商品 |
| 咚咚抢     | `/dtk_go_app_api/v1/page-goods-ddq` | 需要场次ID（从分类接口获取） |
| 百亿补贴     | `/dtk_java_views_api/api/tb/activity/promote/bybt` | 返回补贴商品，注意`sys`字段 |
| 高佣精选     | `/api/category/single/page/get-single-page`（分类）<br>`/api/category/single/page/get-goods-by-categoryId`（商品） | 需要先获取分类，再获取商品 |
| 折上折     | 推测为 `/dtk_go_app_api/v1/page-goods-zheshangzhe` | 类似9.9包邮 |

**我们自己的搜索页**：建议从**疯抢榜**开始，因为端点简单、返回稳定。

---

## 二、参数构造规律

### 通用参数（所有接口都需要）
- `appKey`：我们的Key → `69dd9a4187317`
- `pageNo` / `pageId`：页码（从1开始）
- `pageSize`：每页数量（建议10-20）

### 特殊参数
- **分类ID类接口**（`cId`、`categoryId`）：需先从分类接口获取。
- **单页标识**（`singlePageId`）：对应单页类型（9=高佣精选，其他可能对应不同单页）。
- **场次ID**（`pageId` 咚咚抢）：从场次分类接口获取。

### 示例：疯抢榜请求
```javascript
const url = `https://dtkapi.ffquan.cn/dtk_go_app_api/v1/page-goods-ranking?cId=1&pageNo=1&pageSize=10&singlePageId=9&appKey=${APP_KEY}`;
```

---

## 三、返回数据处理规律

### 常见返回结构
1. **`{ code: 1, data: [...] }`**  
   常见于疯抢榜、9.9包邮等。  
   `data` 直接是商品数组。

2. **`{ code: 0, data: { lists: [...] } }`**  
   常见于高佣精选。  
   `data.lists` 是商品数组。

3. **`{ code: 200, data: { list: [...] } }`**  
   常见于百亿补贴。  
   `data.list` 是商品数组。

### 标准化处理（在我们代码中）
```javascript
function normalizeGoods(response) {
  const data = response.data;
  if (Array.isArray(data)) return data; // 情况1
  if (data && Array.isArray(data.lists)) return data.lists; // 情况2
  if (data && Array.isArray(data.list)) return data.list; // 情况3
  return [];
}
```

---

## 四、错误与异常处理规律

### 常见错误
1. **`code: 0, msg: "已过期"`**  
   - 原因：appKey无效或过期。  
   - 解决：检查appKey是否正确，或联系大淘客更新。

2. **`sys: null`**  
   - 原因：接口认为请求来源有问题（如Referrer、时间戳等）。  
   - 解决：确保用我们自己的服务端调用（避免浏览器CORS），或使用已验证的appKey。

3. **HTTP 40x/50x**  
   - 原因：网络问题、端点错误、参数缺失。  
   - 解决：检查端点URL、必需参数是否齐全。

---

## 五、调用方式选择规律

### 方式1：直接浏览器调用（不推荐）
- 问题：CORS限制，且暴露appKey。  
- 仅用于快速测试。

### 方式2：通过我们的Node代理（推荐）
- 使用已有的 `dataoke-new-proxy/app.js`。  
- 优点：隐藏appKey，解决CORS，可统一签名。  
- 示例：
  ```javascript
  // 前端调用我们的代理
  fetch('/api/proxy?url=encoded_url')
  ```

### 方式3：Next.js API路由（我们的选择）
- 在 `/app/api/` 下创建路由，服务端调用大淘客API。  
- 优点：完全控制，可缓存、可加工数据。  
- 示例：已测试的 `/api/test-ranking` 路由。

---

## 六、开发我们自己的搜索页步骤

1. **选一个端点测试**（已完成：疯抢榜 ✅）。  
2. **创建Next.js API路由**（如 `/app/api/ranking/route.ts`）。  
3. **在前端页面调用该路由**，获取数据并展示。  
4. **参考单页UI，但用我们自己的样式和组件**。  

---

## 七、关键注意事项

1. **appKey保密**：不要在前端代码里硬编码，通过服务端传递。  
2. **数据标准化**：不同接口返回结构不同，务必统一处理。  
3. **错误监控**：记录API返回的错误信息，方便排查。  
4. **分页实现**：单页通常无限滚动，我们可用传统分页或无限加载。  

---

**整理时间**：2026-04-29 12:55  
**整理者**：Sunshine (AI管家）  
**用途**：指导开发我们自己的搜索页功能，不依赖大淘客单页。