CREATE TABLE IF NOT EXISTS t_p41710039_website_creation_pro.catalog_games (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  image TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  badge TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO t_p41710039_website_creation_pro.catalog_games (id, name, image, description, badge, sort_order) VALUES
('steal-a-brainrot', 'Steal a Brainrot', 'https://cdn.poehali.dev/projects/55eebfd7-5c19-4adf-ae5d-100fe458b847/bucket/223b3027-a4bf-4dbb-9bda-056880fda77e.png', 'Юниты, Lucky Blocks, Trade Tokens и редкие мутации', '🔥 Хит', 1),
('blade-ball', 'Blade Ball', 'https://cdn.poehali.dev/projects/55eebfd7-5c19-4adf-ae5d-100fe458b847/bucket/1bedf365-0fc1-476b-8d20-8b269805d290.png', 'Мечи, способности и игровая валюта', NULL, 2),
('rivals', 'Rivals', 'https://cdn.poehali.dev/projects/55eebfd7-5c19-4adf-ae5d-100fe458b847/bucket/80e8ab2f-8348-4cbb-ad3c-61c99a3e52eb.png', 'Скины, валюта и предметы для Rivals', NULL, 3),
('blox-fruits', 'Blox Fruits', 'https://cdn.poehali.dev/projects/55eebfd7-5c19-4adf-ae5d-100fe458b847/bucket/ef4b289a-a2e5-4ec5-a786-462f55acca85.png', 'Фрукты, боссы, игровая валюта', NULL, 4),
('gift-op', 'Escape Tsunami For Brainrots!', 'https://cdn.poehali.dev/projects/55eebfd7-5c19-4adf-ae5d-100fe458b847/bucket/43c99621-39bd-4d09-81f1-24201aa5dd32.png', 'Подарки и редкие предметы', NULL, 5)
ON CONFLICT (id) DO NOTHING;
