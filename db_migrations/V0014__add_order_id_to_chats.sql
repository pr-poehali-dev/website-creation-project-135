ALTER TABLE t_p41710039_website_creation_pro.chats
  ADD COLUMN IF NOT EXISTS order_id uuid NULL REFERENCES t_p41710039_website_creation_pro.orders(id);

CREATE INDEX IF NOT EXISTS idx_chats_order_id ON t_p41710039_website_creation_pro.chats(order_id);
