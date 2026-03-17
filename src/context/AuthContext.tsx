import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const AUTH_URL = "https://functions.poehali.dev/4d9f59a5-cbc5-418a-bb2f-849af25b8236";

type User = { id: string; username: string; email: string; created_at?: string };

type Order = {
  order_id: string; item_name: string; amount_usd: number;
  quantity: number; network: string; status: string;
  created_at: string; paid_at?: string; game?: string;
};

type PaidItem = { order_id: string; item_name: string; accounts: string[] };

type AuthCtx = {
  user: User | null;
  token: string | null;
  orders: Order[];
  paidItems: PaidItem[];
  loading: boolean;
  login: (login: string, password: string) => Promise<string | null>;
  register: (username: string, email: string, password: string) => Promise<string | null>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("cambeck_token"));
  const [orders, setOrders] = useState<Order[]>([]);
  const [paidItems, setPaidItems] = useState<PaidItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) refreshProfile();
    else setLoading(false);
  }, []);

  async function refreshProfile() {
    const t = token || localStorage.getItem("cambeck_token");
    if (!t) { setLoading(false); return; }
    try {
      const res = await fetch(`${AUTH_URL}?action=me`, {
        headers: { "X-Auth-Token": t },
      });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setOrders(data.orders || []);
        setPaidItems(data.paid_items || []);
      } else {
        // Токен недействителен
        localStorage.removeItem("cambeck_token");
        setToken(null);
        setUser(null);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }

  async function login(loginVal: string, password: string): Promise<string | null> {
    const res = await fetch(`${AUTH_URL}?action=login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login: loginVal, password }),
    });
    const data = await res.json();
    if (data.error) return data.error;
    localStorage.setItem("cambeck_token", data.token);
    setToken(data.token);
    setUser(data.user);
    await refreshProfile();
    return null;
  }

  async function register(username: string, email: string, password: string): Promise<string | null> {
    const res = await fetch(`${AUTH_URL}?action=register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (data.error) return data.error;
    localStorage.setItem("cambeck_token", data.token);
    setToken(data.token);
    setUser(data.user);
    await refreshProfile();
    return null;
  }

  function logout() {
    const t = token;
    if (t) {
      fetch(`${AUTH_URL}?action=logout`, {
        method: "POST",
        headers: { "X-Auth-Token": t },
      }).catch(() => {});
    }
    localStorage.removeItem("cambeck_token");
    setToken(null);
    setUser(null);
    setOrders([]);
    setPaidItems([]);
  }

  return (
    <AuthContext.Provider value={{ user, token, orders, paidItems, loading, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}