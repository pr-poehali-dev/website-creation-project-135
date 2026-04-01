import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/context/AuthContext";

const ORDERS_URL = "https://functions.poehali.dev/f852d147-eae1-4265-a94d-63d014c42231";
const PHONE_NUMBER = "79181440716";
const PHONE_DISPLAY = "+7 918 144-07-16";

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

type PaymentMethod = "sbp" | "sberbank";

type OrderCreated = {
  order_id: string;
  amount_rub: number;
  amount_usd: number;
};

function getVisitorId() {
  let vid = localStorage.getItem("cambeck_visitor_id");
  if (!vid) {
    vid = Math.random().toString(36).slice(2) + Date.now();
    localStorage.setItem("cambeck_visitor_id", vid);
  }
  return vid;
}

export default function BuyModal({ item, onClose }: Props) {
  const { user, token, refreshProfile } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [agreed, setAgreed] = useState(false);
  const [step, setStep] = useState<"details" | "payment" | "success" | "error">("details");
  const [copied, setCopied] = useState(false);
  const [payMethod, setPayMethod] = useState<PaymentMethod>("sberbank");
  const [rubRate, setRubRate] = useState<number | null>(null);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [order, setOrder] = useState<OrderCreated | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<"paid" | "pending" | null>(null);
  const maxQty = Math.min(item.stock, 9999);

  const totalUsd = item.priceUsd * quantity;
  const totalRub = rubRate ? Math.ceil(totalUsd * rubRate) : null;

  useEffect(() => {
    fetch(`${ORDERS_URL}?action=usd_rate`)
      .then(r => r.json())
      .then(d => { if (d.rate) setRubRate(d.rate); })
      .catch(() => setRubRate(90));
  }, []);

  async function handlePay() {
    if (!agreed) return;
    setCreatingOrder(true);
    try {
      const res = await fetch(`${ORDERS_URL}?action=create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "X-Auth-Token": token } : {}),
        },
        body: JSON.stringify({
          item_id: item.id,
          item_name: item.name,
          price_usd: item.priceUsd,
          quantity,
          network: "SBP",
          game: item.game || "steal-a-brainrot",
          visitor_id: getVisitorId(),
          visitor_name: user?.username || "Покупатель",
        }),
      });
      const data = await res.json();
      if (data.error) {
        setStep("error");
        return;
      }
      setOrder({
        order_id: data.order_id,
        amount_rub: data.amount_rub || (totalRub ?? Math.ceil(totalUsd * 90)),
        amount_usd: data.amount_usd || totalUsd,
      });
      setStep("payment");
    } catch {
      setStep("error");
    } finally {
      setCreatingOrder(false);
    }
  }

  async function checkPayment() {
    if (!order) return;
    setChecking(true);
    setCheckResult(null);
    try {
      const res = await fetch(`${ORDERS_URL}?action=check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: order.order_id,
          visitor_id: getVisitorId(),
          visitor_name: user?.username || "Покупатель",
        }),
      });
      const data = await res.json();
      if (data.status === "paid") {
        setCheckResult("paid");
        setStep("success");
        // Обновляем профиль чтобы заказ появился в истории
        await refreshProfile();
      } else {
        setCheckResult("pending");
      }
    } catch {
      setCheckResult("pending");
    } finally {
      setChecking(false);
    }
  }

  function copyPhone() {
    navigator.clipboard.writeText(PHONE_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  if (!user) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)" }}
        onClick={onClose}
      >
        <div
          className="w-full max-w-sm rounded-2xl p-8 text-center animate-bounce-in"
          style={{ background: "#161F2C", border: "1px solid rgba(0,102,255,0.25)" }}
          onClick={e => e.stopPropagation()}
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
            style={{ background: "rgba(0,102,255,0.12)" }}>🔐</div>
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
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden animate-bounce-in"
        style={{ background: "#111B27", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 25px 60px rgba(0,0,0,0.6)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-5 py-4 border-b border-white/5"
          style={{ background: "linear-gradient(135deg, rgba(0,102,255,0.12), rgba(0,60,180,0.06))" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {step === "payment" && (
                <button onClick={() => setStep("details")}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all">
                  <Icon name="ArrowLeft" size={16} />
                </button>
              )}
              <div>
                <h3 className="font-display font-bold text-white text-lg">
                  {step === "details" ? "Оформление заказа" : step === "payment" ? "Оплата" : step === "success" ? "Заказ принят" : "Ошибка"}
                </h3>
                <p className="font-body text-white/40 text-xs mt-0.5 truncate max-w-[220px]">{item.name}</p>
              </div>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
              <Icon name="X" size={16} />
            </button>
          </div>
        </div>

        {/* Шаг 1 — детали */}
        {step === "details" && (
          <div className="px-5 py-5 flex flex-col gap-4">

            {/* Количество */}
            {maxQty > 1 && (
              <div>
                <p className="font-body text-white/40 text-xs uppercase tracking-wider mb-2">Количество</p>
                <div className="flex items-center gap-3">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-lg transition-all hover:scale-105"
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    −
                  </button>
                  <span className="font-display font-bold text-white text-xl w-10 text-center">{quantity}</span>
                  <button onClick={() => setQuantity(q => Math.min(maxQty, q + 1))}
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-lg transition-all hover:scale-105"
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    +
                  </button>
                  <span className="font-body text-white/25 text-xs ml-1">макс. {maxQty}</span>
                </div>
              </div>
            )}

            {/* Итого */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: "linear-gradient(135deg, rgba(0,102,255,0.15), rgba(0,60,180,0.08))", border: "1px solid rgba(0,102,255,0.25)" }}>
              <div className="px-4 py-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-body text-white/50 text-sm">К оплате</span>
                  <span className="font-body text-white/30 text-xs">${totalUsd.toFixed(2)}</span>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    {totalRub ? (
                      <span className="font-display font-bold text-3xl text-white">{totalRub.toLocaleString("ru")} ₽</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                        <span className="font-body text-white/40 text-sm">Загрузка курса...</span>
                      </div>
                    )}
                    {totalRub && rubRate && (
                      <p className="font-body text-white/30 text-xs mt-0.5">Курс: 1 $ = {rubRate} ₽</p>
                    )}
                  </div>
                  <div className="text-4xl">💳</div>
                </div>
              </div>
            </div>

            {/* Способ оплаты */}
            <div>
              <p className="font-body text-white/40 text-xs uppercase tracking-wider mb-2">Способ оплаты</p>
              <div className="flex flex-col gap-2">

                {/* Сбербанк */}
                <button
                  onClick={() => setPayMethod("sberbank")}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all hover:scale-[1.01]"
                  style={{
                    background: payMethod === "sberbank" ? "rgba(33,160,72,0.15)" : "rgba(255,255,255,0.04)",
                    border: payMethod === "sberbank" ? "1.5px solid rgba(33,160,72,0.5)" : "1.5px solid rgba(255,255,255,0.08)",
                  }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: payMethod === "sberbank" ? "rgba(33,160,72,0.25)" : "rgba(255,255,255,0.06)" }}>
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "#21A048" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                        <path d="M20.9 12.5c.1-.5.1-1 .1-1.5C21 6.2 16.8 2 11.6 2 6.4 2 2 6.5 2 11.7c0 5.3 4.4 9.7 9.7 9.7 2.4 0 4.6-.9 6.3-2.3l-2-2c-1.1.9-2.5 1.4-4 1.4-3.7 0-6.8-3-6.8-6.7 0-3.7 3-6.7 6.7-6.7 3.4 0 6.2 2.5 6.6 5.8H14v2.6h6.9z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-body font-bold text-white text-sm">Сбербанк</p>
                      <span className="px-1.5 py-0.5 rounded text-xs font-bold"
                        style={{ background: "rgba(33,160,72,0.25)", color: "#4ADE80" }}>
                        рекомендуем
                      </span>
                    </div>
                    <p className="font-body text-white/40 text-xs">Перевод по номеру телефона</p>
                  </div>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: payMethod === "sberbank" ? "#21A048" : "rgba(255,255,255,0.1)", border: payMethod !== "sberbank" ? "2px solid rgba(255,255,255,0.2)" : "none" }}>
                    {payMethod === "sberbank" && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>

                {/* СБП */}
                <button
                  onClick={() => setPayMethod("sbp")}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all hover:scale-[1.01]"
                  style={{
                    background: payMethod === "sbp" ? "rgba(0,102,255,0.12)" : "rgba(255,255,255,0.04)",
                    border: payMethod === "sbp" ? "1.5px solid rgba(0,102,255,0.4)" : "1.5px solid rgba(255,255,255,0.08)",
                  }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #1D1D27, #2A2A3F)" }}>
                    <span className="text-lg font-bold" style={{ color: "#FF6B35" }}>СБП</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-body font-bold text-white text-sm">Система быстрых платежей</p>
                    <p className="font-body text-white/40 text-xs">Любой банк через СБП</p>
                  </div>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: payMethod === "sbp" ? "#0066FF" : "rgba(255,255,255,0.1)", border: payMethod !== "sbp" ? "2px solid rgba(255,255,255,0.2)" : "none" }}>
                    {payMethod === "sbp" && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>
              </div>
            </div>

            {/* Согласие с офертой */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex-shrink-0 mt-0.5">
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="sr-only" />
                <div className="w-5 h-5 rounded-md flex items-center justify-center transition-all"
                  style={{ background: agreed ? "#0066FF" : "rgba(255,255,255,0.07)", border: `2px solid ${agreed ? "#0066FF" : "rgba(255,255,255,0.18)"}` }}>
                  {agreed && <Icon name="Check" size={11} className="text-white" />}
                </div>
              </div>
              <span className="font-body text-white/45 text-xs leading-relaxed group-hover:text-white/65 transition-colors">
                Я принимаю условия{" "}
                <a href="/oferta" target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                  className="text-blue-400 hover:text-blue-300 underline underline-offset-2">
                  публичной оферты
                </a>{" "}и{" "}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                  className="text-blue-400 hover:text-blue-300 underline underline-offset-2">
                  политики конфиденциальности
                </a>
              </span>
            </label>

            {/* Кнопка */}
            <button
              onClick={handlePay}
              disabled={!agreed || creatingOrder}
              className="w-full py-3.5 rounded-xl font-body font-bold text-white text-base transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: agreed ? "linear-gradient(135deg, #0066FF, #0044BB)" : "rgba(255,255,255,0.1)", boxShadow: agreed ? "0 4px 20px rgba(0,102,255,0.35)" : "none" }}>
              {creatingOrder ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Создаём заказ...
                </>
              ) : totalRub
                ? <>Перейти к оплате · {totalRub.toLocaleString("ru")} ₽</>
                : "Перейти к оплате"}
              {!creatingOrder && <Icon name="ArrowRight" size={16} />}
            </button>
          </div>
        )}

        {/* Шаг 2 — оплата */}
        {step === "payment" && order && (
          <div className="px-5 py-5 flex flex-col gap-4">

            {/* Сумма к оплате — главная карточка */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: "linear-gradient(135deg, #1A4A28, #0F2D18)", border: "1px solid rgba(33,160,72,0.3)" }}>
              <div className="px-4 py-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {payMethod === "sberbank" ? (
                      <>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#21A048" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                            <path d="M20.9 12.5c.1-.5.1-1 .1-1.5C21 6.2 16.8 2 11.6 2 6.4 2 2 6.5 2 11.7c0 5.3 4.4 9.7 9.7 9.7 2.4 0 4.6-.9 6.3-2.3l-2-2c-1.1.9-2.5 1.4-4 1.4-3.7 0-6.8-3-6.8-6.7 0-3.7 3-6.7 6.7-6.7 3.4 0 6.2 2.5 6.6 5.8H14v2.6h6.9z"/>
                          </svg>
                        </div>
                        <span className="font-body font-bold text-white/70 text-sm">Сбербанк</span>
                      </>
                    ) : (
                      <>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                          style={{ background: "linear-gradient(135deg, #1D1D27, #2A2A3F)", color: "#FF6B35" }}>
                          СБП
                        </div>
                        <span className="font-body font-bold text-white/70 text-sm">СБП</span>
                      </>
                    )}
                  </div>
                  <span className="font-body text-white/30 text-xs">${order.amount_usd.toFixed(2)}</span>
                </div>
                <div>
                  <p className="font-body text-white/50 text-xs mb-1">Переведите сумму</p>
                  <p className="font-display font-bold text-4xl text-white">
                    {order.amount_rub.toLocaleString("ru")} <span style={{ color: "#4ADE80" }}>₽</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Инструкция */}
            <div className="rounded-2xl p-4"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="font-body font-bold text-white text-sm mb-3">Как оплатить:</p>
              <div className="flex flex-col gap-2.5">
                {[
                  payMethod === "sberbank"
                    ? "Откройте приложение Сбербанк → Переводы → По номеру телефона"
                    : "Откройте любое банковское приложение и выберите оплату через СБП",
                  `Укажите сумму: ${order.amount_rub.toLocaleString("ru")} ₽`,
                  `В комментарии напишите: «${item.name}»`,
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs text-white"
                      style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)" }}>
                      {i + 1}
                    </span>
                    <span className="font-body text-white/55 text-xs leading-relaxed">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Номер телефона */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: payMethod === "sberbank" ? "rgba(33,160,72,0.1)" : "rgba(0,102,255,0.1)", border: `1px solid ${payMethod === "sberbank" ? "rgba(33,160,72,0.3)" : "rgba(0,102,255,0.3)"}` }}>
              <div className="px-4 py-3">
                <p className="font-body text-white/40 text-xs mb-1">
                  {payMethod === "sberbank" ? "Номер Сбербанка для перевода" : "Номер для СБП"}
                </p>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-display font-bold text-white text-2xl tracking-wide">{PHONE_DISPLAY}</p>
                  <button onClick={copyPhone}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-body text-xs font-bold transition-all hover:scale-105 flex-shrink-0"
                    style={{ background: copied ? "rgba(33,160,72,0.3)" : "rgba(255,255,255,0.1)", color: copied ? "#4ADE80" : "rgba(255,255,255,0.7)", border: `1px solid ${copied ? "rgba(33,160,72,0.4)" : "rgba(255,255,255,0.15)"}` }}>
                    <Icon name={copied ? "Check" : "Copy"} size={12} />
                    {copied ? "Скопировано" : "Копировать"}
                  </button>
                </div>
                {payMethod === "sbp" && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="w-4 h-4 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: "#21A048" }}>
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="white">
                        <path d="M20.9 12.5c.1-.5.1-1 .1-1.5C21 6.2 16.8 2 11.6 2 6.4 2 2 6.5 2 11.7c0 5.3 4.4 9.7 9.7 9.7 2.4 0 4.6-.9 6.3-2.3l-2-2c-1.1.9-2.5 1.4-4 1.4-3.7 0-6.8-3-6.8-6.7 0-3.7 3-6.7 6.7-6.7 3.4 0 6.2 2.5 6.6 5.8H14v2.6h6.9z"/>
                      </svg>
                    </div>
                    <p className="font-body text-white/40 text-xs">Переводили на <span className="text-white/60 font-bold">Сбербанк</span></p>
                  </div>
                )}
              </div>
            </div>

            {/* Кнопка "Я оплатил" */}
            <button
              onClick={checkPayment}
              disabled={checking}
              className="w-full py-3.5 rounded-xl font-body font-bold text-white text-sm transition-all hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, rgba(33,160,72,0.3), rgba(33,160,72,0.2))", border: "1px solid rgba(33,160,72,0.5)" }}>
              {checking ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-green-400 border-t-transparent animate-spin" />
                  Проверяем оплату...
                </>
              ) : (
                <>
                  <span>✅</span> Я оплатил
                </>
              )}
            </button>

            {/* Сообщение если оплата не найдена */}
            {checkResult === "pending" && (
              <div className="rounded-xl px-4 py-3 text-center"
                style={{ background: "rgba(255,184,0,0.08)", border: "1px solid rgba(255,184,0,0.2)" }}>
                <p className="font-body text-yellow-400 text-xs">
                  ⏳ Оплата пока не поступила. Если вы только что перевели — подождите 1–2 минуты и попробуйте снова.
                </p>
              </div>
            )}

            <p className="font-body text-white/25 text-xs text-center">
              После подтверждения оплаты продавец свяжется с вами и передаст товар
            </p>
          </div>
        )}

        {/* Шаг 3 — успех */}
        {step === "success" && (
          <div className="px-5 py-8 flex flex-col items-center gap-4 text-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
              style={{ background: "rgba(33,160,72,0.15)", border: "1px solid rgba(33,160,72,0.3)" }}>
              ✅
            </div>
            <div>
              <h3 className="font-display font-bold text-white text-xl mb-2">Заказ принят!</h3>
              <p className="font-body text-white/50 text-sm">
                Ваш заказ подтверждён. Продавец скоро свяжется с вами и передаст товар.
              </p>
            </div>
            <div className="w-full rounded-xl px-4 py-3"
              style={{ background: "rgba(0,102,255,0.08)", border: "1px solid rgba(0,102,255,0.2)" }}>
              <p className="font-body text-white/50 text-xs mb-1">Номер заказа</p>
              <p className="font-mono text-blue-400 text-sm font-bold">#{order?.order_id.slice(0, 8).toUpperCase()}</p>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <Link to="/profile"
                onClick={onClose}
                className="w-full py-3 rounded-xl font-body font-bold text-white text-sm text-center transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)" }}>
                Мои заказы
              </Link>
              <button onClick={onClose}
                className="w-full py-3 rounded-xl font-body font-bold text-sm text-center transition-all hover:scale-105"
                style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
                Закрыть
              </button>
            </div>
          </div>
        )}

        {/* Ошибка */}
        {step === "error" && (
          <div className="px-5 py-8 flex flex-col items-center gap-4 text-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
              style={{ background: "rgba(232,52,58,0.15)", border: "1px solid rgba(232,52,58,0.3)" }}>
              ❌
            </div>
            <div>
              <h3 className="font-display font-bold text-white text-xl mb-2">Ошибка создания заказа</h3>
              <p className="font-body text-white/50 text-sm">
                Что-то пошло не так. Попробуй ещё раз или обратись в поддержку.
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={() => setStep("details")}
                className="w-full py-3 rounded-xl font-body font-bold text-white text-sm text-center transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)" }}>
                Попробовать снова
              </button>
              <button onClick={onClose}
                className="w-full py-3 rounded-xl font-body font-bold text-sm text-center transition-all hover:scale-105"
                style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
                Закрыть
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
