import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import BuyModal from "@/components/BuyModal";
import { useAuth } from "@/context/AuthContext";

const HERO_IMG = "https://cdn.poehali.dev/projects/55eebfd7-5c19-4adf-ae5d-100fe458b847/files/063fb226-d199-4cc0-8b87-e4836625f644.jpg";
const ITEMS_IMG = "https://cdn.poehali.dev/projects/55eebfd7-5c19-4adf-ae5d-100fe458b847/files/34974bc9-8d1b-47ea-a085-b096136f7c56.jpg";

const USD_TO_RUB = 90;

type CatalogItem = {
  id: number;
  name: string;
  priceUsd: number;
  stock: number;
  emoji: string;
  category: "lucky" | "other";
};

const catalogItems: CatalogItem[] = [
  { id: 1,  name: "Secret Lucky Block",           priceUsd: 1.70, stock: 0,   emoji: "🎲", category: "lucky" },
  { id: 2,  name: "los Tacos Lucky Block 300m",   priceUsd: 1.20, stock: 62,  emoji: "🌮", category: "lucky" },
  { id: 3,  name: "Heart Lucky Blocks",           priceUsd: 1.30, stock: 0,   emoji: "❤️", category: "lucky" },
  { id: 4,  name: "Quesadilla Crocodila",         priceUsd: 1.90, stock: 64,  emoji: "🐊", category: "lucky" },
  { id: 5,  name: "Burrito Bandito",              priceUsd: 1.90, stock: 42,  emoji: "🌯", category: "lucky" },
  { id: 6,  name: "Los Quesadilla",               priceUsd: 1.80, stock: 0,   emoji: "🧀", category: "lucky" },
  { id: 7,  name: "Chicleteira Bicicleteira",     priceUsd: 1.50, stock: 52,  emoji: "🚲", category: "lucky" },
  { id: 8,  name: "67",                           priceUsd: 2.50, stock: 226, emoji: "🎯", category: "lucky" },
  { id: 9,  name: "La Grande Combinasion",        priceUsd: 2.30, stock: 190, emoji: "✨", category: "lucky" },
  { id: 10, name: "Los Nooo My Hotsportsitos",    priceUsd: 2.50, stock: 49,  emoji: "🌶️", category: "lucky" },
  { id: 11, name: "Random PACK SAB x10",          priceUsd: 0.50, stock: 5,   emoji: "📦", category: "lucky" },
  { id: 12, name: "Divine Secret Lucky Block",    priceUsd: 6.00, stock: 0,   emoji: "🔮", category: "lucky" },
  { id: 13, name: "Leprechaun Lucky Block",       priceUsd: 1.40, stock: 0,   emoji: "🍀", category: "lucky" },
];

const reviews = [
  { name: "PlayerOne_Roblox", text: "Всё пришло мгновенно! Топовый магазин, буду брать ещё", stars: 5, emoji: "🎮" },
  { name: "XxGamerxX_2024", text: "Лучшее место для покупки Robux. Честные цены, быстро!", stars: 5, emoji: "⭐" },
  { name: "ProBuilder_RBX", text: "Уже 5-й раз покупаю, всегда всё чётко. Рекомендую!", stars: 5, emoji: "🏗️" },
];

const sections = ["Главная", "Каталог", "Отзывы", "Поддержка"];

