import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

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
};

type Props = {
  item: Item;
  onClose: () => void;
};

export default function BuyModal({ item, onClose }: Props) {
  const navigate = useNavigate();
  const [network, setNetwork] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const maxQty = Math.min(item.stock, 10);
  const total = (item.priceUsd * quantity).toFixed(2);

  async function createOrder() {
    if (!network) { setError("Выберите сеть оплаты"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${ORDERS_URL}?action=create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id: item.id,
          item_name: item.name,
          price_usd: item.priceUsd,
          quantity,
          network,
        }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); return; }
      navigate(`/pay?order_id=${data.order_id}`);
    } catch {
      setError("Ошибка соединения, попробуй ещё раз");
      setLoading(false);
    }
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
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white transition-all hover:bg-white/10"
                  style={{ background: "rgba(255,255,255,0.07)" }}
                >−</button>
                <span className="font-display font-bold text-white text-lg w-8 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => Math.min(maxQty, q + 1))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white transition-all hover:bg-white/10"
                  style={{ background: "rgba(255,255,255,0.07)" }}
                >+</button>
                <span className="font-body text-white/30 text-xs ml-2">макс. {maxQty}</span>
              </div>
            </div>
          )}

          {/* Выбор сети */}
          <div>
            <p className="font-body text-white/50 text-xs mb-2">Способ оплаты (крипта)</p>
            <div className="grid grid-cols-2 gap-2">
              {NETWORKS.map(n => (
                <button
                  key={n.id}
                  onClick={() => setNetwork(n.id)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl font-body text-sm text-left transition-all hover:scale-[1.02]"
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

          {/* Итого */}
          <div className="flex items-center justify-between px-4 py-3 rounded-xl"
            style={{ background: "rgba(0,102,255,0.08)", border: "1px solid rgba(0,102,255,0.15)" }}>
            <span className="font-body text-white/50 text-sm">Итого</span>
            <span className="font-display font-bold text-xl" style={{ color: "#4DA6FF" }}>
              💸 ${total}
            </span>
          </div>

          {error && (
            <p className="font-body text-red-400 text-sm text-center">{error}</p>
          )}

          {/* Кнопка */}
          <button
            onClick={createOrder}
            disabled={loading}
            className="btn-shimmer w-full py-3.5 rounded-xl font-body font-bold text-white text-base transition-all hover:scale-[1.02] disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)" }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Создаём заказ...
              </span>
            ) : "Перейти к оплате →"}
          </button>
        </div>
      </div>
    </div>
  );
}
