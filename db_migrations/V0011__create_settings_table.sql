CREATE TABLE IF NOT EXISTS t_p41710039_website_creation_pro.settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO t_p41710039_website_creation_pro.settings (key, value) VALUES ('usd_rate', '81.91')
ON CONFLICT (key) DO NOTHING;
