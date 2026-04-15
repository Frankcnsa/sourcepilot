// 万邦API配置
const ONEBOUND_API_URL = 'http://api.onebound.cn/taobao/api_call.php';
const ONEBOUND_API_KEY = process.env.ONEBOUND_API_KEY || '';

// 商品数据结构
export interface WanbangProduct {
  num_iid: string;
  title: string;
  pic_url: string;
  price: string;
  promotion_price?: string;
  sales: number;
  seller_id: string;
  seller_nick: string;
  detail_url: string;
  item_url?: string;
  location?: string;
}

// 搜索商品
export async function searchWanbang(
  query: string,
  page: number = 1,
  pageSize: number = 20
): Promise<{ products: WanbangProduct[]; total: number }> {
  if (!ONEBOUND_API_KEY) {
    throw new Error('ONEBOUND_API_KEY not configured');
  }
  
  try {
    const params = new URLSearchParams({
      key: ONEBOUND_API_KEY,
      api_name: 'item_search',
      q: query,
      page: String(page),
      page_size: String(pageSize),
      sort: 'default'
    });
    
    const response = await fetch(`${ONEBOUND_API_URL}?${params.toString()}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    const items = data.items?.item || [];
    const products: WanbangProduct[] = items.map((item: any) => ({
      num_iid: String(item.num_iid || item.id || ''),
      title: item.title || 'Unknown Product',
      pic_url: item.pic_url || item.pict_url || '',
      price: String(item.price || '0'),
      promotion_price: item.promotion_price,
      sales: parseInt(item.sales || item.volume || '0'),
      seller_id: String(item.seller_id || item.nick || ''),
      seller_nick: item.seller_nick || item.nick || 'Unknown Shop',
      detail_url: item.detail_url || `https://item.taobao.com/item.htm?id=${item.num_iid}`,
      item_url: item.item_url,
      location: item.item_location || item.location
    }));
    
    return {
      products,
      total: data.items?.total_results || products.length
    };
  } catch (error) {
    console.error('[Wanbang] Search failed:', error);
    return { products: [], total: 0 };
  }
}

// 获取商品详情
export async function getWanbangDetail(
  num_iid: string
): Promise<WanbangProduct & { 
  desc?: string;
  skus?: any[];
  props?: any[];
  images?: string[];
}> {
  if (!ONEBOUND_API_KEY) {
    throw new Error('ONEBOUND_API_KEY not configured');
  }
  
  try {
    const params = new URLSearchParams({
      key: ONEBOUND_API_KEY,
      api_name: 'item_get',
      num_iid: num_iid,
      is_promotion: '1'
    });
    
    const response = await fetch(`${ONEBOUND_API_URL}?${params.toString()}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    const item = data.item || {};
    
    return {
      num_iid: String(item.num_iid || num_iid),
      title: item.title || 'Unknown Product',
      pic_url: item.pic_url || '',
      price: String(item.price || '0'),
      promotion_price: item.promotion_price,
      sales: parseInt(item.sales || '0'),
      seller_id: String(item.seller_id || ''),
      seller_nick: item.seller_nick || 'Unknown Shop',
      detail_url: item.detail_url || `https://item.taobao.com/item.htm?id=${num_iid}`,
      item_url: item.item_url,
      location: item.location,
      desc: item.desc,
      skus: item.skus?.sku || [],
      props: item.props?.prop || [],
      images: item.item_imgs?.item_img?.map((img: any) => img.url) || []
    };
  } catch (error) {
    console.error('[Wanbang] Get detail failed:', error);
    throw error;
  }
}

// 模拟热搜词（万邦无此API）
export function getHotWords(): string[] {
  return [
    'phone case',
    'cable',
    'headphones',
    'charger',
    'screen protector',
    'bluetooth speaker',
    'power bank',
    'smart watch'
  ];
}

// 模拟分类（万邦无此API）
export function getCategories() {
  return [
    { id: '1', name: 'Electronics' },
    { id: '2', name: 'Fashion' },
    { id: '3', name: 'Home' },
    { id: '4', name: 'Beauty' },
    { id: '5', name: 'Sports' },
    { id: '6', name: 'Toys' }
  ];
}
