import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/context/AuthContext";

const PHONE_NUMBER = "7 918 144 07 16";
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

export default function BuyModal({ item, onClose }: Props) {
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [agreed, setAgreed] = useState(false);
  const [step, setStep] = useState<"details" | "payment">("details");
  const [copied, setCopied] = useState(false);
  const maxQty = Math.min(item.stock, 9999);

  const totalUsd = item.priceUsd * quantity;

  function handlePay() {
    if (!agreed) return;
    setStep("payment");
  }

  function copyPhone() {
    navigator.clipboard.writeText(PHONE_NUMBER.replace(/\s/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Не авторизован — предлагаем войти
  if (!user) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
        onClick={onClose}
      >
        <div
          className="w-full max-w-sm rounded-2xl p-8 text-center animate-bounce-in"
          style={{ background: "#161F2C", border: "1px solid rgba(0,102,255,0.2)" }}
          onClick={e => e.stopPropagation()}
        >
          <div className="text-4xl mb-3">🔐</div>
          <h3 className="font-display font-bold text-white text-xl mb-2">Нужен аккаунт</h3>
          <p className="font-body text-white/50 text-sm mb-6">
            Чтобы купить товар, войди в аккаунт или зарегистрируйся — это бесплатно!
          </p>
          <div className="flex flex-col gap-3">
            <Link
              to="/login"
              onClick={onClose}
              className="w-full py-3 rounded-xl font-body font-bold text-white text-sm text-center transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)" }}
            >
              Войти в аккаунт
            </Link>
            <Link
              to="/register"
              onClick={onClose}
              className="w-full py-3 rounded-xl font-body font-bold text-sm text-center transition-all hover:scale-105"
              style={{
                background: "rgba(255,255,255,0.07)",
                color: "rgba(255,255,255,0.7)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
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
            <h3 className="font-display font-bold text-white text-lg">
              {step === "details" ? "Купить товар" : "Оплата"}
            </h3>
            <p className="font-body text-white/40 text-sm mt-0.5">{item.name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
          >
            <Icon name="X" size={16} />
          </button>
        </div>

        {step === "details" ? (
          <div className="px-5 py-4 flex flex-col gap-4">
            {/* Количество */}
            {maxQty > 1 && (
              <div>
                <p className="font-body text-white/50 text-xs mb-2">Количество</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white"
                    style={{ background: "rgba(255,255,255,0.07)" }}
                  >
                    −
                  </button>
                  <span className="font-display font-bold text-white text-lg w-8 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(q => Math.min(maxQty, q + 1))}
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white"
                    style={{ background: "rgba(255,255,255,0.07)" }}
                  >
                    +
                  </button>
                  <span className="font-body text-white/30 text-xs ml-2">макс. {maxQty}</span>
                </div>
              </div>
            )}

            {/* Итого */}
            <div
              className="flex items-center justify-between px-4 py-3 rounded-xl"
              style={{
                background: "rgba(0,102,255,0.08)",
                border: "1px solid rgba(0,102,255,0.15)",
              }}
            >
              <span className="font-body text-white/50 text-sm">К оплате</span>
              <span className="font-display font-bold text-2xl" style={{ color: "#4DA6FF" }}>
                ${totalUsd.toFixed(2)}
              </span>
            </div>

            {/* Способ оплаты */}
            <div>
              <p className="font-body text-white/50 text-xs mb-2">Способ оплаты</p>
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{
                  background: "rgba(0,200,100,0.08)",
                  border: "1px solid rgba(0,200,100,0.2)",
                }}
              >
                <span className="text-xl">📱</span>
                <div>
                  <p className="font-body font-bold text-white text-sm">Перевод / СБП</p>
                  <p className="font-body text-white/40 text-xs">Банковский перевод или через СБП</p>
                </div>
              </div>
            </div>

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
                  }}
                >
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

            {/* Кнопка */}
            <button
              onClick={handlePay}
              disabled={!agreed}
              className="w-full py-3.5 rounded-xl font-body font-bold text-white text-base disabled:opacity-40 transition-all hover:scale-[1.02]"
              style={{
                background: "linear-gradient(135deg, #0066FF, #0044BB)",
                touchAction: "manipulation",
                border: "none",
                cursor: agreed ? "pointer" : "not-allowed",
              }}
            >
              Перейти к оплате
            </button>
          </div>
        ) : (
          /* Шаг 2 — инструкция по оплате */
          <div className="px-5 py-4 flex flex-col gap-4">
            {/* Сумма */}
            <div
              className="flex items-center justify-between px-4 py-3 rounded-xl"
              style={{
                background: "rgba(0,102,255,0.08)",
                border: "1px solid rgba(0,102,255,0.15)",
              }}
            >
              <span className="font-body text-white/50 text-sm">Сумма перевода</span>
              <span className="font-display font-bold text-2xl" style={{ color: "#4DA6FF" }}>
                ${totalUsd.toFixed(2)}
              </span>
            </div>

            {/* Инструкция */}
            <div
              className="rounded-xl p-4 flex flex-col gap-3"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <p className="font-body font-bold text-white text-sm">Как оплатить:</p>
              <ol className="flex flex-col gap-2">
                {[
                  "Переведите сумму на номер ниже через СБП или банковский перевод",
                  `В комментарии укажите: «${item.name}»`,
                  "Отправьте скриншот чека в поддержку — мы отправим товар",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span
                      className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs"
                      style={{ background: "#0066FF", color: "#fff" }}
                    >
                      {i + 1}
                    </span>
                    <span className="font-body text-white/60 text-xs leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Номер телефона */}
            <div
              className="rounded-xl px-4 py-3 flex items-center justify-between gap-3"
              style={{
                background: "rgba(0,200,100,0.08)",
                border: "1px solid rgba(0,200,100,0.25)",
              }}
            >
              <div>
                <p className="font-body text-white/40 text-xs mb-0.5">Номер для перевода / СБП</p>
                <p className="font-display font-bold text-white text-xl tracking-wide">
                  {PHONE_DISPLAY}
                </p>
              </div>
              <button
                onClick={copyPhone}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg font-body text-xs font-bold transition-all hover:scale-105"
                style={{
                  background: copied ? "rgba(0,200,100,0.2)" : "rgba(255,255,255,0.08)",
                  color: copied ? "#00C864" : "rgba(255,255,255,0.7)",
                  border: `1px solid ${copied ? "rgba(0,200,100,0.4)" : "rgba(255,255,255,0.1)"}`,
                }}
              >
                <Icon name={copied ? "Check" : "Copy"} size={13} />
                {copied ? "Скопировано" : "Копировать"}
              </button>
            </div>

            {/* Кнопка поддержки */}
            <a
              href="https://t.me/your_support"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-xl font-body font-bold text-white text-sm text-center transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, #0088CC, #006699)",
              }}
            >
              <span>✈️</span> Написать в поддержку
            </a>

            <button
              onClick={() => setStep("details")}
              className="font-body text-white/30 text-xs text-center hover:text-white/60 transition-colors"
            >
              ← Назад
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
