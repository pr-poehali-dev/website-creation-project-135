CREATE TABLE IF NOT EXISTS t_p41710039_website_creation_pro.catalog_items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price_usd NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  emoji TEXT NOT NULL DEFAULT '📦',
  category TEXT NOT NULL DEFAULT 'other',
  game TEXT NOT NULL DEFAULT 'steal-a-brainrot',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO t_p41710039_website_creation_pro.catalog_items (id, name, price_usd, stock, emoji, category, game, sort_order) VALUES
(1,  'Secret Lucky Block x10',          1.70, 0, '🎲', 'lucky', 'steal-a-brainrot', 1),
(2,  'los Tacos Lucky Block 300m x10',  1.20, 0, '🌮', 'lucky', 'steal-a-brainrot', 2),
(3,  'Heart Lucky Blocks x10',          1.30, 0, '❤️', 'lucky', 'steal-a-brainrot', 3),
(4,  'Quesadilla Crocodila x10',        1.90, 0, '🐊', 'lucky', 'steal-a-brainrot', 4),
(5,  'Burrito Bandito x10',             1.90, 0, '🌯', 'lucky', 'steal-a-brainrot', 5),
(6,  'Los Quesadilla x10',              1.80, 0, '🧀', 'lucky', 'steal-a-brainrot', 6),
(7,  'Chicleteira Bicicleteira x10',    1.50, 0, '🚲', 'lucky', 'steal-a-brainrot', 7),
(8,  '67 x10',                          2.50, 0, '🎯', 'lucky', 'steal-a-brainrot', 8),
(9,  'La Grande Combinasion x10',       2.30, 0, '✨', 'lucky', 'steal-a-brainrot', 9),
(10, 'Los Nooo My Hotsportsitos x10',   2.50, 0, '🌶️', 'lucky', 'steal-a-brainrot', 10),
(11, 'Random PACK SAB x10',             0.50, 0, '📦', 'lucky', 'steal-a-brainrot', 11),
(12, 'Divine Secret Lucky Block x10',   6.00, 0, '🔮', 'lucky', 'steal-a-brainrot', 12),
(13, 'Leprechaun Lucky Block x10',      1.40, 0, '🍀', 'lucky', 'steal-a-brainrot', 13)
ON CONFLICT (id) DO NOTHING;

SELECT setval('t_p41710039_website_creation_pro.catalog_items_id_seq', 100);
