export const CHAT_URL = "https://functions.poehali.dev/5dc1e3a3-dd70-49b6-a971-dd798391a238";
export const ORDERS_URL = "https://functions.poehali.dev/f852d147-eae1-4265-a94d-63d014c42231";

export const CATALOG_ITEMS = [
  { id: 1,  name: "Secret Lucky Block x10" },
  { id: 2,  name: "los Tacos Lucky Block 300m x10" },
  { id: 3,  name: "Heart Lucky Blocks x10" },
  { id: 4,  name: "Quesadilla Crocodila x10" },
  { id: 5,  name: "Burrito Bandito x10" },
  { id: 6,  name: "Los Quesadilla x10" },
  { id: 7,  name: "Chicleteira Bicicleteira x10" },
  { id: 8,  name: "67 x10" },
  { id: 9,  name: "La Grande Combinasion x10" },
  { id: 10, name: "Los Nooo My Hotsportsitos x10" },
  { id: 11, name: "Random PACK SAB x10" },
  { id: 12, name: "Divine Secret Lucky Block x10" },
  { id: 13, name: "Leprechaun Lucky Block x10" },
];

export const GAMES_LIST = [
  { id: "steal-a-brainrot", name: "Steal a Brainrot" },
  { id: "blade-ball", name: "Blade Ball" },
  { id: "rivals", name: "Rivals" },
  { id: "blox-fruits", name: "Blox Fruits" },
  { id: "gift-op", name: "Escape Tsunami For Brainrots!" },
];

export type Chat = { id: string; visitor_name: string; visitor_id: string; status: string; last_message: string; msg_count: number; updated_at: string; };
export type Message = { id: string; sender: string; text: string; created_at: string };
export type Order = { order_id: string; item_name: string; amount_usd: number; quantity: number; network: string; status: string; created_at: string; };
export type StockRow = { item_id: number; available: number; total: number };
export type Account = { id: string; credentials: string; is_sold: boolean; sold_at: string | null; created_at: string };
export type CatalogItemAdmin = { id: number; name: string; price_usd: number; stock: number; emoji: string; category: string; game: string; sort_order: number };
export type GameAdmin = { id: string; name: string; image: string; description: string; badge: string | null; sort_order: number };

export function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "только что";
  if (diff < 3600) return Math.floor(diff / 60) + " мин назад";
  if (diff < 86400) return Math.floor(diff / 3600) + " ч назад";
  return Math.floor(diff / 86400) + " д назад";
}
