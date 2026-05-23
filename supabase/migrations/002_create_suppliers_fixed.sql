-- 删除旧表（如果存在）
DROP TABLE IF EXISTS suppliers;

-- 创建新表（修复字段长度和权限）
CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(500) NOT NULL,      -- 公司名（加长）
    address TEXT,                             -- 地址（无限制）
    original_phone VARCHAR(200),              -- 原电话（加长）
    contact_person VARCHAR(200),              -- 联系人（加长）
    category VARCHAR(200),                    -- 产品类别
    keywords TEXT,                            -- 关键字（无限制）
    website VARCHAR(1000),                    -- 官网
    shop_1688 VARCHAR(1000),                  -- 1688店铺链接
    phone_enhanced VARCHAR(200),              -- 补全电话
    mobile_phone VARCHAR(100),                -- 手机号
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_name)                      -- 公司名唯一
);

-- 创建索引加速查询
CREATE INDEX idx_suppliers_category ON suppliers(category);
CREATE INDEX idx_suppliers_company_name ON suppliers(company_name);

-- 启用行级安全
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- 创建权限策略
-- 1. 允许公开读取
CREATE POLICY "Allow public read access" 
    ON suppliers FOR SELECT 
    USING (true);

-- 2. 允许公开插入（用于数据导入）
CREATE POLICY "Allow public insert" 
    ON suppliers FOR INSERT 
    WITH CHECK (true);

-- 3. 允许公开更新（用于后续补全电话）
CREATE POLICY "Allow public update" 
    ON suppliers FOR UPDATE 
    USING (true) 
    WITH CHECK (true);
