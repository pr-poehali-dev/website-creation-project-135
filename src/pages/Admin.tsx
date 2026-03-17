import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";

const CHAT_URL = "https://functions.poehali.dev/5dc1e3a3-dd70-49b6-a971-dd798391a238";
const ORDERS_URL = "https://functions.poehali.dev/f852d147-eae1-4265-a94d-63d014c42231";

const CATALOG_ITEMS = [
  { id: 1,  name: "Secret Lucky Block x10" },
  { id: 2,  name: "los Tacos Lucky Block 300m x10" },
  { id: 3,  name: "Heart Lucky Blocks x10" },
  { id: 4,  name: "Quesadilla Crocodila x10" },
  { id: 5,  name: "Burrito Bandito x10" },
  { id: 6,  name: "Los Quesadilla x10" },
  { id: 7,  name: "Chicleteira Bicicleteira x10" },
  { id: 8,  name: "67 x10" },
  { id: 9,  name: "La Grande Combinasion x10" },
  { id: 10, name: "Los Nooo My Hotsportsitos x10" },
  { id: 11, name: "Random PACK SAB x10" },
  { id: 12, name: "Divine Secret Lucky Block x10" },
  { id: 13, name: "Leprechaun Lucky Block x10" },
];

type Chat = { id: string; visitor_name: string; visitor_id: string; status: string; last_message: string; msg_count: number; updated_at: string; };
type Message = { id: string; sender: string; text: string; created_at: string };
type Order = { order_id: string; item_name: string; amount_usd: number; quantity: number; network: string; status: string; created_at: string; };
type StockRow = { item_id: number; available: number; total: number };
type Account = { id: string; credentials: string; is_sold: boolean; sold_at: string | null; created_at: string };