function CatalogCard({ item }: { item: CatalogItem }) {
  const inStock = item.stock > 0;
  const priceRub = Math.ceil(item.priceUsd * USD_TO_RUB);
  const [open, setOpen] = useState(false);

  function handleBuy() {
    console.log("BUY CLICKED:", item.name, "inStock:", inStock);
    setOpen(true);
  }

  return (
    <>
      <div
        className="rounded-2xl p-5"
        style={{
          background: "rgba(22, 31, 44, 0.9)",
          border: `1px solid ${inStock ? "rgba(0,176,111,0.2)" : "rgba(255,255,255,0.05)"}`,
          opacity: inStock ? 1 : 0.7,
        }}
      >
        <div className="flex justify-between items-start mb-3">
          <span
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md font-body font-bold text-xs"
            style={{
              background: inStock ? "rgba(0,176,111,0.15)" : "rgba(232,52,58,0.15)",
              color: inStock ? "#00D080" : "#FF6B6B",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: inStock ? "#00D080" : "#FF6B6B" }} />
            {inStock ? `В наличии: ${item.stock}` : "Нет в наличии"}
          </span>
          <div className="text-2xl">{item.emoji}</div>
        </div>

        <h3 className="font-display font-bold text-base text-white mb-3 leading-tight">{item.name}</h3>

        <div className="flex items-center justify-between">
          <div>
            <div className="font-display font-bold text-xl" style={{ color: "#4DA6FF" }}>
              💸 ${item.priceUsd.toFixed(2)}
            </div>
            <div className="font-body text-xs text-white/40 mt-0.5">≈ {priceRub} ₽</div>
          </div>
          {inStock ? (
            <button
              type="button"
              onClick={handleBuy}
              style={{
                background: "linear-gradient(135deg, #0066FF, #0044BB)",
                borderRadius: "12px",
                padding: "12px 20px",
                minWidth: "84px",
                minHeight: "44px",
                touchAction: "manipulation",
                WebkitTapHighlightColor: "transparent",
                border: "none",
                cursor: "pointer",
                color: "white",
                fontFamily: "Nunito, sans-serif",
                fontWeight: 700,
                fontSize: "14px",
              }}
            >
              Купить
            </button>
          ) : (
            <span
              style={{
                background: "rgba(255,255,255,0.08)",
                borderRadius: "12px",
                padding: "12px 20px",
                minWidth: "84px",
                minHeight: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(255,255,255,0.3)",
                fontFamily: "Nunito, sans-serif",
                fontWeight: 700,
                fontSize: "14px",
              }}
            >
              Ждать
            </span>
          )}
        </div>
      </div>

      {open && createPortal(
        <BuyModal item={item} onClose={() => setOpen(false)} />,
        document.body
      )}
    </>
  );
}

