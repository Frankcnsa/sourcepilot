-- Sourcing Items Table
-- 用于存储用户从 Search Source 添加到清单的商品

CREATE TABLE IF NOT EXISTS sourcing_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    title TEXT NOT NULL,
    original_title TEXT,
    price TEXT NOT NULL,
    original_price TEXT,
    image TEXT,
    shop TEXT,
    sales TEXT,
    link TEXT NOT NULL,
    description TEXT,
    query TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS sourcing_items_user_id_idx ON sourcing_items(user_id);
CREATE INDEX IF NOT EXISTS sourcing_items_created_at_idx ON sourcing_items(created_at DESC);

-- 启用 RLS (Row Level Security)
ALTER TABLE sourcing_items ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户只能访问自己的数据
CREATE POLICY "Users can only access their own sourcing items"
    ON sourcing_items
    FOR ALL
    USING (auth.uid() = user_id);

-- Search History Table (可选，用于记录搜索历史)
CREATE TABLE IF NOT EXISTS search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    results_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS search_history_user_id_idx ON search_history(user_id);
CREATE INDEX IF NOT EXISTS search_history_created_at_idx ON search_history(created_at DESC);

ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own search history"
    ON search_history
    FOR ALL
    USING (auth.uid() = user_id);
