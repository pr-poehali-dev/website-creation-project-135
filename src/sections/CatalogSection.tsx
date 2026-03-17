import { useState } from "react";
import { createPortal } from "react-dom";
import Icon from "@/components/ui/icon";
import BuyModal from "@/components/BuyModal";

const USD_TO_RUB_DEFAULT = 81.91;

export type CatalogItem = {
  id: number;
  name: string;
  priceUsd: number;
  stock: number;
  emoji: string;
  category: "lucky" | "other";
  game: string;
};

export type Game = {
  id: string;
  name: string;
  image: string;
  description: string;
  badge?: string;
};

export const GAMES: Game[] = [
  { id: "steal-a-brainrot", name: "Steal a Brainrot", image: "https://cdn.poehali.dev/projects/55eebfd7-5c19-4adf-ae5d-100fe458b847/bucket/223b3027-a4bf-4dbb-9bda-056880fda77e.png", description: "Юниты, Lucky Blocks, Trade Tokens и редкие мутации", badge: "🔥 Хит" },
  { id: "blade-ball", name: "Blade Ball", image: "https://cdn.poehali.dev/projects/55eebfd7-5c19-4adf-ae5d-100fe458b847/bucket/1bedf365-0fc1-476b-8d20-8b269805d290.png", description: "Мечи, способности и игровая валюта" },
  { id: "rivals", name: "Rivals", image: "https://cdn.poehali.dev/projects/55eebfd7-5c19-4adf-ae5d-100fe458b847/bucket/80e8ab2f-8348-4cbb-ad3c-61c99a3e52eb.png", description: "Скины, валюта и предметы для Rivals" },
  { id: "blox-fruits", name: "Blox Fruits", image: "https://cdn.poehali.dev/projects/55eebfd7-5c19-4adf-ae5d-100fe458b847/bucket/ef4b289a-a2e5-4ec5-a786-462f55acca85.png", description: "Фрукты, боссы, игровая валюта" },
  { id: "gift-op", name: "Escape Tsunami For Brainrots!", image: "https://cdn.poehali.dev/projects/55eebfd7-5c19-4adf-ae5d-100fe458b847/bucket/43c99621-39bd-4d09-81f1-24201aa5dd32.png", description: "Подарки и редкие предметы" },
];

export const catalogItems: CatalogItem[] = [
  { id: 1,  name: "Secret Lucky Block x10",          priceUsd: 1.70, stock: 0, emoji: "🎲", category: "lucky", game: "steal-a-brainrot" },
  { id: 2,  name: "los Tacos Lucky Block 300m x10",  priceUsd: 1.20, stock: 0, emoji: "🌮", category: "lucky", game: "steal-a-brainrot" },
  { id: 3,  name: "Heart Lucky Blocks x10",          priceUsd: 1.30, stock: 0, emoji: "❤️", category: "lucky", game: "steal-a-brainrot" },
  { id: 4,  name: "Quesadilla Crocodila x10",        priceUsd: 1.90, stock: 0, emoji: "🐊", category: "lucky", game: "steal-a-brainrot" },
  { id: 5,  name: "Burrito Bandito x10",             priceUsd: 1.90, stock: 0, emoji: "🌯", category: "lucky", game: "steal-a-brainrot" },
  { id: 6,  name: "Los Quesadilla x10",              priceUsd: 1.80, stock: 0, emoji: "🧀", category: "lucky", game: "steal-a-brainrot" },
  { id: 7,  name: "Chicleteira Bicicleteira x10",    priceUsd: 1.50, stock: 0, emoji: "🚲", category: "lucky", game: "steal-a-brainrot" },
  { id: 8,  name: "67 x10",                          priceUsd: 2.50, stock: 0, emoji: "🎯", category: "lucky", game: "steal-a-brainrot" },
  { id: 9,  name: "La Grande Combinasion x10",       priceUsd: 2.30, stock: 0, emoji: "✨", category: "lucky", game: "steal-a-brainrot" },
  { id: 10, name: "Los Nooo My Hotsportsitos x10",   priceUsd: 2.50, stock: 0, emoji: "🌶️", category: "lucky", game: "steal-a-brainrot" },
  { id: 11, name: "Random PACK SAB x10",             priceUsd: 0.50, stock: 0, emoji: "📦", category: "lucky", game: "steal-a-brainrot" },
  { id: 12, name: "Divine Secret Lucky Block x10",   priceUsd: 6.00, stock: 0, emoji: "🔮", category: "lucky", game: "steal-a-brainrot" },
  { id: 13, name: "Leprechaun Lucky Block x10",      priceUsd: 1.40, stock: 0, emoji: "🍀", category: "lucky", game: "steal-a-brainrot" },
];

