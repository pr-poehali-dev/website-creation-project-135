import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Icon from "@/components/ui/icon";

const ORDERS_URL = "https://functions.poehali.dev/f852d147-eae1-4265-a94d-63d014c42231";

export default function PaySuccess() {
  const [searchParams] = useSearchParams();
  const { refreshProfile } = useAuth();
  const [accounts, setAccounts] = useState<string[]>([]);
  const [itemName, setItemName] = useState("");
  const [loading, setLoading] = useState(true);

  // Robokassa передаёт InvId в параметрах
  const invId = searchParams.get("InvId") || searchParams.get("inv_id") || "";
  const orderId = searchParams.get("order_id") || "";

  useEffect(() => {
    if (orderId) {
      fetchOrder(orderId);
    } else {
      setLoading(false);
    }
    refreshProfile();
  }, []);

  async function fetchOrder(id: string) {
    try {
      const res = await fetch(`${ORDERS_URL}?action=status&order_id=${id}`);
      const data = await res.json();
      if (data.accounts) setAccounts(data.accounts);
      if (data.item_name) setItemName(data.item_name);
    } catch { /* ignore */ }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0F1923" }}>
      <div className="w-full max-w-lg">
        <div className="rounded-2xl p-8 text-center animate-bounce-in"
          style={{ background: "#161F2C", border: "1px solid rgba(0,176,111,0.3)" }}>
          <div className="text-5xl mb-4">✅</div>
          <h1 className="font-display font-bold text-white text-2xl mb-2">Оплата прошла!</h1>
          <p className="font-body text-white/50 text-sm mb-6">
            {itemName ? `Заказ: ${itemName}` : "Спасибо за покупку в CambeckSHOP!"}
          </p>

          {loading && (
            <div className="flex justify-center mb-6">
              <div className="w-8 h-8 rounded-full border-2 border-green-400 border-t-transparent animate-spin" />
            </div>
          )}

          {accounts.length > 0 && (
            <div className="text-left rounded-xl p-4 mb-6"
              style={{ background: "rgba(0,176,111,0.08)", border: "1px solid rgba(0,176,111,0.2)" }}>
              <p className="font-body text-xs text-green-400 font-bold mb-3 uppercase tracking-wider">🎁 Ваши аккаунты:</p>
              {accounts.map((acc, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <code className="font-mono text-sm text-white/80 break-all">{acc}</code>
                  <button onClick={() => navigator.clipboard.writeText(acc)}
                    className="ml-3 flex-shrink-0 text-white/30 hover:text-white transition-colors">
                    <Icon name="Copy" size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {!loading && accounts.length === 0 && (
            <div className="rounded-xl p-4 mb-6"
              style={{ background: "rgba(255,184,0,0.08)", border: "1px solid rgba(255,184,0,0.2)" }}>
              <p className="font-body text-yellow-400 text-sm">
                ⏳ Товар выдаётся после подтверждения платежа. Проверь личный кабинет через несколько минут.
              </p>
            </div>
          )}

          <p className="font-body text-white/30 text-xs mb-5">
            Все покупки сохранены в твоём личном кабинете
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/profile"
              className="px-6 py-3 rounded-xl font-body font-bold text-sm text-white transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)" }}>
              Личный кабинет
            </Link>
            <Link to="/"
              className="px-6 py-3 rounded-xl font-body font-bold text-sm transition-all hover:scale-105"
              style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.1)" }}>
              В магазин
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
