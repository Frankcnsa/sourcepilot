-- 对话记录表
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT NOT NULL,
  phase INTEGER DEFAULT 1, -- 当前阶段 1-4
  status TEXT DEFAULT 'active', -- active, completed, paused
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 单条消息记录表
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'user' | 'assistant' | 'system'
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}', -- 额外信息如token数、模型等
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 需求收集信息表（第一阶段数据）
CREATE TABLE IF NOT EXISTS procurement_requirements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  product_name TEXT,
  product_usage TEXT,
  specifications JSONB,
  quantity INTEGER,
  target_price TEXT,
  delivery_time TEXT,
  certifications JSONB,
  supplier_region TEXT,
  brand_requirements TEXT,
  payment_terms TEXT,
  missing_fields JSONB DEFAULT '[]',
  info_completeness INTEGER DEFAULT 0, -- 0-10
  ready_to_generate BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_session ON chat_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_requirements_conversation ON procurement_requirements(conversation_id);

-- 更新时间的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_conversations_updated_at ON chat_conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_requirements_updated_at ON procurement_requirements;
CREATE TRIGGER update_requirements_updated_at
  BEFORE UPDATE ON procurement_requirements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