function NewItemForm({ token, onCreated }: { token: string; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [itemId, setItemId] = useState("");
  const [priceUsd, setPriceUsd] = useState("");
  const [emoji, setEmoji] = useState("🎮");
  const [credentials, setCredentials] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleSave() {
    if (!name.trim() || !itemId.trim() || !priceUsd.trim()) {
      setMsg("❌ Заполни название, ID и цену");
      return;
    }
    setSaving(true);
    setMsg("");
    const lines = credentials.trim().split("\n").filter(l => l.trim());
    if (lines.length > 0) {
      const res = await fetch(`${ORDERS_URL}?action=add_stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Token": token },
        body: JSON.stringify({ item_id: parseInt(itemId), credentials: lines }),
      });
      const data = await res.json();
      if (data.error) { setMsg("❌ " + data.error); setSaving(false); return; }
    }
    setMsg(`✅ Товар создан${lines.length > 0 ? `, добавлено ${lines.length} аккаунтов` : ""}`);
    setSaving(false);
    setTimeout(() => onCreated(), 1000);
  }

  return (
    <div className="max-w-lg">
      <h2 className="font-display font-bold text-white text-lg mb-5">➕ Новый товар</h2>
      <div className="rounded-2xl p-5 flex flex-col gap-4"
        style={{ background: "#161F2C", border: "1px solid rgba(0,102,255,0.2)" }}>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-body text-white/50 text-xs mb-1.5 block">ID товара (число)</label>
            <input value={itemId} onChange={e => setItemId(e.target.value)} placeholder="Например: 100"
              className="w-full px-3 py-2.5 rounded-xl font-mono text-sm text-white outline-none"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }} />
            <p className="font-body text-white/25 text-xs mt-1">Уникальный номер, не повторяй</p>
          </div>
          <div>
            <label className="font-body text-white/50 text-xs mb-1.5 block">Эмодзи</label>
            <input value={emoji} onChange={e => setEmoji(e.target.value)} placeholder="🎮"
              className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none text-center"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }} />
          </div>
        </div>

        <div>
          <label className="font-body text-white/50 text-xs mb-1.5 block">Название товара</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Например: Cool Pack x10"
            className="w-full px-3 py-2.5 rounded-xl font-body text-sm text-white outline-none"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }} />
        </div>

        <div>
          <label className="font-body text-white/50 text-xs mb-1.5 block">Цена в долларах ($)</label>
          <input value={priceUsd} onChange={e => setPriceUsd(e.target.value)} placeholder="1.50"
            type="number" step="0.01" min="0.01"
            className="w-full px-3 py-2.5 rounded-xl font-body text-sm text-white outline-none"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }} />
        </div>

        <div>
          <label className="font-body text-white/50 text-xs mb-1.5 block">Аккаунты (по одному на строку)</label>
          <textarea value={credentials} onChange={e => setCredentials(e.target.value)}
            rows={5} placeholder={"login1:pass1\nlogin2:pass2"}
            className="w-full px-3 py-2 rounded-xl font-mono text-sm text-white outline-none resize-none"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }} />
          <p className="font-body text-white/25 text-xs mt-1">Можно оставить пустым и добавить потом</p>
        </div>

        {msg && <p className="font-body text-sm" style={{ color: msg.startsWith("✅") ? "#00D080" : "#FF6B6B" }}>{msg}</p>}

        <div className="flex gap-3">
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-3 rounded-xl font-body font-bold text-sm text-white disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)" }}>
            {saving ? "Создаём..." : "✅ Создать товар"}
          </button>
          <button onClick={onCreated}
            className="px-5 py-3 rounded-xl font-body text-sm text-white/50 hover:text-white transition-colors"
            style={{ background: "rgba(255,255,255,0.05)" }}>
            Отмена
          </button>
        </div>
      </div>

      <div className="mt-4 p-4 rounded-xl" style={{ background: "rgba(255,184,0,0.07)", border: "1px solid rgba(255,184,0,0.15)" }}>
        <p className="font-body text-yellow-400/70 text-xs leading-relaxed">
          ⚠️ После создания нужно добавить товар в каталог сайта — напиши мне ID и название, я добавлю его на страницу магазина.
        </p>
      </div>
    </div>
  );
}

export default function Admin() {
  const [token, setToken] = useState(() => localStorage.getItem("cambeck_admin_token") || "");
  const [loginVal, setLoginVal] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [tab, setTab] = useState<"chats" | "orders" | "stock">("chats");

  // Chats
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [txHash, setTxHash] = useState("");

  // Stock
  const [stockSummary, setStockSummary] = useState<StockRow[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [itemAccounts, setItemAccounts] = useState<Account[]>([]);
  const [newCredentials, setNewCredentials] = useState("");
  const [addingStock, setAddingStock] = useState(false);
  const [stockMsg, setStockMsg] = useState("");
  const [itemPrices, setItemPrices] = useState<Record<string, number>>({});
  const [editingPrice, setEditingPrice] = useState<string>("");
  const [savingPrice, setSavingPrice] = useState(false);
  const [priceMsg, setPriceMsg] = useState("");

  const isAuthed = !!token;

  useEffect(() => {
    if (!isAuthed) return;
    fetchChats();
    fetchOrders();
    fetchStockSummary();
    fetchPrices();
    const interval = setInterval(() => { fetchChats(); fetchOrders(); }, 5000);
    return () => clearInterval(interval);
  }, [isAuthed]);

  useEffect(() => {
    if (!selectedChat) return;
    fetchMessages(selectedChat.id);
    const interval = setInterval(() => fetchMessages(selectedChat.id), 3000);
    return () => clearInterval(interval);
  }, [selectedChat]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (selectedItemId !== null && selectedItemId > 0) {
      fetchItemAccounts(selectedItemId);
      const currentPrice = itemPrices[String(selectedItemId)];
      const catalogItem = CATALOG_ITEMS.find(i => i.id === selectedItemId);
      if (currentPrice) setEditingPrice(String(currentPrice));
      else if (catalogItem) setEditingPrice("");
      setPriceMsg("");
    }
    if (selectedItemId !== null) fetchItemAccounts(selectedItemId);
  }, [selectedItemId]);

  async function doLogin() {
    setLoginError("");
    const res = await fetch(`${CHAT_URL}?action=login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login: loginVal, password }),
    });
    const data = await res.json();
    if (res.ok && data.token) {
      localStorage.setItem("cambeck_admin_token", data.token);
      setToken(data.token);
    } else {
      setLoginError(data.error || "Ошибка входа");
    }
  }

  async function fetchChats() {
    const res = await fetch(`${CHAT_URL}?action=chats`, { headers: { "X-Admin-Token": token } });
    const data = await res.json();
    if (data.chats) setChats(data.chats);
  }

  async function fetchMessages(chatId: string) {
    const res = await fetch(`${CHAT_URL}?action=messages&chat_id=${chatId}`, { headers: { "X-Admin-Token": token } });
    const data = await res.json();
    if (data.messages) setMessages(data.messages);
  }

  async function sendReply() {
    if (!replyText.trim() || !selectedChat || sending) return;
    setSending(true);
    await fetch(`${CHAT_URL}?action=message`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Admin-Token": token },
      body: JSON.stringify({ text: replyText.trim(), chat_id: selectedChat.id }),
    });
    setReplyText("");
    await fetchMessages(selectedChat.id);
    setSending(false);
  }

  async function closeChat(chatId: string) {
    await fetch(`${CHAT_URL}?action=close`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Admin-Token": token },
      body: JSON.stringify({ chat_id: chatId }),
    });
    fetchChats();
    if (selectedChat?.id === chatId) setSelectedChat(null);
  }

  async function fetchOrders() {
    const res = await fetch(`${ORDERS_URL}?action=list`, { headers: { "X-Admin-Token": token } });
    const data = await res.json();
    if (data.orders) setOrders(data.orders);
  }

  async function confirmOrder(orderId: string) {
    const res = await fetch(`${ORDERS_URL}?action=confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Admin-Token": token },
      body: JSON.stringify({ order_id: orderId, tx_hash: txHash }),
    });
    const data = await res.json();
    if (data.success) { setConfirmingId(null); setTxHash(""); fetchOrders(); }
  }

  async function fetchStockSummary() {
    const res = await fetch(`${ORDERS_URL}?action=stock`, { headers: { "X-Admin-Token": token } });
    const data = await res.json();
    if (data.stock) setStockSummary(data.stock);
  }

  async function fetchPrices() {
    const res = await fetch(`${ORDERS_URL}?action=prices`);
    const data = await res.json();
    if (data.prices) setItemPrices(data.prices);
  }

  async function savePrice(itemId: number) {
    if (!editingPrice.trim()) return;
    setSavingPrice(true);
    setPriceMsg("");
    const res = await fetch(`${ORDERS_URL}?action=set_price`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Admin-Token": token },
      body: JSON.stringify({ item_id: itemId, price_usd: parseFloat(editingPrice) }),
    });
    const data = await res.json();
    setSavingPrice(false);
    if (data.success) {
      setPriceMsg("✅ Цена сохранена");
      fetchPrices();
      setTimeout(() => setPriceMsg(""), 2000);
    } else {
      setPriceMsg("❌ Ошибка сохранения");
    }
  }

  async function fetchItemAccounts(itemId: number) {
    const res = await fetch(`${ORDERS_URL}?action=stock&item_id=${itemId}`, { headers: { "X-Admin-Token": token } });
    const data = await res.json();
    if (data.accounts) setItemAccounts(data.accounts);
  }

  async function addStock() {
    if (!newCredentials.trim() || selectedItemId === null) return;
    setAddingStock(true);
    setStockMsg("");
    const lines = newCredentials.trim().split("\n").filter(l => l.trim());
    const res = await fetch(`${ORDERS_URL}?action=add_stock`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Admin-Token": token },
      body: JSON.stringify({ item_id: selectedItemId, credentials: lines }),
    });
    const data = await res.json();
    if (data.added) {
      setStockMsg(`✅ Добавлено ${data.added} аккаунтов`);
      setNewCredentials("");
      fetchItemAccounts(selectedItemId);
      fetchStockSummary();
    } else {
      setStockMsg("❌ Ошибка при добавлении");
    }
    setAddingStock(false);
  }

  async function deleteAccount(accountId: string) {
    await fetch(`${ORDERS_URL}?action=delete_stock`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Admin-Token": token },
      body: JSON.stringify({ account_id: accountId }),
    });
    if (selectedItemId !== null) fetchItemAccounts(selectedItemId);
    fetchStockSummary();
  }

  function logout() {
    localStorage.removeItem("cambeck_admin_token");
    setToken("");
    setChats([]);
    setSelectedChat(null);
  }

  function timeAgo(dateStr: string) {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return "только что";
    if (diff < 3600) return Math.floor(diff / 60) + " мин назад";
    if (diff < 86400) return Math.floor(diff / 3600) + " ч назад";
    return Math.floor(diff / 86400) + " д назад";
  }

  const getStockForItem = (id: number) => stockSummary.find(s => s.item_id === id);

  /* ---- LOGIN ---- */
  if (!isAuthed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0F1923" }}>
        <div className="w-full max-w-sm rounded-2xl p-8 animate-bounce-in"
          style={{ background: "#161F2C", border: "1px solid rgba(0,102,255,0.2)" }}>
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl font-display font-bold text-white"
              style={{ background: "linear-gradient(135deg, #0066FF, #E8343A)" }}>C</div>
            <h1 className="font-display font-bold text-white text-2xl">CambeckSHOP</h1>
            <p className="font-body text-white/40 text-sm mt-1">Панель администратора</p>
          </div>
          {loginError && (
            <div className="mb-4 px-4 py-2 rounded-xl text-sm font-body text-red-400 text-center"
              style={{ background: "rgba(232,52,58,0.1)", border: "1px solid rgba(232,52,58,0.2)" }}>
              {loginError}
            </div>
          )}
          <div className="flex flex-col gap-3">
            <input className="w-full px-4 py-3 rounded-xl font-body text-sm text-white outline-none"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
              placeholder="Логин" value={loginVal} onChange={e => setLoginVal(e.target.value)}
              onKeyDown={e => e.key === "Enter" && doLogin()} />
            <input type="password" className="w-full px-4 py-3 rounded-xl font-body text-sm text-white outline-none"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
              placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && doLogin()} />
            <button onClick={doLogin}
              className="btn-shimmer w-full py-3 rounded-xl font-body font-bold text-sm text-white"
              style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)" }}>
              Войти
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---- ADMIN PANEL ---- */
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0F1923" }}>
      {/* Navbar */}
      <nav className="h-14 flex items-center justify-between px-4 border-b border-white/5 flex-shrink-0"
        style={{ background: "#161F2C" }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-display font-bold text-white"
            style={{ background: "linear-gradient(135deg, #0066FF, #E8343A)" }}>C</div>
          <span className="font-display font-bold text-white hidden sm:block">Cambeck<span style={{ color: "#FFB800" }}>SHOP</span></span>
        </div>
        <div className="flex items-center gap-1">
          {[
            { id: "chats", label: "💬 Чаты", count: chats.filter(c => c.status === "open").length },
            { id: "orders", label: "📦 Заказы", count: orders.filter(o => o.status === "pending").length },
            { id: "stock", label: "🗄️ Склад", count: null },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as "chats" | "orders" | "stock")}
              className="px-3 py-1.5 rounded-lg font-body text-xs transition-all"
              style={{ background: tab === t.id ? "rgba(0,102,255,0.2)" : "transparent", color: tab === t.id ? "#4DA6FF" : "rgba(255,255,255,0.4)" }}>
              {t.label}{t.count !== null && t.count > 0 ? ` (${t.count})` : ""}
            </button>
          ))}
          <button onClick={logout}
            className="ml-1 flex items-center gap-1 px-2 py-1.5 rounded-lg text-white/40 hover:text-white transition-all hover:bg-white/5">
            <Icon name="LogOut" size={14} />
          </button>
        </div>
      </nav>

      {/* ORDERS TAB */}
      {tab === "orders" && (
        <div className="flex-1 overflow-y-auto p-5">
          <h2 className="font-display font-bold text-white text-lg mb-4">Заказы</h2>
          {orders.length === 0 && <p className="text-white/30 font-body text-sm">Заказов пока нет</p>}
          <div className="flex flex-col gap-3 max-w-2xl">
            {orders.map(o => (
              <div key={o.order_id} className="rounded-xl p-4"
                style={{ background: "#161F2C", border: `1px solid ${o.status === "paid" ? "rgba(0,176,111,0.25)" : "rgba(255,255,255,0.07)"}` }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-body font-bold text-white text-sm">{o.item_name} × {o.quantity}</p>
                    <p className="font-display font-bold text-base mt-0.5" style={{ color: "#4DA6FF" }}>${o.amount_usd.toFixed(2)}</p>
                    <p className="font-body text-white/30 text-xs mt-1">{o.network} • {new Date(o.created_at).toLocaleString("ru")}</p>
                    <p className="font-mono text-xs text-white/20 mt-0.5">#{o.order_id.slice(0,8).toUpperCase()}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="px-2 py-1 rounded-md font-body font-bold text-xs"
                      style={{ background: o.status === "paid" ? "rgba(0,176,111,0.15)" : "rgba(255,184,0,0.12)", color: o.status === "paid" ? "#00D080" : "#FFB800" }}>
                      {o.status === "paid" ? "✅ Оплачен" : "⏳ Ожидает"}
                    </span>
                    {o.status === "pending" && (
                      confirmingId === o.order_id ? (
                        <div className="flex flex-col gap-1">
                          <input className="px-2 py-1 rounded-lg font-mono text-xs text-white outline-none w-44"
                            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
                            placeholder="TX hash (необяз.)" value={txHash} onChange={e => setTxHash(e.target.value)} />
                          <div className="flex gap-1">
                            <button onClick={() => confirmOrder(o.order_id)}
                              className="flex-1 py-1 rounded-lg font-body font-bold text-xs text-white"
                              style={{ background: "linear-gradient(135deg, #00B06F, #007A4D)" }}>Подтвердить</button>
                            <button onClick={() => setConfirmingId(null)}
                              className="px-2 py-1 rounded-lg font-body text-xs text-white/40"
                              style={{ background: "rgba(255,255,255,0.05)" }}>✕</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmingId(o.order_id)}
                          className="px-3 py-1.5 rounded-lg font-body font-bold text-xs text-white"
                          style={{ background: "linear-gradient(135deg, #00B06F, #007A4D)" }}>
                          ✅ Подтвердить
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STOCK TAB */}
      {tab === "stock" && (
        <div className="flex-1 overflow-hidden flex">
          {/* Список товаров */}
          <div className="w-64 flex-shrink-0 border-r border-white/5 flex flex-col overflow-hidden"
            style={{ background: "#131C27" }}>
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <p className="font-body text-white/40 text-xs uppercase tracking-wider">Товары</p>
              <button
                onClick={() => setSelectedItemId(-1)}
                className="text-xs font-body font-bold px-2 py-1 rounded-lg transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)", color: "white" }}>
                + Новый
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {CATALOG_ITEMS.map(item => {
                const s = getStockForItem(item.id);
                const available = s?.available ?? 0;
                return (
                  <button key={item.id} onClick={() => setSelectedItemId(item.id)}
                    className="w-full text-left px-4 py-3 border-b border-white/5 transition-all hover:bg-white/5"
                    style={selectedItemId === item.id ? { background: "rgba(0,102,255,0.1)" } : {}}>
                    <div className="font-body text-sm text-white truncate">{item.name}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full inline-block"
                        style={{ background: available > 0 ? "#00D080" : "#FF6B6B" }} />
                      <span className="font-body text-xs" style={{ color: available > 0 ? "#00D080" : "#FF6B6B" }}>
                        {available > 0 ? `${available} шт.` : "Нет в наличии"}
                      </span>
                    </div>
                  </button>
                );
              })}
              {/* Кастомные товары из стока */}
              {stockSummary.filter(s => !CATALOG_ITEMS.find(i => i.id === s.item_id)).map(s => (
                <button key={s.item_id} onClick={() => setSelectedItemId(s.item_id)}
                  className="w-full text-left px-4 py-3 border-b border-white/5 transition-all hover:bg-white/5"
                  style={selectedItemId === s.item_id ? { background: "rgba(0,102,255,0.1)" } : {}}>
                  <div className="font-body text-sm text-white truncate">Товар #{s.item_id}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full inline-block"
                      style={{ background: s.available > 0 ? "#00D080" : "#FF6B6B" }} />
                    <span className="font-body text-xs" style={{ color: s.available > 0 ? "#00D080" : "#FF6B6B" }}>
                      {s.available > 0 ? `${s.available} шт.` : "Нет в наличии"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Управление аккаунтами */}
          <div className="flex-1 overflow-y-auto p-5">
            {selectedItemId === null ? (
              <div className="flex items-center justify-center h-full text-white/20 flex-col gap-2">
                <Icon name="Package" size={40} />
                <p className="font-body">Выберите товар слева или создай новый</p>
              </div>
            ) : selectedItemId === -1 ? (
              /* Форма нового товара */
              <NewItemForm token={token} onCreated={() => { fetchStockSummary(); setSelectedItemId(null); }} />
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="font-display font-bold text-white text-lg">
                      {CATALOG_ITEMS.find(i => i.id === selectedItemId)?.name ?? `Товар #${selectedItemId}`}
                    </h2>
                    <p className="font-body text-white/40 text-xs mt-0.5">
                      Доступно: {getStockForItem(selectedItemId)?.available ?? 0} / {getStockForItem(selectedItemId)?.total ?? 0}
                    </p>
                  </div>
                </div>

                {/* Изменить цену */}
                <div className="rounded-2xl p-4 mb-4"
                  style={{ background: "#161F2C", border: "1px solid rgba(255,184,0,0.2)" }}>
                  <p className="font-body text-white/60 text-xs mb-3 font-bold uppercase tracking-wider">💰 Цена товара</p>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-white/40 text-sm">$</span>
                      <input
                        type="number" step="0.01" min="0.01"
                        value={editingPrice}
                        onChange={e => setEditingPrice(e.target.value)}
                        placeholder={String(CATALOG_ITEMS.find(i => i.id === selectedItemId)?.name ? "0.00" : "0.00")}
                        className="w-full pl-7 pr-3 py-2.5 rounded-xl font-body text-sm text-white outline-none"
                        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,184,0,0.3)" }}
                      />
                    </div>
                    <button
                      onClick={() => savePrice(selectedItemId!)}
                      disabled={savingPrice || !editingPrice.trim()}
                      className="px-5 py-2.5 rounded-xl font-body font-bold text-sm text-white disabled:opacity-40 whitespace-nowrap"
                      style={{ background: "linear-gradient(135deg, #FFB800, #FF6B00)", color: "#0F1923" }}>
                      {savingPrice ? "..." : "Сохранить"}
                    </button>
                  </div>
                  {priceMsg && <p className="font-body text-xs mt-2" style={{ color: priceMsg.startsWith("✅") ? "#00D080" : "#FF6B6B" }}>{priceMsg}</p>}
                  {itemPrices[String(selectedItemId)] && (
                    <p className="font-body text-white/30 text-xs mt-1">
                      Текущая цена в БД: <b className="text-yellow-400">${itemPrices[String(selectedItemId)]}</b>
                    </p>
                  )}
                </div>

                {/* Добавить аккаунты */}
                <div className="rounded-2xl p-4 mb-5"
                  style={{ background: "#161F2C", border: "1px solid rgba(0,102,255,0.2)" }}>
                  <p className="font-body text-white/60 text-xs mb-2 font-bold uppercase tracking-wider">➕ Добавить аккаунты</p>
                  <p className="font-body text-white/30 text-xs mb-3">Вставь аккаунты — по одному на строку в формате <code className="text-blue-400">логин:пароль</code></p>
                  <textarea
                    value={newCredentials}
                    onChange={e => setNewCredentials(e.target.value)}
                    rows={5}
                    placeholder={"login1:pass1\nlogin2:pass2\nlogin3:pass3"}
                    className="w-full px-3 py-2 rounded-xl font-mono text-sm text-white outline-none resize-none mb-3"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                  />
                  {stockMsg && <p className="font-body text-sm mb-2" style={{ color: stockMsg.startsWith("✅") ? "#00D080" : "#FF6B6B" }}>{stockMsg}</p>}
                  <button onClick={addStock} disabled={addingStock || !newCredentials.trim()}
                    className="px-5 py-2.5 rounded-xl font-body font-bold text-sm text-white disabled:opacity-40 transition-all hover:scale-105"
                    style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)" }}>
                    {addingStock ? "Добавляем..." : `Добавить ${newCredentials.trim().split("\n").filter(l => l.trim()).length || ""} аккаунт(ов)`}
                  </button>
                </div>

                {/* Список аккаунтов */}
                <div>
                  <p className="font-body text-white/40 text-xs uppercase tracking-wider mb-3">Текущий сток</p>
                  {itemAccounts.length === 0 && (
                    <p className="font-body text-white/20 text-sm">Аккаунтов нет</p>
                  )}
                  <div className="flex flex-col gap-2">
                    {itemAccounts.map(acc => (
                      <div key={acc.id} className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
                        style={{
                          background: acc.is_sold ? "rgba(255,255,255,0.03)" : "rgba(22,31,44,0.9)",
                          border: `1px solid ${acc.is_sold ? "rgba(255,255,255,0.04)" : "rgba(0,176,111,0.15)"}`,
                          opacity: acc.is_sold ? 0.5 : 1,
                        }}>
                        <span className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: acc.is_sold ? "#FF6B6B" : "#00D080" }} />
                        <code className="font-mono text-xs text-white/70 flex-1 truncate">{acc.credentials}</code>
                        <span className="font-body text-xs text-white/30 flex-shrink-0">
                          {acc.is_sold ? "Продан" : "Доступен"}
                        </span>
                        {!acc.is_sold && (
                          <button onClick={() => deleteAccount(acc.id)}
                            className="flex-shrink-0 text-white/20 hover:text-red-400 transition-colors">
                            <Icon name="Trash2" size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* CHATS TAB */}
      {tab === "chats" && (
        <div className="flex flex-1 overflow-hidden">
          {/* Список чатов */}
          <div className="w-64 flex-shrink-0 border-r border-white/5 flex flex-col overflow-hidden"
            style={{ background: "#131C27" }}>
            <div className="px-4 py-3 border-b border-white/5">
              <p className="font-body text-white/40 text-xs uppercase tracking-wider">Обращения</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {chats.length === 0 && (
                <div className="text-center text-white/20 text-sm mt-12 px-4">Пока нет обращений</div>
              )}
              {chats.map(chat => (
                <button key={chat.id} onClick={() => { setSelectedChat(chat); fetchMessages(chat.id); }}
                  className="w-full text-left px-4 py-3 border-b border-white/5 transition-all hover:bg-white/5"
                  style={selectedChat?.id === chat.id ? { background: "rgba(0,102,255,0.1)" } : {}}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-body font-bold text-sm text-white truncate">{chat.visitor_name}</span>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ml-2 ${chat.status === "open" ? "bg-green-400" : "bg-white/20"}`} />
                  </div>
                  <p className="font-body text-xs text-white/40 truncate">{chat.last_message || "Нет сообщений"}</p>
                  <p className="font-body text-xs text-white/20 mt-1">{timeAgo(chat.updated_at)}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Переписка */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {!selectedChat ? (
              <div className="flex flex-col items-center justify-center flex-1 text-white/20">
                <Icon name="MessageCircle" size={48} />
                <p className="font-body mt-3">Выберите чат слева</p>
              </div>
            ) : (
              <>
                <div className="h-14 flex items-center justify-between px-5 border-b border-white/5 flex-shrink-0"
                  style={{ background: "#161F2C" }}>
                  <div>
                    <span className="font-body font-bold text-white">{selectedChat.visitor_name}</span>
                    <span className={`ml-2 text-xs font-body ${selectedChat.status === "open" ? "text-green-400" : "text-white/30"}`}>
                      {selectedChat.status === "open" ? "• открыт" : "• закрыт"}
                    </span>
                  </div>
                  {selectedChat.status === "open" && (
                    <button onClick={() => closeChat(selectedChat.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-body text-xs text-white/50 hover:text-red-400 transition-all hover:bg-red-400/10">
                      <Icon name="X" size={13} />
                      Закрыть
                    </button>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2">
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender === "admin" ? "justify-end" : "justify-start"}`}>
                      <div className="max-w-[65%] px-4 py-2.5 font-body text-sm leading-relaxed"
                        style={{
                          background: msg.sender === "admin" ? "linear-gradient(135deg, #0066FF, #0044BB)" : "rgba(255,255,255,0.08)",
                          color: "white",
                          borderRadius: msg.sender === "admin" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                        }}>
                        {msg.text}
                        <div className="text-xs mt-1 opacity-40">
                          {new Date(msg.created_at).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
                {selectedChat.status === "open" && (
                  <div className="px-5 py-4 border-t border-white/5 flex gap-3 flex-shrink-0"
                    style={{ background: "#161F2C" }}>
                    <input className="flex-1 px-4 py-2.5 rounded-xl font-body text-sm text-white outline-none"
                      style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
                      placeholder="Ответить..." value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && sendReply()} />
                    <button onClick={sendReply} disabled={sending || !replyText.trim()}
                      className="px-5 py-2.5 rounded-xl font-body font-bold text-sm text-white transition-all hover:scale-105 disabled:opacity-40"
                      style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)" }}>
                      <Icon name="Send" size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}