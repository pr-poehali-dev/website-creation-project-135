ALTER TABLE t_p41710039_website_creation_pro.orders
  ADD COLUMN IF NOT EXISTS yookassa_payment_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS payment_url TEXT,
  ADD COLUMN IF NOT EXISTS amount NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS user_name TEXT,
  ADD COLUMN IF NOT EXISTS order_number VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_orders_yookassa_payment_id ON t_p41710039_website_creation_pro.orders(yookassa_payment_id);
