-- 供应商表
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,      -- 公司名
    address TEXT,                             -- 地址
    original_phone VARCHAR(100),              -- 原电话（展会提供）
    contact_person VARCHAR(100),              -- 联系人
    category VARCHAR(100),                    -- 产品类别
    keywords TEXT,                            -- 关键字
    website VARCHAR(500),                     -- 官网
    shop_1688 VARCHAR(500),                   -- 1688店铺链接
    phone_enhanced VARCHAR(100),              -- 补全电话（1688获取）
    mobile_phone VARCHAR(100),                -- 手机号（1688获取）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_name)                      -- 公司名唯一
);

-- 创建索引加速查询
CREATE INDEX idx_suppliers_category ON suppliers(category);
CREATE INDEX idx_suppliers_company_name ON suppliers(company_name);

-- 启用行级安全（可选）
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- 创建公开读取策略
CREATE POLICY "Allow public read access" ON suppliers
    FOR SELECT USING (true);
