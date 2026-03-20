import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/context/AuthContext";

const ORDERS_URL = "https://functions.poehali.dev/f852d147-eae1-4265-a94d-63d014c42231";

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
  const [payMethod, setPayMethod] = useState<"crypto" | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);
  const maxQty = Math.min(item.stock, 9999);

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
            <span className="font-body text-white/50 text-sm">К оплате</span>
            <div className="text-right">
              <span className="font-display font-bold text-2xl" style={{ color: "#4DA6FF" }}>
                ${(item.priceUsd * quantity).toFixed(2)}
              </span>
            </div>
          </div>



          {error && (
            <p className="font-body text-red-400 text-sm text-center">{error}</p>
          )}

          {/* Согласие с офертой */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative flex-shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="sr-only"
              />
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center transition-all"
                style={{
                  background: agreed ? "#0066FF" : "rgba(255,255,255,0.07)",
                  border: `2px solid ${agreed ? "#0066FF" : "rgba(255,255,255,0.2)"}`,
                }}>
                {agreed && <span className="text-white text-xs font-bold">✓</span>}
              </div>
            </div>
            <span className="font-body text-white/50 text-xs leading-relaxed group-hover:text-white/70 transition-colors">
              Я ознакомился(-ась) и принимаю условия{" "}
              <a
                href="/oferta"
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="text-blue-400 hover:text-blue-300 underline underline-offset-2"
              >
                публичной оферты
              </a>{" "}
              и{" "}
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="text-blue-400 hover:text-blue-300 underline underline-offset-2"
              >
                политики конфиденциальности
              </a>
            </span>
          </label>

          {/* Кнопка оплаты */}
          <button
            onClick={payByCrypto}
            disabled={loading || !payMethod || !agreed}
            className="w-full py-3.5 rounded-xl font-body font-bold text-white text-base disabled:opacity-40"
            style={{
              background: "linear-gradient(135deg, #0066FF, #0044BB)",
              touchAction: "manipulation",
              border: "none",
              cursor: "pointer",
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Создаём заказ...
              </span>
            ) : "₿ Оплатить криптой"}
          </button>
        </div>
      </div>
    </div>
  );
}