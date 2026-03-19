import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const REVIEWS_URL = "https://functions.poehali.dev/6d55c460-602b-4d36-bc8f-a5fe5413ddd4";

const staticReviews = [
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

const STAR_EMOJIS = ["😞","😕","😐","🙂","🤩"];

type DbReview = { id: string; rating: number; text: string; username: string; item_name: string; created_at: string };

export default function ReviewsSection() {
  const [reviewsExpanded, setReviewsExpanded] = useState(false);
  const [dbReviews, setDbReviews] = useState<DbReview[]>([]);

  useEffect(() => {
    fetch(`${REVIEWS_URL}?action=list&limit=50`)
      .then(r => r.json())
      .then(d => { if (d.reviews) setDbReviews(d.reviews); })
      .catch(() => {});
  }, []);

  const allReviews = [
    ...dbReviews.map(r => ({
      name: r.username,
      text: r.text,
      stars: r.rating,
      emoji: STAR_EMOJIS[r.rating - 1] || "⭐",
      item_name: r.item_name,
      isReal: true,
      created_at: r.created_at,
    })),
    ...staticReviews.map(r => ({ ...r, isReal: false, item_name: undefined, created_at: undefined })),
  ];

  const visibleReviews = reviewsExpanded ? allReviews : allReviews.slice(0, 6);

  return (
    <section id="Отзывы" className="py-20 px-4" style={{ background: "rgba(0,0,0,0.2)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="section-title text-white mb-3">⭐ <span className="roblox-text-gradient">Отзывы</span></h2>
          <p className="text-white/50 font-body text-base">Что говорят наши покупатели</p>
          <div className="pixel-divider max-w-xs mx-auto mt-4" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          {visibleReviews.map((r, i) => (
            <div key={i} className="rounded-2xl p-5 relative"
              style={{ background: "rgba(22, 31, 44, 0.9)", border: `1px solid ${r.isReal ? "rgba(255,184,0,0.15)" : "rgba(255,255,255,0.06)"}` }}>
              {r.isReal && (
                <div className="absolute top-3 right-3 px-1.5 py-0.5 rounded-md font-body text-xs font-bold"
                  style={{ background: "rgba(255,184,0,0.15)", color: "#FFB800" }}>
                  ✓ верифицирован
                </div>
              )}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: "rgba(0,102,255,0.15)" }}>
                  {r.emoji}
                </div>
                <div className="min-w-0">
                  <div className="font-body font-bold text-white text-sm truncate">{r.name}</div>
                  <div className="text-yellow-400 text-xs">{"★".repeat(r.stars)}</div>
                </div>
              </div>
              <p className="font-body text-white/60 text-sm leading-relaxed">"{r.text}"</p>
              {r.item_name && (
                <p className="font-body text-white/25 text-xs mt-2 truncate">📦 {r.item_name}</p>
              )}
              {r.created_at && (
                <p className="font-body text-white/20 text-xs mt-1">
                  {new Date(r.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              )}
            </div>
          ))}
        </div>

        {!reviewsExpanded && (
          <div className="text-center mb-8">
            <button onClick={() => setReviewsExpanded(true)}
              className="btn-shimmer inline-flex items-center gap-2 px-6 py-3 rounded-xl font-body font-bold text-sm text-white transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)" }}>
              <Icon name="ChevronDown" size={16} />
              Показать все {allReviews.length} отзывов
            </button>
          </div>
        )}

        <div className="text-center">
          <p className="text-white/40 font-body text-sm mb-5">Все отзывы на внешних платформах:</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a href="https://beee.pro/shop/user/138944" target="_blank" rel="noopener noreferrer"
              className="btn-shimmer inline-flex items-center gap-2 px-6 py-3 rounded-xl font-body font-bold text-sm text-white transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #7B2FE0, #5B1FB0)" }}>
              <Icon name="Star" size={16} /> Отзывы на Beee.pro #1
            </a>
            <a href="https://beee.pro/shop/user/325959" target="_blank" rel="noopener noreferrer"
              className="btn-shimmer inline-flex items-center gap-2 px-6 py-3 rounded-xl font-body font-bold text-sm text-white transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #7B2FE0, #5B1FB0)" }}>
              <Icon name="Star" size={16} /> Отзывы на Beee.pro #2
            </a>
            <a href="https://easydonate.shop/users?id=019b3bda-6875-76b2-b6b2-4ac5a47b00dc" target="_blank" rel="noopener noreferrer"
              className="btn-shimmer inline-flex items-center gap-2 px-6 py-3 rounded-xl font-body font-bold text-sm text-white transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)" }}>
              <Icon name="Star" size={16} /> Отзывы на EasyDonate
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
