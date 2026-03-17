ALTER TABLE t_p41710039_website_creation_pro.orders
  ADD COLUMN IF NOT EXISTS crypto_rate NUMERIC(18,8),
  ADD COLUMN IF NOT EXISTS crypto_amount NUMERIC(18,8);
