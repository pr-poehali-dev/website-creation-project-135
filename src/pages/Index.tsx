import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import BuyModal from "@/components/BuyModal";
import { useAuth } from "@/context/AuthContext";

const ORDERS_URL = "https://functions.poehali.dev/f852d147-eae1-4265-a94d-63d014c42231";

const HERO_IMG = "https://cdn.poehali.dev/projects/55eebfd7-5c19-4adf-ae5d-100fe458b847/files/063fb226-d199-4cc0-8b87-e4836625f644.jpg";
const ITEMS_IMG = "https://cdn.poehali.dev/projects/55eebfd7-5c19-4adf-ae5d-100fe458b847/files/34974bc9-8d1b-47ea-a085-b096136f7c56.jpg";

const USD_TO_RUB_DEFAULT = 81.91;

type CatalogItem = {
  id: number;
  name: string;
  priceUsd: number;
  stock: number;
  emoji: string;
  category: "lucky" | "other";
  game: string;
};

type Game = {
  id: string;
  name: string;
  image: string;
  description: string;
  badge?: string;
};

const GAMES: Game[] = [
  {
    id: "steal-a-brainrot",
    name: "Steal a Brainrot",
    image: "https://cdn.poehali.dev/projects/55eebfd7-5c19-4adf-ae5d-100fe458b847/bucket/223b3027-a4bf-4dbb-9bda-056880fda77e.png",
    description: "Юниты, Lucky Blocks, Trade Tokens и редкие мутации",
    badge: "🔥 Хит",
  },
  {
    id: "blade-ball",
    name: "Blade Ball",
    image: "https://cdn.poehali.dev/projects/55eebfd7-5c19-4adf-ae5d-100fe458b847/bucket/1bedf365-0fc1-476b-8d20-8b269805d290.png",
    description: "Мечи, способности и игровая валюта",
  },
  {
    id: "rivals",
    name: "Rivals",
    image: "https://cdn.poehali.dev/projects/55eebfd7-5c19-4adf-ae5d-100fe458b847/bucket/80e8ab2f-8348-4cbb-ad3c-61c99a3e52eb.png",
    description: "Скины, валюта и предметы для Rivals",
  },
  {
    id: "blox-fruits",
    name: "Blox Fruits",
    image: "https://cdn.poehali.dev/projects/55eebfd7-5c19-4adf-ae5d-100fe458b847/bucket/ef4b289a-a2e5-4ec5-a786-462f55acca85.png",
    description: "Фрукты, боссы, игровая валюта",
  },
  {
    id: "gift-op",
    name: "Escape Tsunami For Brainrots!",
    image: "https://cdn.poehali.dev/projects/55eebfd7-5c19-4adf-ae5d-100fe458b847/bucket/43c99621-39bd-4d09-81f1-24201aa5dd32.png",
    description: "Подарки и редкие предметы",
  },
];

const catalogItems: CatalogItem[] = [
  { id: 1,  name: "Secret Lucky Block x10",           priceUsd: 1.70, stock: 0, emoji: "🎲", category: "lucky", game: "steal-a-brainrot" },
  { id: 2,  name: "los Tacos Lucky Block 300m x10",   priceUsd: 1.20, stock: 0, emoji: "🌮", category: "lucky", game: "steal-a-brainrot" },
  { id: 3,  name: "Heart Lucky Blocks x10",           priceUsd: 1.30, stock: 0, emoji: "❤️", category: "lucky", game: "steal-a-brainrot" },
  { id: 4,  name: "Quesadilla Crocodila x10",         priceUsd: 1.90, stock: 0, emoji: "🐊", category: "lucky", game: "steal-a-brainrot" },
  { id: 5,  name: "Burrito Bandito x10",              priceUsd: 1.90, stock: 0, emoji: "🌯", category: "lucky", game: "steal-a-brainrot" },
  { id: 6,  name: "Los Quesadilla x10",               priceUsd: 1.80, stock: 0, emoji: "🧀", category: "lucky", game: "steal-a-brainrot" },
  { id: 7,  name: "Chicleteira Bicicleteira x10",     priceUsd: 1.50, stock: 0, emoji: "🚲", category: "lucky", game: "steal-a-brainrot" },
  { id: 8,  name: "67 x10",                           priceUsd: 2.50, stock: 0, emoji: "🎯", category: "lucky", game: "steal-a-brainrot" },
  { id: 9,  name: "La Grande Combinasion x10",        priceUsd: 2.30, stock: 0, emoji: "✨", category: "lucky", game: "steal-a-brainrot" },
  { id: 10, name: "Los Nooo My Hotsportsitos x10",    priceUsd: 2.50, stock: 0, emoji: "🌶️", category: "lucky", game: "steal-a-brainrot" },
  { id: 11, name: "Random PACK SAB x10",              priceUsd: 0.50, stock: 0, emoji: "📦", category: "lucky", game: "steal-a-brainrot" },
  { id: 12, name: "Divine Secret Lucky Block x10",    priceUsd: 6.00, stock: 0, emoji: "🔮", category: "lucky", game: "steal-a-brainrot" },
  { id: 13, name: "Leprechaun Lucky Block x10",       priceUsd: 1.40, stock: 0, emoji: "🍀", category: "lucky", game: "steal-a-brainrot" },
];

