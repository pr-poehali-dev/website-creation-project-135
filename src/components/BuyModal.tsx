import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/context/AuthContext";

const ORDERS_URL = "https://functions.poehali.dev/f852d147-eae1-4265-a94d-63d014c42231";
const ROBOKASSA_URL = "https://functions.poehali.dev/60d8dcc0-3354-4a73-9c86-1698efc497c7";
const USD_TO_RUB_DEFAULT = 81.91;

const NETWORKS = [
  { id: "LTC",      label: "LTC (Litecoin)",     icon: "Ł", color: "#A8A9AD" },
  { id: "USDT_BEP", label: "USDT (BEP20 / BSC)", icon: "₮", color: "#F0B90B" },
  { id: "USDT_TRC", label: "USDT (TRC20 / Tron)", icon: "₮", color: "#EF0027" },
  { id: "SOL",      label: "SOL (Solana)",        icon: "◎", color: "#9945FF" },
];

type Item = {
  id: number;
  name: string;
  priceUsd: number;
  stock: number;
  game?: string;
};

type Props = {
  item: Item;
  onClose: () => void;
};

export default function BuyModal({ item, onClose }: Props) {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [payMethod, setPayMethod] = useState<"card" | "crypto" | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [usdRate, setUsdRate] = useState(USD_TO_RUB_DEFAULT);

  useEffect(() => {
    fetch(`${ORDERS_URL}?action=usd_rate`)
      .then(r => r.json())
      .then(d => { if (d.rate) setUsdRate(d.rate); })
      .catch(() => {});
  }, []);

  const maxQty = Math.min(item.stock, 9999);
  const totalUsd = (item.priceUsd * quantity).toFixed(2);
  const totalRub = Math.ceil(item.priceUsd * quantity * usdRate);

  async function payByCard() {
    setLoading(true);
    setError("");
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["X-Auth-Token"] = token;
      const res = await fetch(`${ROBOKASSA_URL}?action=create`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          item_id: item.id,
          item_name: item.name,
          price_usd: item.priceUsd,
          quantity,
          usd_to_rub: usdRate,
        }),
      });
      if (!res.ok) {
        setError("Оплата картой временно недоступна. Используй криптовалюту.");
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); return; }
      window.location.href = data.pay_url;
    } catch {
      setError("Оплата картой временно недоступна. Используй криптовалюту.");
      setLoading(false);
    }
  }

  async function payByCrypto() {
    if (!network) { setError("Выберите сеть оплаты"); return; }
    setLoading(true);
    setError("");
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["X-Auth-Token"] = token;
      let visitorId = localStorage.getItem("cambeck_visitor_id");
      if (!visitorId) { visitorId = Math.random().toString(36).slice(2) + Date.now(); localStorage.setItem("cambeck_visitor_id", visitorId); }
      const res = await fetch(`${ORDERS_URL}?action=create`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          item_id: item.id,
          item_name: item.name,
          price_usd: item.priceUsd,
          quantity,
          network,
          game: item.game || "steal-a-brainrot",
          visitor_id: visitorId,
          visitor_name: user?.name || "Покупатель",
        }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); return; }
      // Сохраняем заказ в localStorage чтобы можно было вернуться
      localStorage.setItem("cambeck_pending_order", JSON.stringify({
        order_id: data.order_id,
        item_name: item.name,
        amount_usd: data.amount_usd,
        created_at: new Date().toISOString(),
      }));
      navigate(`/pay?order_id=${data.order_id}`);
    } catch {
      setError("Ошибка соединения, попробуй ещё раз");
      setLoading(false);
    }
  }

  // Не авторизован — предлагаем войти
  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
        onClick={onClose}>
        <div className="w-full max-w-sm rounded-2xl p-8 text-center animate-bounce-in"
          style={{ background: "#161F2C", border: "1px solid rgba(0,102,255,0.2)" }}
          onClick={e => e.stopPropagation()}>
          <div className="text-4xl mb-3">🔐</div>
          <h3 className="font-display font-bold text-white text-xl mb-2">Нужен аккаунт</h3>
          <p className="font-body text-white/50 text-sm mb-6">
            Чтобы купить товар, войди в аккаунт или зарегистрируйся — это бесплатно!
          </p>
          <div className="flex flex-col gap-3">
            <Link to="/login" onClick={onClose}
              className="w-full py-3 rounded-xl font-body font-bold text-white text-sm text-center transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)" }}>
              Войти в аккаунт
            </Link>
            <Link to="/register" onClick={onClose}
              className="w-full py-3 rounded-xl font-body font-bold text-sm text-center transition-all hover:scale-105"
              style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.1)" }}>
              Создать аккаунт
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden animate-bounce-in"
        style={{ background: "#161F2C", border: "1px solid rgba(0,102,255,0.2)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div>
            <h3 className="font-display font-bold text-white text-lg">Купить товар</h3>
            <p className="font-body text-white/40 text-sm mt-0.5">{item.name}</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
            <Icon name="X" size={16} />
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-4">
          {/* Количество */}
          {maxQty > 1 && (
            <div>
              <p className="font-body text-white/50 text-xs mb-2">Количество</p>
              <div className="flex items-center gap-3">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white"
                  style={{ background: "rgba(255,255,255,0.07)" }}>−</button>
                <span className="font-display font-bold text-white text-lg w-8 text-center">{quantity}</span>
                <button onClick={() => setQuantity(q => Math.min(maxQty, q + 1))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white"
                  style={{ background: "rgba(255,255,255,0.07)" }}>+</button>
                <span className="font-body text-white/30 text-xs ml-2">макс. {maxQty}</span>
              </div>
            </div>
          )}

          {/* Итого */}
          <div className="flex items-center justify-between px-4 py-3 rounded-xl"
            style={{ background: "rgba(0,102,255,0.08)", border: "1px solid rgba(0,102,255,0.15)" }}>
            <span className="font-body text-white/50 text-sm">Итого</span>
            <div className="text-right">
              <span className="font-display font-bold text-xl" style={{ color: "#4DA6FF" }}>
                {totalRub} ₽
              </span>
              <span className="font-body text-white/30 text-xs ml-2">≈ ${totalUsd}</span>
            </div>
          </div>

          {/* Выбор способа оплаты */}
          <div>
            <p className="font-body text-white/50 text-xs mb-2">Способ оплаты</p>
            <div className="flex flex-col gap-2">
              {/* Карта / СБП */}
              <button
                onClick={() => { setPayMethod("card"); setNetwork(null); }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                style={{
                  background: payMethod === "card" ? "rgba(0,176,111,0.12)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${payMethod === "card" ? "rgba(0,176,111,0.4)" : "rgba(255,255,255,0.07)"}`,
                }}
              >
                <span className="text-xl">💳</span>
                <div className="flex-1">
                  <div className="font-body font-bold text-sm text-white">Карта / СБП</div>
                  <div className="font-body text-xs text-white/40">Оплата в рублях · {totalRub} ₽</div>
                </div>
                {payMethod === "card" && <span className="text-green-400 text-lg">✓</span>}
              </button>

              {/* Крипта */}
              <button
                onClick={() => setPayMethod("crypto")}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                style={{
                  background: payMethod === "crypto" ? "rgba(0,102,255,0.12)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${payMethod === "crypto" ? "rgba(0,102,255,0.4)" : "rgba(255,255,255,0.07)"}`,
                }}
              >
                <span className="text-xl">🔐</span>
                <div className="flex-1">
                  <div className="font-body font-bold text-sm text-white">Криптовалюта</div>
                  <div className="font-body text-xs text-white/40">LTC · USDT · SOL · ${totalUsd}</div>
                </div>
                {payMethod === "crypto" && <span style={{ color: "#4DA6FF" }} className="text-lg">✓</span>}
              </button>
            </div>
          </div>

          {/* Выбор сети (только для крипты) */}
          {payMethod === "crypto" && (
            <div>
              <p className="font-body text-white/50 text-xs mb-2">Выберите сеть</p>
              <div className="grid grid-cols-2 gap-2">
                {NETWORKS.map(n => (
                  <button
                    key={n.id}
                    onClick={() => setNetwork(n.id)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl font-body text-sm text-left transition-all"
                    style={{
                      background: network === n.id ? `${n.color}22` : "rgba(255,255,255,0.04)",
                      border: `1px solid ${network === n.id ? n.color + "66" : "rgba(255,255,255,0.07)"}`,
                      color: network === n.id ? n.color : "rgba(255,255,255,0.6)",
                    }}
                  >
                    <span className="font-bold text-base w-5 text-center">{n.icon}</span>
                    <span className="text-xs leading-tight">{n.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="font-body text-red-400 text-sm text-center">{error}</p>
          )}

          {/* Кнопка оплаты */}
          <button
            onClick={payMethod === "card" ? payByCard : payByCrypto}
            disabled={loading || !payMethod || (payMethod === "crypto" && !network)}
            className="w-full py-3.5 rounded-xl font-body font-bold text-white text-base disabled:opacity-40"
            style={{
              background: payMethod === "card"
                ? "linear-gradient(135deg, #00B06F, #007A4D)"
                : "linear-gradient(135deg, #0066FF, #0044BB)",
              touchAction: "manipulation",
              border: "none",
              cursor: "pointer",
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                {payMethod === "card" ? "Переходим к оплате..." : "Создаём заказ..."}
              </span>
            ) : payMethod === "card" ? "💳 Оплатить картой / СБП" : "🔐 Перейти к оплате →"}
          </button>
        </div>
      </div>
    </div>
  );
}