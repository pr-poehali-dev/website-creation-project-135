ALTER TABLE t_p41710039_website_creation_pro.chats
  ADD COLUMN IF NOT EXISTS chat_type TEXT NOT NULL DEFAULT 'support',
  ADD COLUMN IF NOT EXISTS last_message TEXT,
  ADD COLUMN IF NOT EXISTS auto_close_at TIMESTAMP;

-- Помечаем чаты созданные из заказов как 'order'
UPDATE t_p41710039_website_creation_pro.chats c
SET chat_type = 'order'
WHERE EXISTS (
  SELECT 1 FROM t_p41710039_website_creation_pro.orders o
  WHERE o.chat_id = c.id
);