export default function Index() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState("Главная");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);


  useEffect(() => {
    setLoaded(true);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      setActiveSection(id);
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "#0F1923" }}>

      {/* ---- NAVBAR ---- */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer animate-pixel-glitch"
            onClick={() => scrollTo("Главная")}
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg font-display font-bold text-white"
              style={{ background: "linear-gradient(135deg, #0066FF, #E8343A)" }}>
              C
            </div>
            <span className="font-display font-bold text-xl tracking-wider text-white">
              Cambeck<span style={{ color: "#FFB800" }}>SHOP</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {sections.map((s) => (
              <button
                key={s}
                onClick={() => scrollTo(s)}
                className={`px-4 py-2 rounded-lg font-body font-bold text-sm transition-all duration-200 ${
                  activeSection === s
                    ? "text-white font-extrabold"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
                style={activeSection === s ? { background: "rgba(0,102,255,0.15)", color: "#4DA6FF" } : {}}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <Link to="/profile"
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl font-body font-bold text-sm text-white transition-all hover:scale-105"
                style={{ background: "rgba(0,102,255,0.15)", border: "1px solid rgba(0,102,255,0.3)" }}>
                <div className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold"
                  style={{ background: "linear-gradient(135deg, #0066FF, #E8343A)" }}>
                  {user.username[0].toUpperCase()}
                </div>
                {user.username}
              </Link>
            ) : (
              <Link to="/login"
                className="hidden md:block px-4 py-2 rounded-xl font-body font-bold text-sm text-white/70 hover:text-white transition-all"
                style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                Войти
              </Link>
            )}
            <button
              onClick={() => scrollTo("Каталог")}
              className="hidden md:block btn-shimmer px-5 py-2 rounded-xl font-body font-bold text-sm text-white transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)" }}
            >
              Каталог
            </button>
            <button
              className="md:hidden text-white/70 hover:text-white p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Icon name={mobileMenuOpen ? "X" : "Menu"} size={22} />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden glass-card border-t border-white/5 px-4 py-3 flex flex-col gap-1 animate-slide-down">
            {sections.map((s) => (
              <button
                key={s}
                onClick={() => scrollTo(s)}
                className="w-full text-left px-4 py-3 rounded-lg font-body text-white/70 hover:text-white hover:bg-white/5 transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* ---- HERO ---- */}
      <section
        id="Главная"
        className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16"
      >
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0" style={{
            background: "linear-gradient(180deg, #0F1923 0%, rgba(15,25,35,0.5) 40%, rgba(15,25,35,0.8) 80%, #0F1923 100%)"
          }} />
          <div className="absolute inset-0" style={{
            background: "radial-gradient(ellipse at 30% 40%, rgba(0,102,255,0.12) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(232,52,58,0.08) 0%, transparent 60%)"
          }} />
        </div>

        <div className="absolute top-24 left-8 md:left-16 animate-float opacity-30">
          <div className="w-8 h-8 rounded" style={{ background: "#0066FF" }} />
        </div>
        <div className="absolute top-40 right-12 md:right-24 animate-float-delay opacity-30">
          <div className="w-6 h-6 rounded" style={{ background: "#E8343A" }} />
        </div>
        <div className="absolute bottom-40 left-16 md:left-32 animate-float-delay-2 opacity-20">
          <div className="w-10 h-10 rounded" style={{ background: "#FFB800" }} />
        </div>
        <div className="absolute top-1/3 right-8 animate-float opacity-20">
          <div className="w-5 h-5 rounded" style={{ background: "#00B06F" }} />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className={`transition-all duration-700 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-body font-bold mb-6"
              style={{ background: "rgba(0,102,255,0.15)", border: "1px solid rgba(0,102,255,0.3)", color: "#4DA6FF" }}>
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
              Магазин онлайн • Быстрая доставка
            </div>
          </div>

          <h1 className={`font-display font-bold text-5xl md:text-7xl text-white mb-4 leading-tight transition-all duration-700 delay-100 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            Cambeck<span className="roblox-text-gradient">SHOP</span>
          </h1>

          <p className={`text-white/60 text-lg md:text-xl font-body mb-3 transition-all duration-700 delay-200 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            🎮 Лучший магазин Roblox товаров
          </p>

          <p className={`text-white/40 text-base font-body mb-10 transition-all duration-700 delay-300 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            Robux • Premium • Game Passes • Скидки
          </p>

          <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center transition-all duration-700 delay-400 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <button
              onClick={() => scrollTo("Каталог")}
              className="btn-shimmer w-full sm:w-auto px-8 py-4 rounded-2xl font-body font-extrabold text-lg text-white transition-all hover:scale-105 animate-pulse-glow"
              style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)" }}
            >
              🛒 Перейти в каталог
            </button>
            <button
              onClick={() => setReviewModalOpen(true)}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl font-body font-bold text-lg transition-all hover:scale-105"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)" }}
            >
              ⭐ Наши отзывы
            </button>
          </div>

          <div className={`mt-16 grid grid-cols-3 gap-4 max-w-md mx-auto transition-all duration-700 delay-500 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            {[
              { num: "1000+", label: "Продаж" },
              { num: "4.9⭐", label: "Рейтинг" },
              { num: "24/7", label: "Поддержка" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-display font-bold text-2xl text-white">{s.num}</div>
                <div className="font-body text-xs text-white/40">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-white/20">
          <Icon name="ChevronDown" size={28} />
        </div>
      </section>

      {/* ---- CATALOG ---- */}
      <section id="Каталог" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="section-title text-white mb-3">
              🛒 <span className="roblox-text-gradient">Каталог</span>
            </h2>
            <p className="text-white/50 font-body text-base">Выбери нужный товар и получи мгновенно</p>
            <div className="pixel-divider max-w-xs mx-auto mt-4" />
          </div>

          {/* Lucky Blocks */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="px-3 py-1 rounded-lg font-display font-bold text-sm text-white"
                style={{ background: "linear-gradient(135deg, #FFB800, #FF6B00)" }}>
                🎲 LUCKY BLOCKS
              </div>
              <div className="flex-1 h-px" style={{ background: "rgba(255,184,0,0.2)" }} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {catalogItems.filter(i => i.category === "lucky").map((item) => (
                <CatalogCard key={item.id} item={item} />
              ))}
            </div>
          </div>

          {/* Crypto payments */}
          <div className="rounded-2xl p-5 mb-2 flex flex-col sm:flex-row items-center gap-4"
            style={{ background: "rgba(22,31,44,0.9)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div>
              <div className="font-display font-bold text-white text-base mb-1">💳 ПРИНИМАЕМ КРИПТУ</div>
              <div className="font-body text-white/40 text-sm">Быстро и без комиссий</div>
            </div>
            <div className="flex flex-wrap gap-2 sm:ml-auto">
              {["LTC", "USDT (BEP20)", "USDC (ERC20)", "SOL"].map(c => (
                <span key={c} className="px-3 py-1 rounded-lg font-body font-bold text-xs text-white"
                  style={{ background: "rgba(0,102,255,0.15)", border: "1px solid rgba(0,102,255,0.25)" }}>
                  {c}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-10 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4"
            style={{ background: "linear-gradient(135deg, rgba(0,102,255,0.1), rgba(232,52,58,0.1))", border: "1px solid rgba(0,102,255,0.2)" }}>
            <div>
              <div className="font-display font-bold text-white text-xl">Нет нужного товара?</div>
              <div className="font-body text-white/50 text-sm mt-1">Напишите нам — найдём специально для вас</div>
            </div>
            <button
              onClick={() => setSupportModalOpen(true)}
              className="btn-shimmer px-6 py-3 rounded-xl font-body font-bold text-white whitespace-nowrap transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #E8343A, #B02020)" }}
            >
              💬 Написать в поддержку
            </button>
          </div>
        </div>
      </section>

      {/* ---- REVIEWS ---- */}
      <section id="Отзывы" className="py-20 px-4" style={{ background: "rgba(0,0,0,0.2)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="section-title text-white mb-3">
              ⭐ <span className="roblox-text-gradient">Отзывы</span>
            </h2>
            <p className="text-white/50 font-body text-base">Что говорят наши покупатели</p>
            <div className="pixel-divider max-w-xs mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
            {reviews.map((r, i) => (
              <div
                key={i}
                className="rounded-2xl p-5"
                style={{ background: "rgba(22, 31, 44, 0.9)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: "rgba(0,102,255,0.15)" }}>
                    {r.emoji}
                  </div>
                  <div>
                    <div className="font-body font-bold text-white text-sm">{r.name}</div>
                    <div className="text-yellow-400 text-xs">{"★".repeat(r.stars)}</div>
                  </div>
                </div>
                <p className="font-body text-white/60 text-sm leading-relaxed">"{r.text}"</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <p className="text-white/40 font-body text-sm mb-5">Все отзывы на внешних платформах:</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a
                href="https://beee.pro/shop/user/138944"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-shimmer inline-flex items-center gap-2 px-6 py-3 rounded-xl font-body font-bold text-sm text-white transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, #7B2FE0, #5B1FB0)" }}
              >
                <Icon name="Star" size={16} />
                Отзывы на Beee.pro #1
              </a>
              <a
                href="https://beee.pro/shop/user/325959"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-shimmer inline-flex items-center gap-2 px-6 py-3 rounded-xl font-body font-bold text-sm text-white transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, #7B2FE0, #5B1FB0)" }}
              >
                <Icon name="Star" size={16} />
                Отзывы на Beee.pro #2
              </a>
              <a
                href="https://easydonate.shop/users?id=019b3bda-6875-76b2-b6b2-4ac5a47b00dc"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-shimmer inline-flex items-center gap-2 px-6 py-3 rounded-xl font-body font-bold text-sm text-white transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)" }}
              >
                <Icon name="Star" size={16} />
                Отзывы на EasyDonate
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ---- SUPPORT ---- */}
      <section id="Поддержка" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="section-title text-white mb-3">
              💬 <span className="roblox-text-gradient">Поддержка</span>
            </h2>
            <p className="text-white/50 font-body text-base">Мы всегда готовы помочь — пиши в любое время</p>
            <div className="pixel-divider max-w-xs mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
            {[
              {
                icon: "MessageCircle",
                title: "Telegram",
                desc: "Самый быстрый способ связи. Отвечаем в течение нескольких минут.",
                label: "Написать в Telegram",
                color: "#0066FF",
              },
              {
                icon: "HelpCircle",
                title: "Часто задаваемые вопросы",
                desc: "Как сделать заказ? Когда придут Robux? Ответы на популярные вопросы.",
                label: "Открыть FAQ",
                color: "#E8343A",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="rounded-2xl p-6"
                style={{ background: "rgba(22, 31, 44, 0.9)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${item.color}22` }}>
                  <Icon name={item.icon} size={24} fallback="HelpCircle" />
                </div>
                <h3 className="font-display font-bold text-white text-lg mb-2">{item.title}</h3>
                <p className="font-body text-white/50 text-sm mb-5 leading-relaxed">{item.desc}</p>
                <button
                  onClick={() => setSupportModalOpen(true)}
                  className="btn-shimmer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-body font-bold text-sm text-white transition-all hover:scale-105"
                  style={{ background: `linear-gradient(135deg, ${item.color}, ${item.color}BB)` }}
                >
                  {item.label}
                  <Icon name="ArrowRight" size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="rounded-2xl p-8 text-center relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, rgba(0,102,255,0.12), rgba(232,52,58,0.08))", border: "1px solid rgba(0,102,255,0.2)" }}>
            <div className="absolute top-0 right-0 w-40 h-40 opacity-5">
              <img src={ITEMS_IMG} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="relative z-10">
              <div className="text-4xl mb-3">🕹️</div>
              <h3 className="font-display font-bold text-white text-2xl mb-2">Есть вопрос по заказу?</h3>
              <p className="font-body text-white/50 text-sm mb-6 max-w-md mx-auto">
                Работаем круглосуточно. Любой вопрос — от выбора товара до проблем с доставкой.
              </p>
              <button
                onClick={() => setSupportModalOpen(true)}
                className="btn-shimmer px-8 py-3 rounded-xl font-body font-bold text-white text-base transition-all hover:scale-105 animate-pulse-glow"
                style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)" }}
              >
                💬 Написать нам
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ---- FOOTER ---- */}
      <footer className="py-8 px-4 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-display font-bold text-white"
              style={{ background: "linear-gradient(135deg, #0066FF, #E8343A)" }}>
              C
            </div>
            <span className="font-display font-bold text-base text-white">
              Cambeck<span style={{ color: "#FFB800" }}>SHOP</span>
            </span>
          </div>
          <p className="font-body text-white/30 text-sm">© 2024 CambeckSHOP. Все права защищены.</p>
          <div className="flex gap-4">
            {["Каталог", "Отзывы", "Поддержка"].map((s) => (
              <button key={s} onClick={() => scrollTo(s)}
                className="font-body text-sm text-white/30 hover:text-white/70 transition-colors">
                {s}
              </button>
            ))}
          </div>
        </div>
      </footer>

      {/* ---- REVIEWS MODAL ---- */}
      {reviewModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={() => setReviewModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl p-6 animate-bounce-in"
            style={{ background: "#161F2C", border: "1px solid rgba(255,255,255,0.1)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-white text-xl">⭐ Наши отзывы</h3>
              <button onClick={() => setReviewModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all">
                <Icon name="X" size={16} />
              </button>
            </div>
            <p className="font-body text-white/50 text-sm mb-5">
              Читай честные отзывы покупателей на независимых платформах:
            </p>
            <div className="flex flex-col gap-3">
              <a href="https://beee.pro/shop/user/138944" target="_blank" rel="noopener noreferrer"
                className="btn-shimmer flex items-center gap-3 p-4 rounded-xl text-white font-body font-bold transition-all hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, #7B2FE0, #5B1FB0)" }}>
                <Icon name="Star" size={18} />
                <div>
                  <div className="text-sm">Beee.pro — профиль #1</div>
                  <div className="text-xs text-white/50">beee.pro/shop/user/138944</div>
                </div>
                <Icon name="ExternalLink" size={14} className="ml-auto opacity-50" />
              </a>
              <a href="https://beee.pro/shop/user/325959" target="_blank" rel="noopener noreferrer"
                className="btn-shimmer flex items-center gap-3 p-4 rounded-xl text-white font-body font-bold transition-all hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, #7B2FE0, #5B1FB0)" }}>
                <Icon name="Star" size={18} />
                <div>
                  <div className="text-sm">Beee.pro — профиль #2</div>
                  <div className="text-xs text-white/50">beee.pro/shop/user/325959</div>
                </div>
                <Icon name="ExternalLink" size={14} className="ml-auto opacity-50" />
              </a>
              <a href="https://easydonate.shop/users?id=019b3bda-6875-76b2-b6b2-4ac5a47b00dc" target="_blank" rel="noopener noreferrer"
                className="btn-shimmer flex items-center gap-3 p-4 rounded-xl text-white font-body font-bold transition-all hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)" }}>
                <Icon name="Star" size={18} />
                <div>
                  <div className="text-sm">EasyDonate — отзывы</div>
                  <div className="text-xs text-white/50">easydonate.shop</div>
                </div>
                <Icon name="ExternalLink" size={14} className="ml-auto opacity-50" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ---- SUPPORT MODAL ---- */}
      {supportModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={() => setSupportModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 animate-bounce-in"
            style={{ background: "#161F2C", border: "1px solid rgba(255,255,255,0.1)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-white text-xl">💬 Написать в поддержку</h3>
              <button onClick={() => setSupportModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all">
                <Icon name="X" size={16} />
              </button>
            </div>
            <p className="font-body text-white/50 text-sm mb-5">
              Выберите удобный способ связи:
            </p>
            <div className="flex flex-col gap-3">
              <button
                className="btn-shimmer flex items-center gap-3 p-4 rounded-xl text-white font-body font-bold transition-all hover:scale-[1.02] text-left"
                style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)" }}
              >
                <span className="text-xl">✈️</span>
                <div>
                  <div className="text-sm">Telegram</div>
                  <div className="text-xs text-white/50">Ответим в течение 5 минут</div>
                </div>
              </button>
              <button
                className="btn-shimmer flex items-center gap-3 p-4 rounded-xl text-white font-body font-bold transition-all hover:scale-[1.02] text-left"
                style={{ background: "linear-gradient(135deg, #E8343A, #B02020)" }}
              >
                <span className="text-xl">📧</span>
                <div>
                  <div className="text-sm">Email</div>
                  <div className="text-xs text-white/50">Для официальных запросов</div>
                </div>
              </button>
            </div>
            <p className="font-body text-white/30 text-xs mt-4 text-center">
              Режим работы: 24/7 • Среднее время ответа: 5 мин
            </p>
          </div>
        </div>
      )}


    </div>
  );
}