const reviews = [
  { name: "Danil-kolbasenko", text: "быстро", stars: 5, emoji: "⚡" },
  { name: "Nike_Roblox", text: "Спасибо 🙏", stars: 5, emoji: "👟" },
  { name: "ImDrocilXD", text: "Имба", stars: 5, emoji: "🔥" },
  { name: "emir20152409", text: "Лучший", stars: 5, emoji: "⭐" },
  { name: "Rolan-imambaev", text: "Сделал ровно через час", stars: 5, emoji: "🎮" },
  { name: "Mirnyi-Art-m", text: "Всё быстро 😎", stars: 5, emoji: "😎" },
  { name: "S_20788", text: "Было очень быстро", stars: 5, emoji: "🚀" },
  { name: "Boozx75", text: "🔥🔥🔥", stars: 5, emoji: "🔥" },
  { name: "zavial84", text: "Спасибо продавцу! Практически за 1 минуту. ПРОДАВЦА РЕКОМЕНДУЮ", stars: 5, emoji: "💎" },
  { name: "23a385b3974b", text: "Всё супер", stars: 5, emoji: "✅" },
  { name: "DELVER", text: "Крутого 🔥🔥🔥🔥🔥🔥", stars: 5, emoji: "🔥" },
  { name: "annasco-mavesco", text: "Имба", stars: 5, emoji: "⚡" },
  { name: "Matveirembo0216", text: "Спс", stars: 5, emoji: "👍" },
  { name: "SAXNS", text: "Все супер", stars: 5, emoji: "🌟" },
  { name: "9voron92", text: "Все быстро и безопасно, покупайте👍", stars: 5, emoji: "🛡️" },
  { name: "elenabeliancheva", text: "Супер", stars: 5, emoji: "💫" },
  { name: "Pyfik228", text: "Имба", stars: 5, emoji: "🎯" },
  { name: "ghetrintop10", text: "Все прошло хорошо", stars: 5, emoji: "✔️" },
  { name: "Denistm34", text: "Всё прошло хорошо", stars: 5, emoji: "🎮" },
  { name: "Ignat-1088221068", text: "Имба быстро и надёжно", stars: 5, emoji: "⚡" },
  { name: "Dennhikz", text: "Класс 👍, спасибо большое!", stars: 5, emoji: "👌" },
  { name: "Mikhail-1444638315", text: "Быстро без скама", stars: 5, emoji: "🔒" },
  { name: "Denistm34", text: "Всё прошло хорошо просто идеально", stars: 5, emoji: "🏆" },
  { name: "S_20788", text: "Было очень быстро очень дёшево прям быстро Круто!", stars: 5, emoji: "🚀" },
  { name: "YA-YA-3753752454", text: "Очень быстро и удобно", stars: 5, emoji: "⭐" },
  { name: "Gavriil-Kiselev", text: "Всё быстро Я получил", stars: 5, emoji: "✅" },
  { name: "Pyfik228", text: "Крутой продавец, советую", stars: 5, emoji: "💪" },
  { name: "569284", text: "Все имба", stars: 5, emoji: "🔥" },
  { name: "provmor92", text: "Быстро, советую продавца", stars: 5, emoji: "👍" },
  { name: "Ramil-427086727", text: "Афигено и быстро без обмана", stars: 5, emoji: "🎮" },
  { name: "olgalisova2805", text: "Мой любимый продавец спасибо большое лучший покупайте", stars: 5, emoji: "❤️" },
  { name: "aleks170417m", text: "Всё ок советую очень быстро", stars: 5, emoji: "⚡" },
  { name: "Hunger_Trade", text: "Быстро, без скама, советую", stars: 5, emoji: "🛡️" },
  { name: "wannabefine", text: "Продавец просто бомба советую", stars: 5, emoji: "💣" },
  { name: "ka3no4ka32", text: "Прошло все успешно. Спасибо продавцу. Всё супер", stars: 5, emoji: "🌟" },
  { name: "flicker", text: "быстро четко", stars: 5, emoji: "⚡" },
  { name: "olga1borisovna", text: "Круто быстро прозрачно выгодно приятный продавец", stars: 5, emoji: "💎" },
  { name: "16andry16", text: "Очень быстро и надёжно советую", stars: 5, emoji: "✅" },
  { name: "lizaprytkova139", text: "очень круто и быстро не скам", stars: 5, emoji: "🔥" },
  { name: "Ale3fon", text: "Всё быстро", stars: 5, emoji: "⚡" },
  { name: "Anastasia161Ros", text: "Продавец имба", stars: 5, emoji: "🏆" },
  { name: "Mikhail-Babaev", text: "Всё круто", stars: 5, emoji: "👍" },
  { name: "Boozx75", text: "Класс😁", stars: 5, emoji: "😁" },
  { name: "Goldeneggs666", text: "Шустро быстро", stars: 5, emoji: "⚡" },
  { name: "Vlad-Eliseev", text: "Выпал целестиал пигас", stars: 5, emoji: "🌟" },
  { name: "YArik-SHokin", text: "Хорошо", stars: 5, emoji: "✔️" },
  { name: "Derekto", text: "1 секунда и ссылка есть, меньше 30 сек, надежно всё", stars: 5, emoji: "🚀" },
  { name: "95dbf5aa", text: "Не обман продавец имба", stars: 5, emoji: "💯" },
  { name: "Vanya-Ivanov", text: "Все качественно и без скама", stars: 5, emoji: "🔒" },
  { name: "Anastasia161Ros", text: "Отличный продавец", stars: 5, emoji: "⭐" },
  { name: "Mikami", text: "Все отлично спасибо!", stars: 5, emoji: "🎮" },
  { name: "BMW7777777", text: "Имба", stars: 5, emoji: "🔥" },
  { name: "levker", text: "Не скам крутой!!!", stars: 5, emoji: "💪" },
  { name: "Alena_s91", text: "Просто имба", stars: 5, emoji: "⚡" },
  { name: "Shpingalet", text: "топ", stars: 5, emoji: "🏆" },
  { name: "bazarzapovanton", text: "продавец честный и быстро ответил советую", stars: 5, emoji: "✅" },
  { name: "Arseniy-2113067231", text: "Самый лучший трейд, не обманщик, ставлю 5 звёзд из 5", stars: 5, emoji: "🌟" },
  { name: "Nikitatverdoi", text: "Просто лучший. Имба. Всем советую. 2 минуты и готово.", stars: 5, emoji: "💎" },
  { name: "Anastasia161Ros", text: "Думал что Скам — всё пришло, спасибо продавцу!", stars: 5, emoji: "😮" },
  { name: "abobamark2015", text: "Имба не суммам!!!", stars: 5, emoji: "🔥" },
  { name: "Crush-Kirill", text: "Чётко", stars: 5, emoji: "👌" },
  { name: "filimoshki", text: "белисемо", stars: 5, emoji: "✨" },
  { name: "danyacelec", text: "👌", stars: 5, emoji: "👌" },
];

