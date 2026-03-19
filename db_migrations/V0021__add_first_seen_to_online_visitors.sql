ALTER TABLE t_p41710039_website_creation_pro.online_visitors
ADD COLUMN IF NOT EXISTS first_seen TIMESTAMP DEFAULT NOW();