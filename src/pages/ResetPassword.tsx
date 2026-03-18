import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const AUTH_URL = "https://functions.poehali.dev/4d9f59a5-cbc5-418a-bb2f-849af25b8236";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [step, setStep] = useState<"request" | "sent" | "reset" | "done">(
    token ? "reset" : "request"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  async function handleRequestReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!emailRegex.test(email)) {
      setError("Введите корректный email");
      return;
    }
    setLoading(true);
    try {
      await fetch(`${AUTH_URL}?action=request_reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStep("sent");
    } catch {
      setError("Ошибка сети. Попробуй ещё раз.");
    }
    setLoading(false);
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Пароль минимум 6 символов");
      return;
    }
    if (password !== confirm) {
      setError("Пароли не совпадают");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${AUTH_URL}?action=reset_password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ошибка сброса пароля");
      } else {
        setStep("done");
      }
    } catch {
      setError("Ошибка сети. Попробуй ещё раз.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0F1923" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-display font-bold text-white"
              style={{ background: "linear-gradient(135deg, #0066FF, #E8343A)" }}>C</div>
            <span className="font-display font-bold text-xl text-white">КамбекШОП</span>
          </Link>
          <h1 className="font-display font-bold text-white text-2xl">
            {step === "request" && "Забыл пароль?"}
            {step === "sent" && "Письмо отправлено"}
            {step === "reset" && "Новый пароль"}
            {step === "done" && "Готово!"}
          </h1>
          <p className="font-body text-white/40 text-sm mt-1">
            {step === "request" && "Введи email — пришлём ссылку для сброса"}
            {step === "sent" && "Проверь почту и перейди по ссылке"}
            {step === "reset" && "Придумай новый пароль"}
            {step === "done" && "Пароль успешно изменён"}
          </p>
        </div>

        <div className="rounded-2xl p-6 flex flex-col gap-4"
          style={{ background: "#161F2C", border: "1px solid rgba(255,255,255,0.06)" }}>

          {/* Шаг 1: ввод email */}
          {step === "request" && (
            <form onSubmit={handleRequestReset} className="flex flex-col gap-4">
              {error && (
                <div className="px-4 py-3 rounded-xl text-sm font-body text-red-400 text-center"
                  style={{ background: "rgba(232,52,58,0.1)", border: "1px solid rgba(232,52,58,0.2)" }}>
                  {error}
                </div>
              )}
              <div>
                <label className="font-body text-white/50 text-xs mb-1.5 block">Твой email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  className="w-full px-4 py-3 rounded-xl font-body text-sm text-white outline-none"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
                  required
                />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl font-body font-bold text-white text-base transition-all hover:scale-[1.02] disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)" }}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Отправляем...
                  </span>
                ) : "Получить ссылку"}
              </button>
            </form>
          )}

          {/* Шаг 2: письмо отправлено */}
          {step === "sent" && (
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "rgba(0,176,111,0.1)", border: "2px solid rgba(0,176,111,0.3)" }}>
                <Icon name="Mail" size={28} style={{ color: "#00D080" }} />
              </div>
              <p className="font-body text-white/60 text-sm text-center">
                Ссылка для сброса пароля отправлена на <span className="text-white font-bold">{email}</span>.<br />
                Ссылка действительна <span className="text-white">1 час</span>.
              </p>
              <p className="font-body text-white/30 text-xs text-center">
                Не пришло? Проверь папку «Спам».
              </p>
            </div>
          )}

          {/* Шаг 3: ввод нового пароля */}
          {step === "reset" && (
            <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
              {error && (
                <div className="px-4 py-3 rounded-xl text-sm font-body text-red-400 text-center"
                  style={{ background: "rgba(232,52,58,0.1)", border: "1px solid rgba(232,52,58,0.2)" }}>
                  {error}
                </div>
              )}
              <div>
                <label className="font-body text-white/50 text-xs mb-1.5 block">Новый пароль</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Минимум 6 символов"
                    className="w-full px-4 py-3 pr-11 rounded-xl font-body text-sm text-white outline-none"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
                    required
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70">
                    <Icon name={showPass ? "EyeOff" : "Eye"} size={16} />
                  </button>
                </div>
              </div>
              <div>
                <label className="font-body text-white/50 text-xs mb-1.5 block">Повтори пароль</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-11 rounded-xl font-body text-sm text-white outline-none"
                    style={{
                      background: "rgba(255,255,255,0.07)",
                      border: `1px solid ${confirm && password !== confirm ? "rgba(232,52,58,0.5)" : "rgba(255,255,255,0.1)"}`,
                    }}
                    required
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70">
                    <Icon name={showConfirm ? "EyeOff" : "Eye"} size={16} />
                  </button>
                </div>
                {confirm && password !== confirm && (
                  <p className="font-body text-red-400 text-xs mt-1">Пароли не совпадают</p>
                )}
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl font-body font-bold text-white text-base transition-all hover:scale-[1.02] disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)" }}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Сохраняем...
                  </span>
                ) : "Сохранить пароль"}
              </button>
            </form>
          )}

          {/* Шаг 4: успех */}
          {step === "done" && (
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "rgba(0,176,111,0.1)", border: "2px solid rgba(0,176,111,0.3)" }}>
                <Icon name="CheckCircle" size={28} style={{ color: "#00D080" }} />
              </div>
              <p className="font-body text-white/60 text-sm text-center">
                Пароль изменён. Теперь можешь войти с новым паролем.
              </p>
              <Link to="/login"
                className="w-full py-3.5 rounded-xl font-body font-bold text-white text-base text-center transition-all hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)" }}>
                Войти в аккаунт
              </Link>
            </div>
          )}

          <p className="text-center font-body text-white/40 text-sm">
            <Link to="/login" className="text-blue-400 hover:text-blue-300">
              ← Вернуться ко входу
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
