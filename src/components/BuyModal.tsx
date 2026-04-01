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

export default function BuyModal({ item, onClose }: Props) {
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [agreed, setAgreed] = useState(false);
  const [step, setStep] = useState<"details" | "payment">("details");
  const [copied, setCopied] = useState(false);
  const [payMethod, setPayMethod] = useState<PaymentMethod>("sberbank");
  const [rubRate, setRubRate] = useState<number | null>(null);
  const maxQty = Math.min(item.stock, 9999);

  const totalUsd = item.priceUsd * quantity;
  const totalRub = rubRate ? Math.ceil(totalUsd * rubRate) : null;

  useEffect(() => {
    fetch(`${ORDERS_URL}?action=usd_rate`)
      .then(r => r.json())
      .then(d => { if (d.rate) setRubRate(d.rate); })
      .catch(() => setRubRate(90));
  }, []);

  function handlePay() {
    if (!agreed) return;
    setStep("payment");
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
                  {step === "details" ? "Оформление заказа" : "Оплата"}
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

        {step === "details" ? (
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
                    style={{ background: "#21A048" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                      <path d="M20.9 12.5c.1-.5.1-1 .1-1.5C21 6.2 16.8 2 11.6 2 6.4 2 2 6.5 2 11.7c0 5.3 4.4 9.7 9.7 9.7 2.4 0 4.6-.9 6.3-2.3l-2-2c-1.1.9-2.5 1.4-4 1.4-3.7 0-6.8-3-6.8-6.7 0-3.7 3-6.7 6.7-6.7 3.4 0 6.2 2.5 6.6 5.8H14v2.6h6.9z"/>
                    </svg>
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
              disabled={!agreed}
              className="w-full py-3.5 rounded-xl font-body font-bold text-white text-base transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: agreed ? "linear-gradient(135deg, #0066FF, #0044BB)" : "rgba(255,255,255,0.1)", boxShadow: agreed ? "0 4px 20px rgba(0,102,255,0.35)" : "none" }}>
              {totalRub
                ? <>Перейти к оплате · {totalRub.toLocaleString("ru")} ₽</>
                : "Перейти к оплате"}
              <Icon name="ArrowRight" size={16} />
            </button>
          </div>
        ) : (
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
                  <span className="font-body text-white/30 text-xs">${totalUsd.toFixed(2)}</span>
                </div>
                <div>
                  <p className="font-body text-white/50 text-xs mb-1">Переведите сумму</p>
                  {totalRub ? (
                    <p className="font-display font-bold text-4xl text-white">{totalRub.toLocaleString("ru")} <span style={{ color: "#4ADE80" }}>₽</span></p>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-green-400 border-t-transparent animate-spin" />
                  )}
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
                  `Укажите сумму: ${totalRub ? totalRub.toLocaleString("ru") + " ₽" : "загрузка..."}`,
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
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-body text-xs font-bold transition-all hover:scale-105 flex-shrink-0"
                    style={{
                      background: copied ? "rgba(33,160,72,0.25)" : "rgba(255,255,255,0.1)",
                      color: copied ? "#4ADE80" : "rgba(255,255,255,0.8)",
                      border: `1px solid ${copied ? "rgba(33,160,72,0.5)" : "rgba(255,255,255,0.12)"}`,
                    }}>
                    <Icon name={copied ? "Check" : "Copy"} size={13} />
                    {copied ? "Скопировано!" : "Копировать"}
                  </button>
                </div>
              </div>
            </div>

            {/* Статус оплаты */}
            <div className="w-full py-3.5 rounded-xl font-body font-bold text-white text-sm text-center flex items-center justify-center gap-2"
              style={{ background: "rgba(33,160,72,0.15)", border: "1px solid rgba(33,160,72,0.35)" }}>
              <span>✅</span> Я оплатил
            </div>

            <p className="font-body text-white/25 text-xs text-center">
              После оплаты ваш заказ будет выполнен в течение нескольких минут
            </p>
          </div>
        )}
      </div>
    </div>
  );
}