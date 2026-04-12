-- 添加 title 字段到 chat_conversations 表
ALTER TABLE chat_conversations 
ADD COLUMN IF NOT EXISTS title TEXT;

-- 为现有记录设置默认标题
UPDATE chat_conversations 
SET title = 'New Chat' 
WHERE title IS NULL;