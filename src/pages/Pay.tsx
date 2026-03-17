import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const ORDERS_URL = "https://functions.poehali.dev/f852d147-eae1-4265-a94d-63d014c42231";

const NETWORK_ICONS: Record<string, string> = {
  LTC: "Ł",
  USDT_BEP: "₮",
  USDT_TRC: "₮",
  SOL: "◎",
};

const NETWORK_COLORS: Record<string, string> = {
  LTC: "#A8A9AD",
  USDT_BEP: "#F0B90B",
  USDT_TRC: "#EF0027",
  SOL: "#9945FF",
};

type OrderData = {
  order_id: string;
  address: string;
  network: string;
  network_label: string;
  amount_usd: number;
  item_name: string;
  quantity: number;
  status: string;
  accounts: string[];
  needs_chat?: boolean;
  chat_id?: string | null;
  game?: string;
  crypto_rate?: number | null;
  crypto_amount?: number | null;
  usd_rate?: number | null;
};

export default function Pay() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const orderId = params.get("order_id");

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(1800);
  const [expired, setExpired] = useState(false);
  const [cryptoRate, setCryptoRate] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!orderId) { setLoading(false); return; }
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, [orderId]);

  useEffect(() => {
    if (!order || order.crypto_amount) return;
    // Только если курс не зафиксирован в БД — запрашиваем динамически
    fetchRate(order.network);
  }, [order?.network]);

  async function fetchRate(network: string) {
    const coinIds: Record<string, string> = { LTC: "litecoin", SOL: "solana" };
    const coinId = coinIds[network];
    if (!coinId) return;
    try {
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
      const data = await res.json();
      const price = data[coinId]?.usd;
      if (price) setCryptoRate(price);
    } catch { /* ignore */ }
  }

  function getCryptoAmount(): string | null {
    if (!order) return null;
    // Приоритет — зафиксированный курс из БД
    if (order.crypto_amount) {
      if (order.network === "USDT_BEP" || order.network === "USDT_TRC") return order.crypto_amount.toFixed(2) + " USDT";
      if (order.network === "LTC") return order.crypto_amount.toFixed(6) + " LTC";
      if (order.network === "SOL") return order.crypto_amount.toFixed(4) + " SOL";
    }
    // Fallback — динамический курс
    if (order.network === "USDT_BEP" || order.network === "USDT_TRC") return order.amount_usd.toFixed(2) + " USDT";
    if (!cryptoRate) return null;
    const amount = order.amount_usd / cryptoRate;
    if (order.network === "LTC") return amount.toFixed(6) + " LTC";
    if (order.network === "SOL") return amount.toFixed(4) + " SOL";
    return null;
  }

  function getCryptoRateLabel(): string | null {
    if (!order) return null;
    const rate = order.crypto_rate || cryptoRate;
    if (!rate || order.network === "USDT_BEP" || order.network === "USDT_TRC") return null;
    const symbol = order.network === "LTC" ? "LTC" : "SOL";
    return `1 ${symbol} = $${rate.toLocaleString("ru", { maximumFractionDigits: 2 })} · курс зафиксирован`;
  }

  useEffect(() => {
    if (!order || order.status === "paid") return;
    timerRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { setExpired(true); clearInterval(timerRef.current!); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [order]);

  async function fetchStatus() {
    try {
      const res = await fetch(`${ORDERS_URL}?action=status&order_id=${orderId}`);
      const data = await res.json();
      if (!data.error) {
        setOrder(data);
        if (data.status === "expired") setExpired(true);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }

  function getVisitorId() {
    let vid = localStorage.getItem("cambeck_visitor_id");
    if (!vid) { vid = Math.random().toString(36).slice(2) + Date.now(); localStorage.setItem("cambeck_visitor_id", vid); }
    return vid;
  }

  async function checkPayment() {
    setChecking(true);
    try {
      const res = await fetch(`${ORDERS_URL}?action=check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId, visitor_id: getVisitorId(), visitor_name: "Покупатель" }),
      });
      const data = await res.json();
      if (data.status === "paid") {
        localStorage.removeItem("cambeck_pending_order");
        setOrder(prev => prev ? { ...prev, status: "paid", accounts: data.accounts || [], needs_chat: data.needs_chat, chat_id: data.chat_id } : prev);
      }
    } catch {
      // ignore
    }
    setChecking(false);
  }

  function copyAddress() {
    if (!order) return;
    navigator.clipboard.writeText(order.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0F1923" }}>
      <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
    </div>
  );

  if (!orderId || !order) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0F1923" }}>
      <div className="text-center">
        <div className="text-4xl mb-3">❌</div>
        <h1 className="font-display font-bold text-white text-xl">Заказ не найден</h1>
        <a href="/" className="mt-4 inline-block font-body text-blue-400 hover:text-blue-300 text-sm">← Вернуться в магазин</a>
      </div>
    </div>
  );

  // Оплачено
  if (order.status === "paid") {
    const needsChat = order.needs_chat || (order.accounts && order.accounts.length === 0 && !order.game?.includes("steal"));
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: "#0F1923" }}>
        <div className="w-full max-w-lg">
          <div className="rounded-2xl p-8 text-center animate-bounce-in"
            style={{ background: "#161F2C", border: "1px solid rgba(0,176,111,0.3)" }}>
            <div className="text-5xl mb-4">✅</div>
            <h1 className="font-display font-bold text-white text-2xl mb-2">Оплата подтверждена!</h1>
            <p className="font-body text-white/50 text-sm mb-6">
              Заказ: <b className="text-white">{order.item_name}</b> × {order.quantity}
            </p>

            {/* Аккаунты (только для Brainrot) */}
            {order.accounts && order.accounts.length > 0 && (
              <div className="text-left rounded-xl p-4 mb-4"
                style={{ background: "rgba(0,176,111,0.08)", border: "1px solid rgba(0,176,111,0.2)" }}>
                <p className="font-body text-xs text-green-400 font-bold mb-3 uppercase tracking-wider">🎁 Ваши аккаунты:</p>
                {order.accounts.map((acc, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <code className="font-mono text-sm text-white/80 break-all">{acc}</code>
                    <button
                      onClick={() => navigator.clipboard.writeText(acc)}
                      className="ml-3 flex-shrink-0 text-white/30 hover:text-white transition-colors"
                    >
                      <Icon name="Copy" size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Чат для ручной выдачи */}
            {needsChat && (
              <div className="rounded-xl p-5 mb-5 text-left"
                style={{ background: "rgba(0,102,255,0.08)", border: "1px solid rgba(0,102,255,0.25)" }}>
                <p className="font-body text-blue-400 font-bold text-sm mb-2">💬 Продавец передаст товар через игру</p>
                <p className="font-body text-white/50 text-sm mb-4">
                  Ваш заказ оплачен. Продавец уже получил уведомление и свяжется в чате для передачи товара.
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      localStorage.setItem("cambeck_open_chat", "1");
                      navigate("/");
                    }}
                    className="w-full py-3 rounded-xl font-body font-bold text-sm text-white transition-all hover:scale-105"
                    style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)" }}
                  >
                    💬 Открыть чат с продавцом
                  </button>
                  <button
                    onClick={() => {
                      localStorage.setItem("cambeck_open_chat_tab", "orders");
                      navigate("/");
                    }}
                    className="w-full py-2.5 rounded-xl font-body font-bold text-sm text-white/60 hover:text-white transition-all"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    📦 Мои заказы
                  </button>
                </div>
              </div>
            )}

            {!needsChat && <p className="font-body text-white/30 text-xs mb-5">Сохрани данные — повторно они не будут показаны</p>}
            <a href="/"
              className="inline-block px-6 py-3 rounded-xl font-body font-bold text-sm text-white/50 hover:text-white transition-colors text-sm">
              ← Вернуться в магазин
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Истёк таймер
  if (expired) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0F1923" }}>
      <div className="text-center rounded-2xl p-8 max-w-sm w-full"
        style={{ background: "#161F2C", border: "1px solid rgba(232,52,58,0.3)" }}>
        <div className="text-4xl mb-3">⏰</div>
        <h1 className="font-display font-bold text-white text-xl mb-2">Время оплаты истекло</h1>
        <p className="font-body text-white/40 text-sm mb-5">Создайте новый заказ</p>
        <a href="/" className="inline-block px-6 py-3 rounded-xl font-body font-bold text-sm text-white"
          style={{ background: "linear-gradient(135deg, #E8343A, #B02020)" }}>
          ← В магазин
        </a>
      </div>
    </div>
  );

  const netColor = NETWORK_COLORS[order.network] || "#0066FF";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: "#0F1923" }}>
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <a href="/" className="text-white/40 hover:text-white transition-colors">
            <Icon name="ArrowLeft" size={20} />
          </a>
          <div>
            <h1 className="font-display font-bold text-white text-xl">Оплата заказа</h1>
            <p className="font-body text-white/40 text-xs">#{order.order_id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden animate-slide-up"
          style={{ background: "#161F2C", border: "1px solid rgba(255,255,255,0.06)" }}>

          {/* Товар */}
          <div className="px-5 py-4 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-body text-white/50 text-xs mb-1">Товар</p>
                <p className="font-display font-bold text-white">{order.item_name} × {order.quantity}</p>
              </div>
              <div className="text-right">
                <p className="font-body text-white/50 text-xs mb-1">К оплате</p>
                <p className="font-display font-bold text-2xl" style={{ color: "#4DA6FF" }}>
                  ${order.amount_usd.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Таймер */}
          <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between"
            style={{ background: "rgba(255,184,0,0.05)" }}>
            <span className="font-body text-white/50 text-xs">Время на оплату</span>
            <span className="font-display font-bold text-lg"
              style={{ color: secondsLeft < 300 ? "#E8343A" : "#FFB800" }}>
              ⏱ {formatTime(secondsLeft)}
            </span>
          </div>

          {/* Сеть + сумма в крипте */}
          <div className="px-5 py-4 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-body text-white/50 text-xs mb-2">Сеть оплаты</p>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
                    style={{ background: `${netColor}22`, color: netColor }}>
                    {NETWORK_ICONS[order.network] || "₿"}
                  </span>
                  <span className="font-body font-bold text-white">{order.network_label}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-body text-white/50 text-xs mb-1">Отправить</p>
                {getCryptoAmount() ? (
                  <div>
                    <div className="flex items-center gap-1 justify-end">
                      <span className="font-display font-bold text-lg" style={{ color: netColor }}>
                        {getCryptoAmount()}
                      </span>
                      <button
                        onClick={() => {
                          const amt = getCryptoAmount();
                          if (amt) {
                            navigator.clipboard.writeText(amt.split(" ")[0]);
                            setCopiedAmount(true);
                            setTimeout(() => setCopiedAmount(false), 2000);
                          }
                        }}
                        className="w-6 h-6 rounded flex items-center justify-center text-white/30 hover:text-white transition-colors"
                      >
                        <Icon name={copiedAmount ? "Check" : "Copy"} size={12} />
                      </button>
                    </div>
                    {getCryptoRateLabel() && (
                      <p className="font-body text-white/25 text-xs mt-0.5 text-right">🔒 {getCryptoRateLabel()}</p>
                    )}
                  </div>
                ) : (
                  <span className="font-body text-white/30 text-xs animate-pulse">загрузка курса...</span>
                )}
                {cryptoRate && (order.network === "LTC" || order.network === "SOL") && (
                  <p className="font-body text-white/25 text-xs mt-0.5">
                    1 {order.network} = ${cryptoRate.toLocaleString("en")}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Адрес */}
          <div className="px-5 py-4 border-b border-white/5">
            <p className="font-body text-white/50 text-xs mb-2">Адрес для оплаты</p>
            <div className="flex items-center gap-2 p-3 rounded-xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <code className="font-mono text-xs text-white/80 flex-1 break-all leading-relaxed">
                {order.address}
              </code>
              <button
                onClick={copyAddress}
                className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105"
                style={{ background: copied ? "rgba(0,176,111,0.2)" : "rgba(255,255,255,0.08)" }}
              >
                <Icon name={copied ? "Check" : "Copy"} size={14} />
              </button>
            </div>
            {copied && <p className="text-green-400 text-xs mt-1 font-body">✓ Скопировано!</p>}
          </div>

          {/* Инструкция */}
          <div className="px-5 py-4 border-b border-white/5">
            <p className="font-body text-white/40 text-xs leading-relaxed">
              1. Скопируй адрес выше<br />
              2. Отправь ровно{" "}
              <b className="text-white">
                {getCryptoAmount() ?? `$${order.amount_usd.toFixed(2)}`}
              </b>{" "}
              в сети <b className="text-white">{order.network_label}</b><br />
              3. Нажми «Я оплатил» — система проверит блокчейн и выдаст товар
            </p>
          </div>

          {/* Кнопка */}
          <div className="px-5 py-4">
            <button
              onClick={checkPayment}
              disabled={checking}
              className="btn-shimmer w-full py-3.5 rounded-xl font-body font-bold text-white text-base transition-all hover:scale-[1.02] disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #00B06F, #007A4D)" }}
            >
              {checking ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Проверяем блокчейн...
                </span>
              ) : "✅ Я оплатил — проверить"}
            </button>
            <p className="font-body text-white/20 text-xs text-center mt-3">
              Проверка происходит автоматически каждые 15 сек
            </p>
          </div>
        </div>

        <p className="text-center font-body text-white/20 text-xs mt-4">
          Проблема с оплатой? Напиши в поддержку на сайте
        </p>
      </div>
    </div>
  );
}