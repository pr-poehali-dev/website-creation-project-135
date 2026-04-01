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
  const [rubRate, setRubRate] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!orderId) { setLoading(false); return; }
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, [orderId]);

  useEffect(() => {
    fetch(`${ORDERS_URL}?action=usd_rate`)
      .then(r => r.json())
      .then(d => { if (d.rate) setRubRate(d.rate); })
      .catch(() => setRubRate(90));
  }, []);

  useEffect(() => {
    if (!order || order.crypto_amount) return;
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
    if (order.crypto_amount) {
      if (order.network === "USDT_BEP" || order.network === "USDT_TRC") return order.crypto_amount.toFixed(2) + " USDT";
      if (order.network === "LTC") return order.crypto_amount.toFixed(6) + " LTC";
      if (order.network === "SOL") return order.crypto_amount.toFixed(4) + " SOL";
    }
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

  function getRubAmount(): string | null {
    if (!order || !rubRate) return null;
    const rub = Math.ceil(order.amount_usd * rubRate);
    return rub.toLocaleString("ru") + " ₽";
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

  void navigate;

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
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A1220" }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        <p className="font-body text-white/40 text-sm">Загружаем заказ...</p>
      </div>
    </div>
  );

  if (!orderId || !order) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0A1220" }}>
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
          style={{ background: "rgba(232,52,58,0.15)" }}>❌</div>
        <h1 className="font-display font-bold text-white text-xl mb-2">Заказ не найден</h1>
        <p className="font-body text-white/40 text-sm mb-5">Проверьте ссылку или создайте новый заказ</p>
        <a href="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-body font-bold text-white text-sm transition-all hover:scale-105"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <Icon name="ArrowLeft" size={16} /> Вернуться в магазин
        </a>
      </div>
    </div>
  );

  // ── Оплачено ────────────────────────────────────────────────────────────────
  if (order.status === "paid") {
    const needsChat = order.needs_chat || (order.accounts && order.accounts.length === 0 && !order.game?.includes("steal"));
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: "#0A1220" }}>
        {/* Фоновое свечение */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10 blur-3xl"
            style={{ background: "radial-gradient(circle, #21BF73, transparent)" }} />
        </div>

        <div className="w-full max-w-md relative">
          <div className="rounded-2xl overflow-hidden"
            style={{ background: "#111B27", border: "1px solid rgba(33,191,115,0.25)", boxShadow: "0 25px 60px rgba(0,0,0,0.5)" }}>

            {/* Заголовок */}
            <div className="px-6 py-6 text-center"
              style={{ background: "linear-gradient(135deg, rgba(33,191,115,0.12), rgba(0,180,80,0.05))", borderBottom: "1px solid rgba(33,191,115,0.15)" }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3"
                style={{ background: "rgba(33,191,115,0.15)", border: "1px solid rgba(33,191,115,0.3)" }}>✅</div>
              <h1 className="font-display font-bold text-white text-2xl mb-1">Оплата подтверждена!</h1>
              <p className="font-body text-white/40 text-sm">Заказ #{order.order_id.slice(0, 8).toUpperCase()}</p>
            </div>

            <div className="px-5 py-4">
              <p className="font-body text-white/40 text-xs uppercase tracking-wider mb-3">
                {needsChat ? "Ваш заказ" : `Аккаунты (${order.accounts?.length || 0} шт.)`}
              </p>

              {needsChat ? (
                <div className="text-center py-4">
                  <p className="font-body text-white/55 text-sm mb-5">
                    Продавец свяжется с вами в чате и передаст товар вручную
                  </p>
                  {order.chat_id && (
                    <a href={`/order-chat?chat_id=${order.chat_id}`}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-body font-bold text-sm text-white transition-all hover:scale-105"
                      style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)", boxShadow: "0 4px 20px rgba(0,102,255,0.35)" }}>
                      <span>💬</span> Открыть чат с продавцом
                    </a>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {order.accounts?.map((acc, i) => (
                    <div key={i} className="p-3 rounded-xl font-body text-sm text-white/80 select-all"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", fontFamily: "monospace" }}>
                      {acc}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-5 pb-5">
              <a href="/"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-body font-bold text-sm text-white/50 hover:text-white border border-white/8 hover:border-white/20 transition-all mt-2">
                <Icon name="ArrowLeft" size={14} /> Вернуться в магазин
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Истёк ────────────────────────────────────────────────────────────────
  if (expired) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0A1220" }}>
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
          style={{ background: "rgba(232,52,58,0.12)" }}>⏱</div>
        <h1 className="font-display font-bold text-white text-xl mb-2">Время оплаты истекло</h1>
        <p className="font-body text-white/40 text-sm mb-5">Создайте новый заказ в магазине</p>
        <a href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-body font-bold text-sm text-white transition-all hover:scale-105"
          style={{ background: "linear-gradient(135deg, #E8343A, #B02020)", boxShadow: "0 4px 20px rgba(232,52,58,0.3)" }}>
          <Icon name="ArrowLeft" size={16} /> В магазин
        </a>
      </div>
    </div>
  );

  // ── Крипто-оплата ────────────────────────────────────────────────────────────────
  const netColor = NETWORK_COLORS[order.network] || "#0066FF";
  const rubAmount = getRubAmount();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: "#0A1220" }}>

      {/* Фоновое свечение */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-64 opacity-5 blur-3xl"
          style={{ background: `radial-gradient(ellipse, ${netColor}, transparent)` }} />
      </div>

      <div className="w-full max-w-md relative">

        {/* Шапка */}
        <div className="flex items-center gap-3 mb-5">
          <a href="/" className="w-9 h-9 rounded-xl flex items-center justify-center text-white/50 hover:text-white transition-all hover:scale-105"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <Icon name="ArrowLeft" size={18} />
          </a>
          <div>
            <h1 className="font-display font-bold text-white text-lg">Оплата криптовалютой</h1>
            <p className="font-body text-white/35 text-xs">Заказ #{order.order_id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden"
          style={{ background: "#111B27", border: "1px solid rgba(255,255,255,0.07)", boxShadow: "0 25px 60px rgba(0,0,0,0.5)" }}>

          {/* Сумма в рублях — главный блок */}
          <div className="px-5 py-5 border-b border-white/5"
            style={{ background: "linear-gradient(135deg, rgba(0,102,255,0.1), rgba(0,40,120,0.05))" }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-body text-white/40 text-xs mb-1">Товар</p>
                <p className="font-display font-bold text-white text-base">{order.item_name}</p>
                {order.quantity > 1 && (
                  <p className="font-body text-white/35 text-xs mt-0.5">× {order.quantity} шт.</p>
                )}
              </div>
              <div className="text-right">
                <p className="font-body text-white/40 text-xs mb-1">К оплате</p>
                {rubAmount ? (
                  <>
                    <p className="font-display font-bold text-2xl text-white">{rubAmount}</p>
                    <p className="font-body text-white/30 text-xs mt-0.5">${order.amount_usd.toFixed(2)}</p>
                  </>
                ) : (
                  <p className="font-display font-bold text-2xl" style={{ color: "#4DA6FF" }}>
                    ${order.amount_usd.toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Таймер */}
          <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between"
            style={{ background: secondsLeft < 300 ? "rgba(232,52,58,0.06)" : "rgba(255,184,0,0.05)" }}>
            <div className="flex items-center gap-2">
              <span className="text-sm">⏱</span>
              <span className="font-body text-white/50 text-xs">Времени осталось</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-lg"
                style={{ color: secondsLeft < 300 ? "#E8343A" : "#FFB800" }}>
                {formatTime(secondsLeft)}
              </span>
              {secondsLeft < 300 && (
                <span className="px-1.5 py-0.5 rounded text-xs font-bold animate-pulse"
                  style={{ background: "rgba(232,52,58,0.2)", color: "#E8343A" }}>
                  мало
                </span>
              )}
            </div>
          </div>

          {/* Сеть + сумма в крипте */}
          <div className="px-5 py-4 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-body text-white/40 text-xs mb-2">Сеть оплаты</p>
                <div className="flex items-center gap-2">
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm"
                    style={{ background: `${netColor}18`, border: `1px solid ${netColor}35`, color: netColor }}>
                    {NETWORK_ICONS[order.network] || "₿"}
                  </span>
                  <span className="font-display font-bold text-white text-sm">{order.network_label}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-body text-white/40 text-xs mb-1">Отправить точно</p>
                {getCryptoAmount() ? (
                  <div>
                    <div className="flex items-center gap-1.5 justify-end">
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
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-105"
                        style={{ background: copiedAmount ? `${netColor}25` : "rgba(255,255,255,0.07)", color: copiedAmount ? netColor : "rgba(255,255,255,0.35)" }}>
                        <Icon name={copiedAmount ? "Check" : "Copy"} size={12} />
                      </button>
                    </div>
                    {getCryptoRateLabel() && (
                      <p className="font-body text-white/25 text-xs mt-0.5 text-right">{getCryptoRateLabel()}</p>
                    )}
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 ml-auto mt-1"
                    style={{ borderColor: netColor, borderTopColor: "transparent" }}
                    className="animate-spin" />
                )}
              </div>
            </div>
          </div>

          {/* Адрес кошелька */}
          <div className="px-5 py-4 border-b border-white/5">
            <p className="font-body text-white/40 text-xs uppercase tracking-wider mb-2">Адрес кошелька</p>
            <div className="flex items-center gap-2 p-3 rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="font-body text-white/75 text-xs break-all flex-1 select-all"
                style={{ fontFamily: "monospace", lineHeight: 1.5 }}>
                {order.address}
              </p>
              <button onClick={copyAddress}
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:scale-105"
                style={{ background: copied ? "rgba(33,191,115,0.2)" : "rgba(255,255,255,0.07)", border: `1px solid ${copied ? "rgba(33,191,115,0.3)" : "rgba(255,255,255,0.08)"}` }}>
                <Icon name={copied ? "Check" : "Copy"} size={16} className={copied ? "text-green-400" : "text-white/50"} />
              </button>
            </div>
            {copied && (
              <p className="font-body text-green-400 text-xs mt-1.5 flex items-center gap-1">
                <Icon name="Check" size={11} /> Адрес скопирован!
              </p>
            )}
          </div>

          {/* Подсказка */}
          <div className="px-5 py-3.5 border-b border-white/5"
            style={{ background: "rgba(255,255,255,0.015)" }}>
            <div className="flex items-start gap-2">
              <span className="text-yellow-400 text-sm mt-0.5">⚠️</span>
              <p className="font-body text-white/40 text-xs leading-relaxed">
                Отправь <span className="text-white/60 font-bold">точную сумму</span> на указанный адрес.
                После отправки нажми «Я оплатил» — система проверит транзакцию.
              </p>
            </div>
          </div>

          {/* Кнопка проверки */}
          <div className="px-5 py-4">
            <button
              onClick={checkPayment}
              disabled={checking}
              className="w-full py-3.5 rounded-xl font-body font-bold text-white text-base transition-all hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                background: checking ? "rgba(0,102,255,0.5)" : "linear-gradient(135deg, #0066FF, #0044BB)",
                boxShadow: checking ? "none" : "0 4px 20px rgba(0,102,255,0.35)",
              }}>
              {checking ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Проверяем транзакцию...</span>
                </>
              ) : (
                <>
                  <span>✅</span>
                  <span>Я оплатил — проверить</span>
                </>
              )}
            </button>
          </div>
        </div>

        <p className="text-center font-body text-white/20 text-xs mt-4">
          Проблема с оплатой?{" "}
          <a href="https://t.me/your_support" target="_blank" rel="noopener noreferrer"
            className="text-white/40 hover:text-white/60 underline underline-offset-2 transition-colors">
            Напиши в поддержку
          </a>
        </p>
      </div>
    </div>
  );
}
