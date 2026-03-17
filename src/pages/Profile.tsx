import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Icon from "@/components/ui/icon";

const NETWORK_LABELS: Record<string, string> = {
  LTC: "LTC", USDT_BEP: "USDT BEP20", USDT_TRC: "USDT TRC20", SOL: "SOL",
};

export default function Profile() {
  const { user, orders, paidItems, logout, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading]);

  useEffect(() => {
    if (user) refreshProfile();
  }, []);

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0F1923" }}>
      <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
    </div>
  );

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="min-h-screen" style={{ background: "#0F1923" }}>
      {/* Navbar */}
      <nav className="h-14 flex items-center justify-between px-5 border-b border-white/5"
        style={{ background: "#161F2C" }}>
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-white text-sm"
            style={{ background: "linear-gradient(135deg, #0066FF, #E8343A)" }}>C</div>
          <span className="font-display font-bold text-white">
            КамбекШОП
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="font-body text-white/50 text-sm hidden sm:block">👋 {user.username}</span>
          <button onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-body text-xs text-white/50 hover:text-white hover:bg-white/5 transition-all">
            <Icon name="LogOut" size={14} />
            Выйти
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Профиль */}
        <div className="rounded-2xl p-5 mb-6 flex items-center gap-4"
          style={{ background: "#161F2C", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-display font-bold text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #0066FF, #E8343A)" }}>
            {user.username[0].toUpperCase()}
          </div>
          <div>
            <h1 className="font-display font-bold text-white text-xl">{user.username}</h1>
            <p className="font-body text-white/40 text-sm">{user.email}</p>
            <p className="font-body text-white/25 text-xs mt-0.5">
              Аккаунт создан: {new Date(user.created_at || "").toLocaleDateString("ru")}
            </p>
          </div>
          <div className="ml-auto text-right hidden sm:block">
            <div className="font-display font-bold text-2xl text-white">{orders.length}</div>
            <div className="font-body text-white/40 text-xs">заказов</div>
          </div>
        </div>

        {/* Полученные товары */}
        {paidItems.length > 0 && (
          <div className="mb-6">
            <h2 className="font-display font-bold text-white text-lg mb-3">🎁 Полученные товары</h2>
            <div className="flex flex-col gap-3">
              {paidItems.map((pi, i) => (
                <div key={i} className="rounded-2xl p-4"
                  style={{ background: "rgba(0,176,111,0.08)", border: "1px solid rgba(0,176,111,0.2)" }}>
                  <p className="font-body font-bold text-green-400 text-sm mb-2">{pi.item_name}</p>
                  {pi.accounts.map((acc, j) => (
                    <div key={j} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                      <code className="font-mono text-xs text-white/70 break-all">{acc}</code>
                      <button onClick={() => navigator.clipboard.writeText(acc)}
                        className="ml-2 flex-shrink-0 text-white/30 hover:text-white transition-colors">
                        <Icon name="Copy" size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* История заказов */}
        <div>
          <h2 className="font-display font-bold text-white text-lg mb-3">📦 История заказов</h2>
          {orders.length === 0 ? (
            <div className="rounded-2xl p-8 text-center"
              style={{ background: "#161F2C", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-4xl mb-3">🛒</div>
              <p className="font-body text-white/40 text-sm">Заказов пока нет</p>
              <Link to="/"
                className="mt-4 inline-block px-5 py-2.5 rounded-xl font-body font-bold text-sm text-white transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)" }}>
                Перейти в каталог
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {orders.map(o => (
                <div key={o.order_id} className="rounded-2xl p-4"
                  style={{ background: "#161F2C", border: `1px solid ${o.status === "paid" ? "rgba(0,176,111,0.2)" : "rgba(255,255,255,0.06)"}` }}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-body font-bold text-white text-sm truncate">{o.item_name} × {o.quantity}</p>
                      <p className="font-body text-white/40 text-xs mt-0.5">
                        {NETWORK_LABELS[o.network] || o.network} • {new Date(o.created_at).toLocaleDateString("ru")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-display font-bold text-base" style={{ color: "#4DA6FF" }}>
                        ${o.amount_usd.toFixed(2)}
                      </span>
                      <span className="px-2 py-1 rounded-md font-body font-bold text-xs"
                        style={{
                          background: o.status === "paid" ? "rgba(0,176,111,0.15)" : "rgba(255,184,0,0.12)",
                          color: o.status === "paid" ? "#00D080" : "#FFB800",
                        }}>
                        {o.status === "paid" ? "✅ Оплачен" : "⏳ Ожидает"}
                      </span>
                      {o.status === "pending" && (
                        <Link to={`/pay?order_id=${o.order_id}`}
                          className="px-3 py-1.5 rounded-lg font-body font-bold text-xs text-white transition-all hover:scale-105"
                          style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)" }}>
                          Оплатить
                        </Link>
                      )}
                    </div>
                  </div>
                  {/* Кнопка чата для оплаченных заказов ручной выдачи */}
                  {o.status === "paid" && !o.game?.includes("steal") && (
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <button
                        onClick={() => {
                          localStorage.setItem("cambeck_open_chat", "1");
                          navigate("/");
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-body font-bold text-sm text-white transition-all hover:scale-105"
                        style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)" }}>
                        <Icon name="MessageCircle" size={14} />
                        💬 Открыть чат с продавцом
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}