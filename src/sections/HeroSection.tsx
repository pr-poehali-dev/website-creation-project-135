import Icon from "@/components/ui/icon";
import { Link } from "react-router-dom";

const HERO_IMG = "https://cdn.poehali.dev/projects/55eebfd7-5c19-4adf-ae5d-100fe458b847/files/063fb226-d199-4cc0-8b87-e4836625f644.jpg";

const sections = ["Главная", "Каталог", "Отзывы", "Поддержка"];

type Props = {
  loaded: boolean;
  activeSection: string;
  mobileMenuOpen: boolean;
  user: { username: string } | null;
  onScrollTo: (id: string) => void;
  onToggleMobile: () => void;
  onOpenReviews: () => void;
};

export default function HeroSection({ loaded, activeSection, mobileMenuOpen, user, onScrollTo, onToggleMobile, onOpenReviews }: Props) {
  return (
    <>
      {/* ---- NAVBAR ---- */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer animate-pixel-glitch" onClick={() => onScrollTo("Главная")}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg font-display font-bold text-white"
              style={{ background: "linear-gradient(135deg, #0066FF, #E8343A)" }}>C</div>
            <span className="font-display font-bold text-xl tracking-wider text-white">КамбекШОП</span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {sections.map((s) => (
              <button key={s} onClick={() => onScrollTo(s)}
                className={`px-4 py-2 rounded-lg font-body font-bold text-sm transition-all duration-200 ${activeSection === s ? "text-white font-extrabold" : "text-white/60 hover:text-white hover:bg-white/5"}`}
                style={activeSection === s ? { background: "rgba(0,102,255,0.15)", color: "#4DA6FF" } : {}}>
                {s}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* ПК: кнопки профиль/войти */}
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
            <button onClick={() => onScrollTo("Каталог")}
              className="hidden md:block btn-shimmer px-5 py-2 rounded-xl font-body font-bold text-sm text-white transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)" }}>
              Каталог
            </button>

            {/* Мобайл: иконка профиль/войти + бургер */}
            <div className="md:hidden flex items-center gap-1">
              {user ? (
                <Link to="/profile"
                  className="flex items-center justify-center w-9 h-9 rounded-xl font-display font-bold text-sm text-white transition-all hover:scale-105"
                  style={{ background: "linear-gradient(135deg, #0066FF, #E8343A)" }}>
                  {user.username[0].toUpperCase()}
                </Link>
              ) : (
                <Link to="/login"
                  className="flex items-center justify-center w-9 h-9 rounded-xl text-white/70 hover:text-white transition-all"
                  style={{ border: "1px solid rgba(255,255,255,0.15)" }}>
                  <Icon name="User" size={16} />
                </Link>
              )}
              <button className="text-white/70 hover:text-white p-2" onClick={onToggleMobile}>
                <Icon name={mobileMenuOpen ? "X" : "Menu"} size={22} />
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden glass-card border-t border-white/5 px-4 py-3 flex flex-col gap-1 animate-slide-down">
            {sections.map((s) => (
              <button key={s} onClick={() => onScrollTo(s)}
                className="w-full text-left px-4 py-3 rounded-lg font-body text-white/70 hover:text-white hover:bg-white/5 transition-all">
                {s}
              </button>
            ))}
            <div className="border-t border-white/5 mt-1 pt-2">
              {user ? (
                <Link to="/profile"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg font-body font-bold text-sm text-white hover:bg-white/5 transition-all"
                  onClick={onToggleMobile}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{ background: "linear-gradient(135deg, #0066FF, #E8343A)" }}>
                    {user.username[0].toUpperCase()}
                  </div>
                  {user.username} — Профиль
                </Link>
              ) : (
                <Link to="/login"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg font-body font-bold text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all"
                  onClick={onToggleMobile}>
                  <Icon name="User" size={16} />
                  Войти в аккаунт
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ---- HERO ---- */}
      <section id="Главная" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, #0F1923 0%, rgba(15,25,35,0.5) 40%, rgba(15,25,35,0.8) 80%, #0F1923 100%)" }} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 30% 40%, rgba(0,102,255,0.12) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(232,52,58,0.08) 0%, transparent 60%)" }} />
        </div>

        <div className="absolute top-24 left-8 md:left-16 animate-float opacity-30"><div className="w-8 h-8 rounded" style={{ background: "#0066FF" }} /></div>
        <div className="absolute top-40 right-12 md:right-24 animate-float-delay opacity-30"><div className="w-6 h-6 rounded" style={{ background: "#E8343A" }} /></div>
        <div className="absolute bottom-40 left-16 md:left-32 animate-float-delay-2 opacity-20"><div className="w-10 h-10 rounded" style={{ background: "#FFB800" }} /></div>
        <div className="absolute top-1/3 right-8 animate-float opacity-20"><div className="w-5 h-5 rounded" style={{ background: "#00B06F" }} /></div>

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
            <button onClick={() => onScrollTo("Каталог")}
              className="btn-shimmer w-full sm:w-auto px-8 py-4 rounded-2xl font-body font-extrabold text-lg text-white transition-all hover:scale-105 animate-pulse-glow"
              style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)" }}>
              🛒 Перейти в каталог
            </button>
            <button onClick={onOpenReviews}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl font-body font-bold text-lg transition-all hover:scale-105"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)" }}>
              ⭐ Наши отзывы
            </button>
          </div>

          <div className={`mt-16 grid grid-cols-3 gap-4 max-w-md mx-auto transition-all duration-700 delay-500 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            {[{ num: "15000+", label: "Продаж" }, { num: "4.9⭐", label: "Рейтинг" }, { num: "24/7", label: "Поддержка" }].map((s) => (
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
    </>
  );
}