function CatalogCard({ item, usdRate = USD_TO_RUB_DEFAULT }: { item: CatalogItem; usdRate?: number }) {
  const inStock = item.stock > 0;
  const priceRub = Math.ceil(item.priceUsd * usdRate);
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="rounded-2xl p-5" style={{ background: "rgba(22, 31, 44, 0.9)", border: `1px solid ${inStock ? "rgba(0,176,111,0.2)" : "rgba(255,255,255,0.05)"}`, opacity: inStock ? 1 : 0.7 }}>
        <div className="flex justify-between items-start mb-3">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md font-body font-bold text-xs"
            style={{ background: inStock ? "rgba(0,176,111,0.15)" : "rgba(232,52,58,0.15)", color: inStock ? "#00D080" : "#FF6B6B" }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: inStock ? "#00D080" : "#FF6B6B" }} />
            {inStock ? "В наличии" : "Нет в наличии"}
          </span>
          <div className="text-2xl">{item.emoji}</div>
        </div>

        <h3 className="font-display font-bold text-base text-white mb-3 leading-tight">{item.name}</h3>

        <div className="flex items-center justify-between">
          <div>
            <div className="font-display font-bold text-xl" style={{ color: "#4DA6FF" }}>💸 {priceRub} ₽</div>
            <div className="font-body text-xs text-white/40 mt-0.5">≈ ${item.priceUsd.toFixed(2)}</div>
          </div>
          {inStock ? (
            <button type="button" onClick={() => setOpen(true)} style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)", borderRadius: "12px", padding: "12px 20px", minWidth: "84px", minHeight: "44px", touchAction: "manipulation", WebkitTapHighlightColor: "transparent", border: "none", cursor: "pointer", color: "white", fontFamily: "Nunito, sans-serif", fontWeight: 700, fontSize: "14px" }}>
              Купить
            </button>
          ) : (
            <span style={{ background: "rgba(255,255,255,0.08)", borderRadius: "12px", padding: "12px 20px", minWidth: "84px", minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.3)", fontFamily: "Nunito, sans-serif", fontWeight: 700, fontSize: "14px" }}>
              Ждать
            </span>
          )}
        </div>
      </div>
      {open && createPortal(<BuyModal item={item} onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}

type Props = {
  dbCatalog: CatalogItem[];
  dbGames: Game[];
  dbPrices: Record<string, number>;
  dbStock: Record<string, number>;
  usdRate: number;
  selectedGame: string | null;
  onSelectGame: (id: string | null) => void;
  onOpenSupport: () => void;
};

export default function CatalogSection({ dbCatalog, dbGames, dbPrices, dbStock, usdRate, selectedGame, onSelectGame, onOpenSupport }: Props) {
  const games = dbGames.length > 0 ? dbGames : GAMES;
  const items = dbCatalog.length > 0 ? dbCatalog : catalogItems;

  return (
    <section id="Каталог" className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="section-title text-white mb-3">🛒 <span className="roblox-text-gradient">Каталог</span></h2>
          <p className="text-white/50 font-body text-base">Выбери нужный товар и получи мгновенно</p>
          <div className="pixel-divider max-w-xs mx-auto mt-4" />
        </div>

        {!selectedGame ? (
          <div>
            <p className="text-white/40 font-body text-sm mb-6 text-center">Выбери игру, чтобы увидеть товары</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {games.map((game) => (
                <button key={game.id} onClick={() => onSelectGame(game.id)}
                  className="rounded-2xl overflow-hidden text-left transition-all hover:scale-[1.02] hover:shadow-2xl group"
                  style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(22,31,44,0.9)" }}>
                  <div className="relative h-44 overflow-hidden">
                    <img src={game.image} alt={game.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    {game.badge && (
                      <div className="absolute top-3 left-3 px-2 py-1 rounded-lg font-display font-bold text-xs text-white"
                        style={{ background: "linear-gradient(135deg, #E8343A, #B02020)" }}>{game.badge}</div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="font-display font-bold text-white text-base mb-1">{game.name}</div>
                    <div className="font-body text-white/50 text-xs mb-3">{game.description}</div>
                    <div className="inline-flex items-center gap-1 text-xs font-body font-bold text-blue-400">
                      Смотреть товары <Icon name="ArrowRight" size={12} />
                    </div>
                  </div>
                </button>
              ))}
              <div className="rounded-2xl p-6 flex flex-col items-center justify-center text-center min-h-[220px]"
                style={{ border: "1px dashed rgba(255,255,255,0.1)", background: "rgba(22,31,44,0.4)" }}>
                <div className="text-4xl mb-3">🎮</div>
                <div className="font-display font-bold text-white/40 text-base mb-1">Скоро</div>
                <div className="font-body text-white/25 text-xs">Добавляем новые игры</div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <button onClick={() => onSelectGame(null)}
              className="inline-flex items-center gap-2 mb-6 font-body text-sm text-white/50 hover:text-white transition-colors">
              <Icon name="ChevronLeft" size={16} /> Все игры
            </button>

            {games.filter(g => g.id === selectedGame).map(game => (
              <div key={game.id} className="rounded-2xl overflow-hidden mb-8 relative h-36" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                <img src={game.image} alt={game.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-end p-5" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)" }}>
                  <div>
                    <div className="font-display font-bold text-white text-xl">{game.name}</div>
                    <div className="font-body text-white/60 text-xs">{game.description}</div>
                  </div>
                </div>
              </div>
            ))}

            <div className="mb-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.filter(i => i.game === selectedGame).map((item) => (
                  <CatalogCard key={item.id} usdRate={usdRate} item={{ ...item, priceUsd: dbPrices[String(item.id)] ?? item.priceUsd, stock: dbStock[String(item.id)] ?? item.stock }} />
                ))}
              </div>
            </div>

            <div className="rounded-2xl p-5 mb-2 flex flex-col sm:flex-row items-center gap-4"
              style={{ background: "rgba(22,31,44,0.9)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div>
                <div className="font-display font-bold text-white text-base mb-1">💳 ПРИНИМАЕМ КРИПТУ</div>
                <div className="font-body text-white/40 text-sm">Быстро и без комиссий</div>
              </div>
              <div className="flex flex-wrap gap-2 sm:ml-auto">
                {["LTC", "USDT (BEP20)", "USDC (ERC20)", "SOL"].map(c => (
                  <span key={c} className="px-3 py-1 rounded-lg font-body font-bold text-xs text-white"
                    style={{ background: "rgba(0,102,255,0.15)", border: "1px solid rgba(0,102,255,0.25)" }}>{c}</span>
                ))}
              </div>
            </div>

            <div className="mt-8 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4"
              style={{ background: "linear-gradient(135deg, rgba(0,102,255,0.1), rgba(232,52,58,0.1))", border: "1px solid rgba(0,102,255,0.2)" }}>
              <div>
                <div className="font-display font-bold text-white text-xl">Нет нужного товара?</div>
                <div className="font-body text-white/50 text-sm mt-1">Напишите нам — найдём специально для вас</div>
              </div>
              <button onClick={onOpenSupport}
                className="btn-shimmer px-6 py-3 rounded-xl font-body font-bold text-white whitespace-nowrap transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, #E8343A, #B02020)" }}>
                💬 Написать в поддержку
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