const sections = ["Главная", "Каталог", "Отзывы", "Поддержка"];

function CatalogCard({ item, usdRate = USD_TO_RUB_DEFAULT }: { item: CatalogItem; usdRate?: number }) {
  const inStock = item.stock > 0;
  const priceRub = Math.ceil(item.priceUsd * usdRate);
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
            {inStock ? "В наличии" : "Нет в наличии"}
          </span>
          <div className="text-2xl">{item.emoji}</div>
        </div>

        <h3 className="font-display font-bold text-base text-white mb-3 leading-tight">{item.name}</h3>

        <div className="flex items-center justify-between">
          <div>
            <div className="font-display font-bold text-xl" style={{ color: "#4DA6FF" }}>
              💸 {priceRub} ₽
            </div>
            <div className="font-body text-xs text-white/40 mt-0.5">≈ ${item.priceUsd.toFixed(2)}</div>
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
  const [dbPrices, setDbPrices] = useState<Record<string, number>>({});
  const [dbStock, setDbStock] = useState<Record<string, number>>({});
  const [dbCatalog, setDbCatalog] = useState<CatalogItem[]>([]);
  const [dbGames, setDbGames] = useState<Game[]>([]);
  const [usdRate, setUsdRate] = useState(USD_TO_RUB_DEFAULT);
  const [reviewsExpanded, setReviewsExpanded] = useState(false);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  useEffect(() => {
    setLoaded(true);

    function loadUsdRate() {
      fetch(`${ORDERS_URL}?action=usd_rate`)
        .then(r => r.json())
        .then(d => { if (d.rate) setUsdRate(d.rate); })
        .catch(() => {});
    }

    function loadGames() {
      fetch(`${ORDERS_URL}?action=games`)
        .then(r => r.json())
        .then(d => { if (d.games && d.games.length > 0) setDbGames(d.games); })
        .catch(() => {});
    }

    function loadCatalog() {
      fetch(`${ORDERS_URL}?action=catalog`)
        .then(r => r.json())
        .then(d => {
          if (d.items && d.items.length > 0) {
            setDbCatalog(d.items.map((i: { id: number; name: string; price_usd: number; stock: number; emoji: string; category: string; game: string }) => ({
              id: i.id,
              name: i.name,
              priceUsd: i.price_usd,
              stock: i.stock,
              emoji: i.emoji,
              category: i.category as "lucky" | "other",
              game: i.game,
            })));
          }
        })
        .catch(() => {});
    }

    function loadPrices() {
      fetch(`${ORDERS_URL}?action=prices`)
        .then(r => r.json())
        .then(d => { if (d.prices) setDbPrices(d.prices); })
        .catch(() => {});
    }

    function loadStock() {
      fetch(`${ORDERS_URL}?action=stock_public`)
        .then(r => r.json())
        .then(d => { if (d.stock) setDbStock(d.stock); })
        .catch(() => {});
    }

    loadUsdRate();
    loadGames();
    loadCatalog();
    loadPrices();
    loadStock();

    // Обновляем остатки каждые 60 секунд, курс — каждые 30 минут
    const stockInterval = setInterval(loadStock, 60000);
    const rateInterval = setInterval(loadUsdRate, 30 * 60 * 1000);
    return () => { clearInterval(stockInterval); clearInterval(rateInterval); };
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
              КамбекШОП
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
            Камбек<span className="roblox-text-gradient">ШОП</span>
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
              { num: "15000+", label: "Продаж" },
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

          {/* Выбор игры / каталог */}
          {!selectedGame ? (
            /* --- Список игр --- */
            <div>
              <p className="text-white/40 font-body text-sm mb-6 text-center">Выбери игру, чтобы увидеть товары</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {(dbGames.length > 0 ? dbGames : GAMES).map((game) => (
                  <button
                    key={game.id}
                    onClick={() => setSelectedGame(game.id)}
                    className="rounded-2xl overflow-hidden text-left transition-all hover:scale-[1.02] hover:shadow-2xl group"
                    style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(22,31,44,0.9)" }}
                  >
                    <div className="relative h-44 overflow-hidden">
                      <img src={game.image} alt={game.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      {game.badge && (
                        <div className="absolute top-3 left-3 px-2 py-1 rounded-lg font-display font-bold text-xs text-white"
                          style={{ background: "linear-gradient(135deg, #E8343A, #B02020)" }}>
                          {game.badge}
                        </div>
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
                {/* Заглушка "Скоро" */}
                <div className="rounded-2xl p-6 flex flex-col items-center justify-center text-center min-h-[220px]"
                  style={{ border: "1px dashed rgba(255,255,255,0.1)", background: "rgba(22,31,44,0.4)" }}>
                  <div className="text-4xl mb-3">🎮</div>
                  <div className="font-display font-bold text-white/40 text-base mb-1">Скоро</div>
                  <div className="font-body text-white/25 text-xs">Добавляем новые игры</div>
                </div>
              </div>
            </div>
          ) : (
            /* --- Товары выбранной игры --- */
            <div>
              {/* Кнопка назад */}
              <button
                onClick={() => setSelectedGame(null)}
                className="inline-flex items-center gap-2 mb-6 font-body text-sm text-white/50 hover:text-white transition-colors"
              >
                <Icon name="ChevronLeft" size={16} /> Все игры
              </button>

              {/* Баннер игры */}
              {(dbGames.length > 0 ? dbGames : GAMES).filter(g => g.id === selectedGame).map(game => (
                <div key={game.id} className="rounded-2xl overflow-hidden mb-8 relative h-36"
                  style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                  <img src={game.image} alt={game.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-end p-5"
                    style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)" }}>
                    <div>
                      <div className="font-display font-bold text-white text-xl">{game.name}</div>
                      <div className="font-body text-white/60 text-xs">{game.description}</div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Товары */}
              <div className="mb-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(dbCatalog.length > 0 ? dbCatalog : catalogItems).filter(i => i.game === selectedGame).map((item) => (
                    <CatalogCard key={item.id} usdRate={usdRate} item={{
                      ...item,
                      priceUsd: dbPrices[String(item.id)] ?? item.priceUsd,
                      stock: dbStock[String(item.id)] ?? item.stock,
                    }} />
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

              <div className="mt-8 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4"
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
          )}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            {(reviewsExpanded ? reviews : reviews.slice(0, 6)).map((r, i) => (
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

          {!reviewsExpanded && (
            <div className="text-center mb-8">
              <button
                onClick={() => setReviewsExpanded(true)}
                className="btn-shimmer inline-flex items-center gap-2 px-6 py-3 rounded-xl font-body font-bold text-sm text-white transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)" }}
              >
                <Icon name="ChevronDown" size={16} />
                Показать все {reviews.length} отзывов
              </button>
            </div>
          )}

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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            <div className="rounded-2xl p-6" style={{ background: "rgba(22, 31, 44, 0.9)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "#0066FF22" }}>
                <Icon name="MessageCircle" size={24} fallback="MessageCircle" />
              </div>
              <h3 className="font-display font-bold text-white text-lg mb-2">Telegram</h3>
              <p className="font-body text-white/50 text-sm mb-5 leading-relaxed">Самый быстрый способ связи. Отвечаем в течение нескольких минут.</p>
              <a
                href="https://t.me/TanksCrypto"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-shimmer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-body font-bold text-sm text-white transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, #0066FF, #0066FFBB)" }}
              >
                Написать в Telegram
                <Icon name="ArrowRight" size={14} />
              </a>
            </div>

            <div className="rounded-2xl p-6" style={{ background: "rgba(22, 31, 44, 0.9)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "#22c55e22" }}>
                <Icon name="Mail" size={24} fallback="Mail" />
              </div>
              <h3 className="font-display font-bold text-white text-lg mb-2">Email</h3>
              <p className="font-body text-white/50 text-sm mb-5 leading-relaxed">Отвечаем на письма в течение 24 часов.</p>
              <a
                href="mailto:cambeckshop@gmail.com"
                className="btn-shimmer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-body font-bold text-sm text-white transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, #22c55e, #22c55eBB)" }}
              >
                Написать на почту
                <Icon name="ArrowRight" size={14} />
              </a>
            </div>

            <div className="rounded-2xl p-6" style={{ background: "rgba(22, 31, 44, 0.9)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "#E8343A22" }}>
                <Icon name="HelpCircle" size={24} fallback="HelpCircle" />
              </div>
              <h3 className="font-display font-bold text-white text-lg mb-2">Часто задаваемые вопросы</h3>
              <p className="font-body text-white/50 text-sm mb-5 leading-relaxed">Как сделать заказ? Когда придут Robux? Ответы на популярные вопросы.</p>
              <button
                onClick={() => setSupportModalOpen(true)}
                className="btn-shimmer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-body font-bold text-sm text-white transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, #E8343A, #E8343ABB)" }}
              >
                Открыть FAQ
                <Icon name="ArrowRight" size={14} />
              </button>
            </div>
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
              КамбекШОП
            </span>
          </div>
          <p className="font-body text-white/30 text-sm">© 2026 КамбекШОП. Все права защищены.</p>
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