import Icon from "@/components/ui/icon";

const ITEMS_IMG = "https://cdn.poehali.dev/projects/55eebfd7-5c19-4adf-ae5d-100fe458b847/files/34974bc9-8d1b-47ea-a085-b096136f7c56.jpg";

type Props = {
  onOpenSupport: () => void;
  onScrollTo: (id: string) => void;
  reviewModalOpen: boolean;
  supportModalOpen: boolean;
  onCloseReviews: () => void;
  onCloseSupport: () => void;
};

export default function SupportSection({ onOpenSupport, onScrollTo, reviewModalOpen, supportModalOpen, onCloseReviews, onCloseSupport }: Props) {
  return (
    <>
      {/* ---- SUPPORT ---- */}
      <section id="Поддержка" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="section-title text-white mb-3">💬 <span className="roblox-text-gradient">Поддержка</span></h2>
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
              <a href="https://t.me/TanksCrypto" target="_blank" rel="noopener noreferrer"
                className="btn-shimmer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-body font-bold text-sm text-white transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, #0066FF, #0066FFBB)" }}>
                Написать в Telegram <Icon name="ArrowRight" size={14} />
              </a>
            </div>

            <div className="rounded-2xl p-6" style={{ background: "rgba(22, 31, 44, 0.9)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "#22c55e22" }}>
                <Icon name="Mail" size={24} fallback="Mail" />
              </div>
              <h3 className="font-display font-bold text-white text-lg mb-2">Email</h3>
              <p className="font-body text-white/50 text-sm mb-5 leading-relaxed">Отвечаем на письма в течение 24 часов.</p>
              <a href="mailto:cambeckshop@gmail.com"
                className="btn-shimmer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-body font-bold text-sm text-white transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, #22c55e, #22c55eBB)" }}>
                Написать на почту <Icon name="ArrowRight" size={14} />
              </a>
            </div>

            <div className="rounded-2xl p-6" style={{ background: "rgba(22, 31, 44, 0.9)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "#E8343A22" }}>
                <Icon name="HelpCircle" size={24} fallback="HelpCircle" />
              </div>
              <h3 className="font-display font-bold text-white text-lg mb-2">Часто задаваемые вопросы</h3>
              <p className="font-body text-white/50 text-sm mb-5 leading-relaxed">Как сделать заказ? Когда придут Robux? Ответы на популярные вопросы.</p>
              <button onClick={onOpenSupport}
                className="btn-shimmer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-body font-bold text-sm text-white transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, #E8343A, #E8343ABB)" }}>
                Открыть FAQ <Icon name="ArrowRight" size={14} />
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
              <button onClick={onOpenSupport}
                className="btn-shimmer px-8 py-3 rounded-xl font-body font-bold text-white text-base transition-all hover:scale-105 animate-pulse-glow"
                style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)" }}>
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
              style={{ background: "linear-gradient(135deg, #0066FF, #E8343A)" }}>C</div>
            <span className="font-display font-bold text-base text-white">КамбекШОП</span>
          </div>
          <p className="font-body text-white/30 text-sm">© 2026 КамбекШОП. Все права защищены.</p>
          <div className="flex gap-4">
            {["Каталог", "Отзывы", "Поддержка"].map((s) => (
              <button key={s} onClick={() => onScrollTo(s)}
                className="font-body text-sm text-white/30 hover:text-white/70 transition-colors">{s}</button>
            ))}
          </div>
        </div>
      </footer>

      {/* ---- REVIEWS MODAL ---- */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={onCloseReviews}>
          <div className="w-full max-w-lg rounded-2xl p-6 animate-bounce-in"
            style={{ background: "#161F2C", border: "1px solid rgba(255,255,255,0.1)" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-white text-xl">⭐ Наши отзывы</h3>
              <button onClick={onCloseReviews}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all">
                <Icon name="X" size={16} />
              </button>
            </div>
            <p className="font-body text-white/50 text-sm mb-5">Читай честные отзывы покупателей на независимых платформах:</p>
            <div className="flex flex-col gap-3">
              <a href="https://beee.pro/shop/user/138944" target="_blank" rel="noopener noreferrer"
                className="btn-shimmer flex items-center gap-3 p-4 rounded-xl text-white font-body font-bold transition-all hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, #7B2FE0, #5B1FB0)" }}>
                <Icon name="Star" size={18} />
                <div><div className="text-sm">Beee.pro — профиль #1</div><div className="text-xs text-white/50">beee.pro/shop/user/138944</div></div>
                <Icon name="ExternalLink" size={14} className="ml-auto opacity-50" />
              </a>
              <a href="https://beee.pro/shop/user/325959" target="_blank" rel="noopener noreferrer"
                className="btn-shimmer flex items-center gap-3 p-4 rounded-xl text-white font-body font-bold transition-all hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, #7B2FE0, #5B1FB0)" }}>
                <Icon name="Star" size={18} />
                <div><div className="text-sm">Beee.pro — профиль #2</div><div className="text-xs text-white/50">beee.pro/shop/user/325959</div></div>
                <Icon name="ExternalLink" size={14} className="ml-auto opacity-50" />
              </a>
              <a href="https://easydonate.shop/users?id=019b3bda-6875-76b2-b6b2-4ac5a47b00dc" target="_blank" rel="noopener noreferrer"
                className="btn-shimmer flex items-center gap-3 p-4 rounded-xl text-white font-body font-bold transition-all hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)" }}>
                <Icon name="Star" size={18} />
                <div><div className="text-sm">EasyDonate — отзывы</div><div className="text-xs text-white/50">easydonate.shop</div></div>
                <Icon name="ExternalLink" size={14} className="ml-auto opacity-50" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ---- SUPPORT MODAL ---- */}
      {supportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={onCloseSupport}>
          <div className="w-full max-w-md rounded-2xl p-6 animate-bounce-in"
            style={{ background: "#161F2C", border: "1px solid rgba(255,255,255,0.1)" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-white text-xl">💬 Написать в поддержку</h3>
              <button onClick={onCloseSupport}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all">
                <Icon name="X" size={16} />
              </button>
            </div>
            <p className="font-body text-white/50 text-sm mb-5">Выберите удобный способ связи:</p>
            <div className="flex flex-col gap-3">
              <button className="btn-shimmer flex items-center gap-3 p-4 rounded-xl text-white font-body font-bold transition-all hover:scale-[1.02] text-left"
                style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)" }}>
                <span className="text-xl">✈️</span>
                <div><div className="text-sm">Telegram</div><div className="text-xs text-white/50">Ответим в течение 5 минут</div></div>
              </button>
              <button className="btn-shimmer flex items-center gap-3 p-4 rounded-xl text-white font-body font-bold transition-all hover:scale-[1.02] text-left"
                style={{ background: "linear-gradient(135deg, #E8343A, #B02020)" }}>
                <span className="text-xl">📧</span>
                <div><div className="text-sm">Email</div><div className="text-xs text-white/50">Для официальных запросов</div></div>
              </button>
            </div>
            <p className="font-body text-white/30 text-xs mt-4 text-center">Режим работы: 24/7 • Среднее время ответа: 5 мин</p>
          </div>
        </div>
      )}
    </>
  );
}
