import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Icon from "@/components/ui/icon";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loginVal, setLoginVal] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const err = await login(loginVal, password);
    setLoading(false);
    if (err) { setError(err); return; }
    navigate("/profile");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0F1923" }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-display font-bold text-white"
              style={{ background: "linear-gradient(135deg, #0066FF, #E8343A)" }}>C</div>
            <span className="font-display font-bold text-xl text-white">
              КамбекШОП
            </span>
          </Link>
          <h1 className="font-display font-bold text-white text-2xl">Вход в аккаунт</h1>
          <p className="font-body text-white/40 text-sm mt-1">Введи почту или логин и пароль</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl p-6 flex flex-col gap-4"
          style={{ background: "#161F2C", border: "1px solid rgba(255,255,255,0.06)" }}>

          {error && (
            <div className="px-4 py-3 rounded-xl text-sm font-body text-red-400 text-center"
              style={{ background: "rgba(232,52,58,0.1)", border: "1px solid rgba(232,52,58,0.2)" }}>
              {error}
            </div>
          )}

          <div>
            <label className="font-body text-white/50 text-xs mb-1.5 block">Email или логин</label>
            <input
              type="text"
              value={loginVal}
              onChange={e => setLoginVal(e.target.value)}
              placeholder="example@mail.com"
              className="w-full px-4 py-3 rounded-xl font-body text-sm text-white outline-none transition-all"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
              required
            />
          </div>

          <div>
            <label className="font-body text-white/50 text-xs mb-1.5 block">Пароль</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-body font-bold text-white text-base transition-all hover:scale-[1.02] disabled:opacity-60 mt-1"
            style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)", touchAction: "manipulation" }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Входим...
              </span>
            ) : "Войти"}
          </button>

          <p className="text-center font-body text-white/40 text-sm">
            Нет аккаунта?{" "}
            <Link to="/register" className="text-blue-400 hover:text-blue-300 font-bold">
              Зарегистрироваться
            </Link>
          </p>
        </form>

        <div className="text-center mt-4">
          <Link to="/" className="font-body text-white/30 text-sm hover:text-white/60 transition-colors">
            ← Вернуться в магазин
          </Link>
        </div>
      </div>
    </div>
  );
}