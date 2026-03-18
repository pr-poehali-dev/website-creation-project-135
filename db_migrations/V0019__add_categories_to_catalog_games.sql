ALTER TABLE t_p41710039_website_creation_pro.catalog_games
  ADD COLUMN IF NOT EXISTS categories jsonb NOT NULL DEFAULT '[]'::jsonb;