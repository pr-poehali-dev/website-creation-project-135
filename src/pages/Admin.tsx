import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";

const CHAT_URL = "https://functions.poehali.dev/5dc1e3a3-dd70-49b6-a971-dd798391a238";
const SELLER_CHAT_URL = "https://functions.poehali.dev/6f29f896-2b7e-4b27-ad18-6f4da48ef96a";
const ORDERS_URL = "https://functions.poehali.dev/f852d147-eae1-4265-a94d-63d014c42231";
const SBP_URL = "https://functions.poehali.dev/42feca66-55a3-499c-b7b5-ea34fc0494ec";
const ONLINE_URL = "https://functions.poehali.dev/2edf71d1-04dc-4be0-8481-958f413aed14";

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

type Chat = { id: string; visitor_name: string; visitor_id: string; status: string; last_message: string; msg_count: number; updated_at: string; chat_type?: string; order_id?: string | null; };
type Message = { id: string; sender: string; text: string; created_at: string };
type Order = { order_id: string; item_name: string; amount_usd: number; quantity: number; network: string; status: string; created_at: string; };
type StockRow = { item_id: number; available: number; total: number };
type Account = { id: string; credentials: string; is_sold: boolean; sold_at: string | null; created_at: string };
type CatalogItemAdmin = { id: number; name: string; price_usd: number; stock: number; emoji: string; game: string; sort_order: number; category?: string; image?: string | null; available: boolean };




function NewItemForm({ token, onCreated, gamesList, usdRate, gameCategories }: { token: string; onCreated: () => void; gamesList: { id: string; name: string }[]; usdRate: number; gameCategories: Record<string, { id: string; label: string }[]> }) {
  const [name, setName] = useState("");
  const [priceRub, setPriceRub] = useState("");
  const [emoji, setEmoji] = useState("🎮");
  const [game, setGame] = useState(() => gamesList[0]?.id || "steal-a-brainrot");
  const [category, setCategory] = useState("");
  const [credentials, setCredentials] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const accountLines = credentials.trim() ? credentials.trim().split("\n").filter(l => l.trim()).length : 0;
  const priceUsdPreview = priceRub && usdRate ? (parseFloat(priceRub) / usdRate).toFixed(2) : null;

  async function handleSave() {
    if (!name.trim() || !priceRub.trim()) {
      setMsg("❌ Заполни название и цену");
      return;
    }
    setSaving(true);
    setMsg("");

    const priceUsd = parseFloat(priceRub) / usdRate;
    const catalogRes = await fetch(`${ORDERS_URL}?action=catalog_create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Admin-Token": token },
      body: JSON.stringify({ name: name.trim(), price_usd: parseFloat(priceUsd.toFixed(2)), emoji, game, sort_order: 0, category: category || null }),
    });
    const catalogData = await catalogRes.json();
    if (catalogData.error) { setMsg("❌ " + catalogData.error); setSaving(false); return; }

    const newId = catalogData.id;
    const lines = credentials.trim().split("\n").filter(l => l.trim());
    if (lines.length > 0 && newId) {
      const res = await fetch(`${ORDERS_URL}?action=add_stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Token": token },
        body: JSON.stringify({ item_id: newId, credentials: lines }),
      });
      const data = await res.json();
      if (data.error) { setMsg("❌ " + data.error); setSaving(false); return; }
    }
    setMsg(`✅ Товар создан${lines.length > 0 ? ` · ${lines.length} лотов загружено` : " · лоты можно добавить позже"}`);
    setSaving(false);
    setTimeout(() => onCreated(), 1400);
  }

  return (
    <div className="max-w-lg">
      <h2 className="font-display font-bold text-white text-lg mb-5">➕ Новый товар</h2>
      <div className="rounded-2xl p-5 flex flex-col gap-4"
        style={{ background: "#161F2C", border: "1px solid rgba(0,102,255,0.2)" }}>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="font-body text-white/50 text-xs mb-1.5 block">Название товара</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Например: Cool Pack x10"
              className="w-full px-3 py-2.5 rounded-xl font-body text-sm text-white outline-none"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }} />
          </div>
          <div>
            <label className="font-body text-white/50 text-xs mb-1.5 block">Эмодзи</label>
            <input value={emoji} onChange={e => setEmoji(e.target.value)} placeholder="🎮"
              className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none text-center"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-body text-white/50 text-xs mb-1.5 block">Цена (₽)</label>
            <div className="relative">
              <input value={priceRub} onChange={e => setPriceRub(e.target.value)} placeholder="150"
                type="number" step="1" min="1"
                className="w-full px-3 py-2.5 rounded-xl font-body text-sm text-white outline-none"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }} />
              {priceUsdPreview && (
                <div className="mt-1 font-body text-white/30 text-xs">≈ ${priceUsdPreview}</div>
              )}
            </div>
          </div>
          <div>
            <label className="font-body text-white/50 text-xs mb-1.5 block">Игра</label>
            <select value={game} onChange={e => { setGame(e.target.value); setCategory(""); }}
              className="w-full px-3 py-2.5 rounded-xl font-body text-sm text-white outline-none"
              style={{ background: "#1e2a3a", border: "1px solid rgba(255,255,255,0.1)" }}>
              {gamesList.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
        </div>

        {/* Категория — теги из игры */}
        {(gameCategories[game] || []).length > 0 && (
          <div>
            <label className="font-body text-white/50 text-xs mb-2 block">Категория</label>
            <div className="flex flex-wrap gap-2">
              {(gameCategories[game] || []).map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(category === cat.id ? "" : cat.id)}
                  className="px-3 py-1.5 rounded-xl font-body text-xs font-bold transition-all hover:scale-105"
                  style={
                    category === cat.id
                      ? { background: "linear-gradient(135deg, #0066FF, #0044BB)", color: "#fff", border: "1px solid #0066FF" }
                      : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }
                  }
                >
                  {cat.label}
                </button>
              ))}
            </div>
            {category && (
              <button onClick={() => setCategory("")} className="mt-1.5 font-body text-white/25 text-xs hover:text-white/50 transition-colors">
                ✕ Снять выбор
              </button>
            )}
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="font-body text-white/50 text-xs">Лоты (по одному на строку)</label>
            {accountLines > 0 && (
              <span className="font-body text-xs px-2 py-0.5 rounded-full"
                style={{ background: "rgba(0,208,128,0.15)", color: "#00D080", border: "1px solid rgba(0,208,128,0.25)" }}>
                {accountLines} лот{accountLines === 1 ? "" : accountLines < 5 ? "а" : "ов"}
              </span>
            )}
          </div>
          <textarea value={credentials} onChange={e => setCredentials(e.target.value)}
            rows={6} placeholder={"login1:pass1\nlogin2:pass2\n..."}
            className="w-full px-3 py-2 rounded-xl font-mono text-sm text-white outline-none resize-none"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }} />
          <p className="font-body text-white/25 text-xs mt-1">Можно оставить пустым — добавишь лоты позже</p>
        </div>

        {msg && (
          <div className="px-4 py-3 rounded-xl font-body text-sm"
            style={{
              background: msg.startsWith("✅") ? "rgba(0,208,128,0.1)" : "rgba(255,107,107,0.1)",
              border: `1px solid ${msg.startsWith("✅") ? "rgba(0,208,128,0.25)" : "rgba(255,107,107,0.25)"}`,
              color: msg.startsWith("✅") ? "#00D080" : "#FF6B6B"
            }}>
            {msg}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-3 rounded-xl font-body font-bold text-sm text-white disabled:opacity-40 transition-opacity"
            style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)" }}>
            {saving ? "Создаём..." : `✅ Создать${accountLines > 0 ? ` · ${accountLines} лот${accountLines === 1 ? "" : accountLines < 5 ? "а" : "ов"}` : ""}`}
          </button>
          <button onClick={onCreated}
            className="px-5 py-3 rounded-xl font-body text-sm text-white/50 hover:text-white transition-colors"
            style={{ background: "rgba(255,255,255,0.05)" }}>
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const [token, setToken] = useState(() => localStorage.getItem("cambeck_admin_token") || "");
  const [loginVal, setLoginVal] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [tab, setTab] = useState<"chats" | "orders" | "stock" | "catalog">(() => (localStorage.getItem("admin_tab") as "chats" | "orders" | "stock" | "catalog") || "chats");
  const [onlineCount, setOnlineCount] = useState<number | null>(null);
  const [totalVisits, setTotalVisits] = useState<number | null>(null);
  const [firstSeen, setFirstSeen] = useState<string | null>(null);
  const [registeredCount, setRegisteredCount] = useState<number | null>(null);
  const [catalogSubTab, setCatalogSubTab] = useState<"items" | "games">(() => (localStorage.getItem("admin_catalog_subtab") as "items" | "games") || "items");

  // Catalog items
  const [catalogItems, setCatalogItems] = useState<CatalogItemAdmin[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItemAdmin | null>(null);
  const [newItem, setNewItem] = useState<Partial<CatalogItemAdmin>>({ name: "", price_usd: 0, emoji: "📦", game: "steal-a-brainrot", sort_order: 0, image: null });
  const [showNewItemForm, setShowNewItemForm] = useState(false);
  const [catalogMsg, setCatalogMsg] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  // Catalog games
  type GameCategory = { id: string; label: string };
  type GameAdmin = { id: string; name: string; image: string; description: string; badge: string | null; sort_order: number; categories: GameCategory[] };
  const [games, setGames] = useState<GameAdmin[]>([]);
  const [editingGame, setEditingGame] = useState<GameAdmin | null>(null);
  const [showNewGameForm, setShowNewGameForm] = useState(false);
  const [newGame, setNewGame] = useState<Partial<GameAdmin>>({ id: "", name: "", image: "", description: "", badge: "", sort_order: 0, categories: [] });
  const [gamesMsg, setGamesMsg] = useState("");

  // Chats (поддержка)
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [chatSubTab, setChatSubTab] = useState<"support" | "order" | "seller">("support");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Seller chats (покупатель ↔ продавец)
  type SellerChat = { id: string; order_id: string; user_id: string; username: string; status: string; created_at: string; updated_at: string; last_message: string | null; unread: number };
  type SellerMessage = { id: string; sender: "buyer" | "seller"; text: string; created_at: string; is_read: boolean };
  const [sellerChats, setSellerChats] = useState<SellerChat[]>([]);
  const [selectedSellerChat, setSelectedSellerChat] = useState<SellerChat | null>(null);
  const [sellerMessages, setSellerMessages] = useState<SellerMessage[]>([]);
  const [sellerReplyText, setSellerReplyText] = useState("");
  const [sellerSending, setSellerSending] = useState(false);
  const sellerBottomRef = useRef<HTMLDivElement>(null);

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

  const [usdRate, setUsdRate] = useState(81.9103);
  const [catalogGameFilter, setCatalogGameFilter] = useState<string | null>(null);
  const [inlineStockItemId, setInlineStockItemId] = useState<number | null>(null);
  const [inlineStockText, setInlineStockText] = useState("");
  const [inlineStockSaving, setInlineStockSaving] = useState(false);
  const [inlineStockMsg, setInlineStockMsg] = useState("");

  const isAuthed = !!token;

  // Динамические категории из данных игр
  const gameCategories: Record<string, { id: string; label: string }[]> = {};
  games.forEach(g => { if (g.categories?.length) gameCategories[g.id] = g.categories; });

  async function fetchUsdRate() {
    try {
      const res = await fetch(`${ORDERS_URL}?action=usd_rate`);
      const data = await res.json();
      if (data.rate) setUsdRate(data.rate);
    } catch (_) { /* ignore */ }
  }

  async function fetchOnlineCount() {
    const res = await fetch(`${ONLINE_URL}?action=count`);
    const data = await res.json();
    if (typeof data.count === "number") setOnlineCount(data.count);
  }

  async function fetchTotalVisits() {
    const res = await fetch(`${ONLINE_URL}?action=total`);
    const data = await res.json();
    if (typeof data.total === "number") setTotalVisits(data.total);
    if (data.first_seen) setFirstSeen(data.first_seen);
    if (typeof data.registered === "number") setRegisteredCount(data.registered);
  }

  useEffect(() => {
    if (!isAuthed) return;
    fetchChats();
    fetchSellerChats();
    fetchOrders();
    fetchStockSummary();
    fetchPrices();
    fetchCatalog();
    fetchGames();
    fetchOnlineCount();
    fetchTotalVisits();
    fetchUsdRate();
    const interval = setInterval(() => { fetchChats(); fetchSellerChats(); fetchOrders(); fetchOnlineCount(); }, 15000);
    return () => clearInterval(interval);
  }, [isAuthed]);

  useEffect(() => {
    if (!selectedChat) return;
    fetchMessages(selectedChat.id);
    const interval = setInterval(() => fetchMessages(selectedChat.id), 5000);
    return () => clearInterval(interval);
  }, [selectedChat]);

  useEffect(() => {
    if (!selectedSellerChat) return;
    fetchSellerMessages(selectedSellerChat.id);
    const interval = setInterval(() => fetchSellerMessages(selectedSellerChat.id), 5000);
    return () => clearInterval(interval);
  }, [selectedSellerChat]);

  useEffect(() => {
    sellerBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sellerMessages]);

  useEffect(() => {
    if (!isAuthed) return;
    setSelectedChat(null);
    setSelectedSellerChat(null);
    if (chatSubTab === "seller") fetchSellerChats();
    else fetchChats(chatSubTab);
  }, [chatSubTab]);

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

  async function fetchChats(chatType?: string) {
    const type = chatType || chatSubTab;
    if (type === "seller") { fetchSellerChats(); return; }
    const res = await fetch(`${CHAT_URL}?action=chats&chat_type=${type}`, { headers: { "X-Admin-Token": token } });
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

  async function fetchSellerChats() {
    const res = await fetch(`${SELLER_CHAT_URL}?action=chats`, { headers: { "X-Admin-Token": token } });
    const data = await res.json();
    if (data.chats) setSellerChats(data.chats);
  }

  async function fetchSellerMessages(chatId: string) {
    const res = await fetch(`${SELLER_CHAT_URL}?action=messages&chat_id=${chatId}`, { headers: { "X-Admin-Token": token } });
    const data = await res.json();
    if (data.messages) {
      setSellerMessages(data.messages);
      // обновляем счётчик непрочитанных
      setSellerChats(prev => prev.map(c => c.id === chatId ? { ...c, unread: 0 } : c));
    }
  }

  async function sendSellerReply() {
    if (!sellerReplyText.trim() || !selectedSellerChat || sellerSending) return;
    setSellerSending(true);
    const text = sellerReplyText.trim();
    setSellerReplyText("");
    // оптимистичное добавление
    setSellerMessages(prev => [...prev, { id: "tmp_" + Date.now(), sender: "seller", text, created_at: new Date().toISOString(), is_read: false }]);
    await fetch(`${SELLER_CHAT_URL}?action=send`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Admin-Token": token },
      body: JSON.stringify({ chat_id: selectedSellerChat.id, text }),
    });
    await fetchSellerMessages(selectedSellerChat.id);
    setSellerSending(false);
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

  async function confirmSbp(orderId: string) {
    const res = await fetch(`${SBP_URL}?action=confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Admin-Token": token },
      body: JSON.stringify({ order_id: orderId }),
    });
    const data = await res.json();
    if (data.success) { setConfirmingId(null); fetchOrders(); }
  }

  async function rejectSbp(orderId: string) {
    await fetch(`${SBP_URL}?action=reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Admin-Token": token },
      body: JSON.stringify({ order_id: orderId }),
    });
    fetchOrders();
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
    try {
      const res = await fetch(`${ORDERS_URL}?action=set_price`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Token": token },
        body: JSON.stringify({ item_id: itemId, price_usd: parseFloat(editingPrice) }),
      });
      const data = await res.json();
      if (data.success) {
        setPriceMsg("✅ Цена сохранена");
        fetchPrices();
        setTimeout(() => setPriceMsg(""), 2000);
      } else {
        setPriceMsg("❌ " + (data.error || "Ошибка сохранения"));
      }
    } catch {
      setPriceMsg("❌ Ошибка соединения");
    } finally {
      setSavingPrice(false);
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
    try {
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
        setStockMsg("❌ " + (data.error || "Ошибка при добавлении"));
      }
    } catch (e) {
      setStockMsg("❌ Ошибка соединения");
    } finally {
      setAddingStock(false);
    }
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

  async function fetchGames() {
    const res = await fetch(`${ORDERS_URL}?action=games`);
    const data = await res.json();
    if (data.games) setGames(data.games);
  }

  async function createGame() {
    if (!newGame.id?.trim() || !newGame.name?.trim()) { setGamesMsg("❌ Заполни ID и название"); return; }
    const res = await fetch(`${ORDERS_URL}?action=game_create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Admin-Token": token },
      body: JSON.stringify(newGame),
    });
    const data = await res.json();
    if (data.success) {
      setGamesMsg("✅ Игра добавлена");
      setShowNewGameForm(false);
      setNewGame({ id: "", name: "", image: "", description: "", badge: "", sort_order: 0 });
      fetchGames();
      setTimeout(() => setGamesMsg(""), 2000);
    } else setGamesMsg("❌ " + (data.error || "Ошибка"));
  }

  async function updateGame(g: GameAdmin) {
    const res = await fetch(`${ORDERS_URL}?action=game_update`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Admin-Token": token },
      body: JSON.stringify(g),
    });
    const data = await res.json();
    if (data.success) {
      setGamesMsg("✅ Сохранено");
      setEditingGame(null);
      fetchGames();
      setTimeout(() => setGamesMsg(""), 2000);
    } else setGamesMsg("❌ " + (data.error || "Ошибка"));
  }

  async function deleteGame(id: string) {
    if (!confirm("Удалить игру? Товары останутся в БД.")) return;
    const res = await fetch(`${ORDERS_URL}?action=game_delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Admin-Token": token },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (data.success) { fetchGames(); setGamesMsg("✅ Удалено"); setTimeout(() => setGamesMsg(""), 2000); }
  }

  async function fetchCatalog() {
    setCatalogLoading(true);
    const res = await fetch(`${ORDERS_URL}?action=catalog`);
    const data = await res.json();
    if (data.items) setCatalogItems(data.items);
    setCatalogLoading(false);
  }

  async function createCatalogItem() {
    if (!newItem.name?.trim()) { setCatalogMsg("❌ Введи название"); return; }
    const res = await fetch(`${ORDERS_URL}?action=catalog_create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Admin-Token": token },
      body: JSON.stringify(newItem),
    });
    const data = await res.json();
    if (data.success) {
      setCatalogMsg("✅ Товар добавлен");
      setShowNewItemForm(false);
      setNewItem({ name: "", price_usd: 0, emoji: "📦", game: "steal-a-brainrot", sort_order: 0, image: null });
      fetchCatalog();
      setTimeout(() => setCatalogMsg(""), 2000);
    } else setCatalogMsg("❌ " + (data.error || "Ошибка"));
  }

  async function uploadImage(file: File, onSuccess: (url: string) => void) {
    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(",")[1];
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const res = await fetch(`${ORDERS_URL}?action=upload_image`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Admin-Token": token },
          body: JSON.stringify({ image_b64: base64, ext }),
        });
        const data = await res.json();
        if (data.url) onSuccess(data.url);
        else setCatalogMsg("❌ Ошибка загрузки");
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setCatalogMsg("❌ Ошибка загрузки");
      setUploadingImage(false);
    }
  }

  async function updateCatalogItem(item: CatalogItemAdmin) {
    const res = await fetch(`${ORDERS_URL}?action=catalog_update`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Admin-Token": token },
      body: JSON.stringify(item),
    });
    const data = await res.json();
    if (data.success) {
      setCatalogMsg("✅ Сохранено");
      setEditingItem(null);
      fetchCatalog();
      setTimeout(() => setCatalogMsg(""), 2000);
    } else setCatalogMsg("❌ " + (data.error || "Ошибка"));
  }

  async function inlineAddStock(itemId: number) {
    const lines = inlineStockText.trim().split("\n").filter(l => l.trim());
    if (!lines.length) return;
    setInlineStockSaving(true);
    setInlineStockMsg("");
    const res = await fetch(`${ORDERS_URL}?action=add_stock`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Admin-Token": token },
      body: JSON.stringify({ item_id: itemId, credentials: lines }),
    });
    const data = await res.json();
    if (data.added) {
      setInlineStockMsg(`✅ +${data.added} лот${data.added === 1 ? "" : data.added < 5 ? "а" : "ов"}`);
      setInlineStockText("");
      fetchCatalog();
      setTimeout(() => { setInlineStockMsg(""); setInlineStockItemId(null); }, 1800);
    } else {
      setInlineStockMsg("❌ " + (data.error || "Ошибка"));
    }
    setInlineStockSaving(false);
  }

  async function deleteCatalogItem(id: number) {
    if (!confirm("Удалить товар?")) return;
    const res = await fetch(`${ORDERS_URL}?action=catalog_delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Admin-Token": token },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (data.success) { fetchCatalog(); setCatalogMsg("✅ Удалено"); setTimeout(() => setCatalogMsg(""), 2000); }
  }

  async function setAvailable(params: { id?: number; game?: string; all?: boolean }, available: boolean) {
    const body: Record<string, unknown> = { available };
    if (params.id !== undefined) body.id = params.id;
    else if (params.game) body.game = params.game;
    await fetch(`${ORDERS_URL}?action=catalog_set_available`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Admin-Token": token },
      body: JSON.stringify(body),
    });
    fetchCatalog();
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
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-display font-bold text-white"
              style={{ background: "linear-gradient(135deg, #0066FF, #E8343A)" }}>C</div>
            <span className="font-display font-bold text-white hidden sm:block">Cambeck<span style={{ color: "#FFB800" }}>SHOP</span></span>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {onlineCount !== null && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                style={{ background: "rgba(0,208,128,0.1)", border: "1px solid rgba(0,208,128,0.2)" }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#00D080" }} />
                <span className="font-body text-xs font-bold" style={{ color: "#00D080" }}>{onlineCount} онлайн</span>
              </div>
            )}
            {totalVisits !== null && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                style={{ background: "rgba(255,184,0,0.08)", border: "1px solid rgba(255,184,0,0.2)" }}>
                <Icon name="Globe" size={11} style={{ color: "#FFB800" }} />
                <span className="font-body text-xs font-bold" style={{ color: "#FFB800" }}>
                  {totalVisits.toLocaleString("ru-RU")} визитов
                  {firstSeen && <span className="font-normal opacity-60 ml-1">с {new Date(firstSeen).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}</span>}
                </span>
              </div>
            )}
            {registeredCount !== null && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                style={{ background: "rgba(102,0,255,0.1)", border: "1px solid rgba(102,0,255,0.25)" }}>
                <Icon name="UserCheck" size={11} style={{ color: "#A855F7" }} />
                <span className="font-body text-xs font-bold" style={{ color: "#A855F7" }}>{registeredCount} зарегистрировано</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {[
            { id: "chats", label: "💬 Чаты", count: chats.filter(c => c.status === "open").length + sellerChats.reduce((s, c) => s + c.unread, 0) },
            { id: "orders", label: "📦 Заказы", count: orders.filter(o => o.status === "pending" || o.status === "sbp_pending").length },
            { id: "stock", label: "🗄️ Склад", count: null },
            { id: "catalog", label: "🛒 Каталог", count: null },
          ].map(t => (
            <button key={t.id} onClick={() => { const v = t.id as "chats" | "orders" | "stock" | "catalog"; setTab(v); localStorage.setItem("admin_tab", v); }}
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
                    <p className="font-display font-bold text-base mt-0.5" style={{ color: "#4DA6FF" }}>
                      {Math.round(o.amount_usd * usdRate)} ₽
                      <span className="font-body text-xs text-white/30 ml-1">≈ ${o.amount_usd.toFixed(2)}</span>
                    </p>
                    <p className="font-body text-white/30 text-xs mt-1">{o.network} • {new Date(o.created_at).toLocaleString("ru")}</p>
                    <p className="font-mono text-xs text-white/20 mt-0.5">#{o.order_id.slice(0,8).toUpperCase()}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="px-2 py-1 rounded-md font-body font-bold text-xs"
                      style={{
                        background: o.status === "paid" ? "rgba(0,176,111,0.15)" : o.status === "sbp_pending" ? "rgba(33,191,115,0.15)" : "rgba(255,184,0,0.12)",
                        color: o.status === "paid" ? "#00D080" : o.status === "sbp_pending" ? "#21BF73" : "#FFB800"
                      }}>
                      {o.status === "paid" ? "✅ Оплачен" : o.status === "sbp_pending" ? "💳 СБП — ждёт" : "⏳ Ожидает"}
                    </span>

                    {/* Крипта — ручное подтверждение */}
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

                    {/* СБП — подтвердить или отклонить */}
                    {o.status === "sbp_pending" && (
                      confirmingId === o.order_id ? (
                        <div className="flex flex-col gap-1">
                          <p className="font-body text-white/50 text-xs text-right">Перевод получен?</p>
                          <div className="flex gap-1">
                            <button onClick={() => confirmSbp(o.order_id)}
                              className="flex-1 py-1.5 rounded-lg font-body font-bold text-xs text-white"
                              style={{ background: "linear-gradient(135deg, #21BF73, #158F55)" }}>✅ Да, подтвердить</button>
                            <button onClick={() => setConfirmingId(null)}
                              className="px-2 py-1 rounded-lg font-body text-xs text-white/40"
                              style={{ background: "rgba(255,255,255,0.05)" }}>✕</button>
                          </div>
                          <button onClick={() => rejectSbp(o.order_id)}
                            className="w-full py-1 rounded-lg font-body text-xs text-red-400/70 hover:text-red-400 transition-colors"
                            style={{ background: "rgba(232,52,58,0.08)" }}>
                            ❌ Отклонить
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmingId(o.order_id)}
                          className="px-3 py-1.5 rounded-lg font-body font-bold text-xs text-white"
                          style={{ background: "linear-gradient(135deg, #21BF73, #158F55)" }}>
                          💳 Проверить СБП
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
              <NewItemForm token={token} onCreated={() => { fetchStockSummary(); setSelectedItemId(null); }} gamesList={games} usdRate={usdRate} gameCategories={gameCategories} />
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

      {/* CATALOG TAB */}
      {tab === "catalog" && (
        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-white text-lg">🛒 Каталог</h2>
            <button onClick={() => catalogSubTab === "items" ? (setShowNewItemForm(true), setEditingItem(null)) : (setShowNewGameForm(true), setEditingGame(null))}
              className="px-4 py-2 rounded-xl font-body font-bold text-sm text-white transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)" }}>
              + {catalogSubTab === "items" ? "Добавить товар" : "Добавить игру"}
            </button>
          </div>

          {/* Подвкладки */}
          <div className="flex gap-2 mb-5">
            {[{ id: "items", label: "📦 Товары" }, { id: "games", label: "🎮 Игры" }].map(st => (
              <button key={st.id} onClick={() => { const v = st.id as "items" | "games"; setCatalogSubTab(v); localStorage.setItem("admin_catalog_subtab", v); }}
                className="px-4 py-2 rounded-xl font-body text-sm transition-all"
                style={{ background: catalogSubTab === st.id ? "rgba(0,102,255,0.2)" : "rgba(255,255,255,0.05)", color: catalogSubTab === st.id ? "#4DA6FF" : "rgba(255,255,255,0.4)" }}>
                {st.label}
              </button>
            ))}
          </div>

          {(catalogMsg || gamesMsg) && (
            <div className="mb-4 px-4 py-2 rounded-xl text-sm font-body text-center"
              style={{ color: (catalogMsg || gamesMsg).startsWith("✅") ? "#00D080" : "#FF6B6B", background: (catalogMsg || gamesMsg).startsWith("✅") ? "rgba(0,208,128,0.1)" : "rgba(255,107,107,0.1)" }}>
              {catalogMsg || gamesMsg}
            </div>
          )}

          {/* ======= ПОДВКЛАДКА ИГРЫ ======= */}
          {catalogSubTab === "games" && (
            <div>
              {/* Форма новой игры */}
              {showNewGameForm && (
                <div className="rounded-2xl p-5 mb-5" style={{ background: "#161F2C", border: "1px solid rgba(0,102,255,0.25)" }}>
                  <h3 className="font-display font-bold text-white text-base mb-4">Новая игра</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="font-body text-white/40 text-xs mb-1 block">ID (латиница, дефисы) *</label>
                      <input value={newGame.id || ""} onChange={e => setNewGame(p => ({ ...p, id: e.target.value }))}
                        placeholder="my-game"
                        className="w-full px-3 py-2 rounded-xl font-body text-sm text-white outline-none"
                        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }} />
                    </div>
                    <div>
                      <label className="font-body text-white/40 text-xs mb-1 block">Название *</label>
                      <input value={newGame.name || ""} onChange={e => setNewGame(p => ({ ...p, name: e.target.value }))}
                        placeholder="My Game"
                        className="w-full px-3 py-2 rounded-xl font-body text-sm text-white outline-none"
                        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="font-body text-white/40 text-xs mb-1 block">Ссылка на картинку</label>
                      <input value={newGame.image || ""} onChange={e => setNewGame(p => ({ ...p, image: e.target.value }))}
                        placeholder="https://..."
                        className="w-full px-3 py-2 rounded-xl font-body text-sm text-white outline-none"
                        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }} />
                    </div>
                    <div>
                      <label className="font-body text-white/40 text-xs mb-1 block">Описание</label>
                      <input value={newGame.description || ""} onChange={e => setNewGame(p => ({ ...p, description: e.target.value }))}
                        placeholder="Короткое описание"
                        className="w-full px-3 py-2 rounded-xl font-body text-sm text-white outline-none"
                        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }} />
                    </div>
                    <div>
                      <label className="font-body text-white/40 text-xs mb-1 block">Бейдж (необязательно)</label>
                      <input value={newGame.badge || ""} onChange={e => setNewGame(p => ({ ...p, badge: e.target.value }))}
                        placeholder="🔥 Хит"
                        className="w-full px-3 py-2 rounded-xl font-body text-sm text-white outline-none"
                        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }} />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={createGame}
                      className="flex-1 py-2.5 rounded-xl font-body font-bold text-sm text-white"
                      style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)" }}>
                      ✅ Создать
                    </button>
                    <button onClick={() => setShowNewGameForm(false)}
                      className="px-5 py-2.5 rounded-xl font-body text-sm text-white/40 hover:text-white"
                      style={{ background: "rgba(255,255,255,0.05)" }}>
                      Отмена
                    </button>
                  </div>
                </div>
              )}

              {/* Список игр */}
              <div className="flex flex-col gap-3">
                {games.map(game => (
                  <div key={game.id} className="rounded-xl overflow-hidden"
                    style={{ background: "#161F2C", border: "1px solid rgba(255,255,255,0.06)" }}>
                    {editingGame?.id === game.id ? (
                      <div className="p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="font-body text-white/40 text-xs mb-1 block">Название</label>
                            <input value={editingGame.name} onChange={e => setEditingGame(p => p ? { ...p, name: e.target.value } : p)}
                              className="w-full px-3 py-2 rounded-xl font-body text-sm text-white outline-none"
                              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)" }} />
                          </div>
                          <div>
                            <label className="font-body text-white/40 text-xs mb-1 block">Бейдж</label>
                            <input value={editingGame.badge || ""} onChange={e => setEditingGame(p => p ? { ...p, badge: e.target.value } : p)}
                              placeholder="🔥 Хит"
                              className="w-full px-3 py-2 rounded-xl font-body text-sm text-white outline-none"
                              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)" }} />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="font-body text-white/40 text-xs mb-1 block">Ссылка на картинку</label>
                            <input value={editingGame.image} onChange={e => setEditingGame(p => p ? { ...p, image: e.target.value } : p)}
                              className="w-full px-3 py-2 rounded-xl font-body text-sm text-white outline-none"
                              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)" }} />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="font-body text-white/40 text-xs mb-1 block">Описание</label>
                            <input value={editingGame.description} onChange={e => setEditingGame(p => p ? { ...p, description: e.target.value } : p)}
                              className="w-full px-3 py-2 rounded-xl font-body text-sm text-white outline-none"
                              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)" }} />
                          </div>
                          {/* Редактор категорий */}
                          <div className="sm:col-span-2">
                            <label className="font-body text-white/40 text-xs mb-2 block">Категории товаров</label>
                            <div className="flex flex-col gap-2">
                              {(editingGame.categories || []).map((cat, idx) => (
                                <div key={idx} className="flex gap-2 items-center">
                                  <input
                                    value={cat.label}
                                    onChange={e => setEditingGame(p => {
                                      if (!p) return p;
                                      const cats = [...(p.categories || [])];
                                      // Автогенерируем id из label если id пустой
                                      const autoId = cats[idx].id || e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20) || `cat${idx}`;
                                      cats[idx] = { ...cats[idx], label: e.target.value, id: cats[idx].id || autoId };
                                      return { ...p, categories: cats };
                                    })}
                                    placeholder="🗡️ Юниты"
                                    className="flex-1 px-3 py-1.5 rounded-lg font-body text-sm text-white outline-none"
                                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)" }} />
                                  <input
                                    value={cat.id}
                                    onChange={e => setEditingGame(p => {
                                      if (!p) return p;
                                      const cats = [...(p.categories || [])];
                                      cats[idx] = { ...cats[idx], id: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "") };
                                      return { ...p, categories: cats };
                                    })}
                                    placeholder="units"
                                    className="w-28 px-3 py-1.5 rounded-lg font-mono text-xs text-white outline-none"
                                    style={{
                                      background: "rgba(255,255,255,0.07)",
                                      border: `1px solid ${cat.id ? "rgba(0,208,128,0.3)" : "rgba(232,52,58,0.4)"}`,
                                    }} />
                                  <button
                                    onClick={() => setEditingGame(p => {
                                      if (!p) return p;
                                      const cats = (p.categories || []).filter((_, i) => i !== idx);
                                      return { ...p, categories: cats };
                                    })}
                                    className="w-7 h-7 rounded-lg text-red-400/60 hover:text-red-400 transition-colors flex items-center justify-center text-sm flex-shrink-0"
                                    style={{ background: "rgba(232,52,58,0.07)" }}>✕</button>
                                </div>
                              ))}
                              <button
                                onClick={() => setEditingGame(p => {
                                  if (!p) return p;
                                  const idx = (p.categories || []).length;
                                  return { ...p, categories: [...(p.categories || []), { id: `cat${idx}`, label: "" }] };
                                })}
                                className="px-3 py-1.5 rounded-lg font-body text-xs text-white/50 hover:text-white transition-colors self-start"
                                style={{ background: "rgba(255,255,255,0.05)", border: "1px dashed rgba(255,255,255,0.15)" }}>
                                + Добавить категорию
                              </button>
                              <p className="font-body text-white/25 text-xs">Слева — название, справа — уникальный ID (только латиница)</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => updateGame(editingGame)}
                            className="px-5 py-2 rounded-xl font-body font-bold text-xs text-white"
                            style={{ background: "#00D080" }}>Сохранить</button>
                          <button onClick={() => setEditingGame(null)}
                            className="px-5 py-2 rounded-xl font-body text-xs text-white/40 hover:text-white"
                            style={{ background: "rgba(255,255,255,0.05)" }}>Отмена</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-3">
                        {game.image && (
                          <img src={game.image} alt={game.name} className="w-14 h-10 rounded-lg object-cover flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-body text-white text-sm font-bold">{game.name}</div>
                          <div className="font-body text-white/40 text-xs truncate">{game.description}</div>
                          <div className="flex gap-1.5 flex-wrap mt-0.5">
                            {game.badge && <span className="font-body text-xs text-yellow-400">{game.badge}</span>}
                            {game.categories?.length > 0 && (
                              <span className="font-body text-xs px-2 py-0.5 rounded-full"
                                style={{ background: "rgba(0,102,255,0.15)", color: "#4DA6FF", border: "1px solid rgba(0,102,255,0.25)" }}>
                                {game.categories.length} катег.
                              </span>
                            )}
                          </div>
                        </div>
                        <button onClick={() => setEditingGame({ ...game, categories: game.categories || [] })}
                          className="px-3 py-1.5 rounded-lg font-body text-xs text-white/60 hover:text-white"
                          style={{ background: "rgba(255,255,255,0.05)" }}>✏️</button>
                        <button onClick={() => deleteGame(game.id)}
                          className="px-3 py-1.5 rounded-lg font-body text-xs text-red-400/60 hover:text-red-400"
                          style={{ background: "rgba(232,52,58,0.07)" }}>🗑️</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======= ПОДВКЛАДКА ТОВАРЫ ======= */}
          {catalogSubTab === "items" && <>

          {/* Форма нового товара */}
          {showNewItemForm && (
            <div className="rounded-2xl p-5 mb-5" style={{ background: "#161F2C", border: "1px solid rgba(0,102,255,0.25)" }}>
              <h3 className="font-display font-bold text-white text-base mb-4">Новый товар</h3>

              {/* Загрузка картинки */}
              <div className="mb-4">
                <label className="font-body text-white/40 text-xs mb-2 block">Картинка товара</label>
                <div className="flex items-center gap-3">
                  {newItem.image ? (
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0"
                      style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                      <img src={newItem.image} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => setNewItem(p => ({ ...p, image: null }))}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white text-xs flex items-center justify-center">✕</button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-xl flex-shrink-0 flex items-center justify-center text-3xl"
                      style={{ background: "rgba(255,255,255,0.05)", border: "2px dashed rgba(255,255,255,0.15)" }}>
                      {newItem.emoji || "📦"}
                    </div>
                  )}
                  <label className={`flex-1 py-2.5 px-4 rounded-xl font-body font-bold text-sm text-center cursor-pointer transition-all hover:scale-105 ${uploadingImage ? "opacity-50" : ""}`}
                    style={{ background: "rgba(0,102,255,0.15)", border: "1px solid rgba(0,102,255,0.3)", color: "#4DA6FF" }}>
                    {uploadingImage ? "Загружаем..." : "📁 Выбрать файл"}
                    <input type="file" accept="image/*" className="hidden" disabled={uploadingImage}
                      onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f, url => setNewItem(p => ({ ...p, image: url }))); }} />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="font-body text-white/40 text-xs mb-1 block">Название *</label>
                  <input value={newItem.name || ""} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))}
                    placeholder="Название товара"
                    className="w-full px-3 py-2 rounded-xl font-body text-sm text-white outline-none"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }} />
                </div>
                <div>
                  <label className="font-body text-white/40 text-xs mb-1 block">Цена (₽)</label>
                  <input type="number" step="1" value={newItem.price_usd ? Math.round(newItem.price_usd * usdRate) : 0}
                    onChange={e => setNewItem(p => ({ ...p, price_usd: parseFloat((parseFloat(e.target.value) / usdRate).toFixed(2)) }))}
                    className="w-full px-3 py-2 rounded-xl font-body text-sm text-white outline-none"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }} />
                  {newItem.price_usd ? <p className="font-body text-white/25 text-xs mt-0.5">≈ ${newItem.price_usd.toFixed(2)}</p> : null}
                </div>
                <div>
                  <label className="font-body text-white/40 text-xs mb-1 block">Эмодзи</label>
                  <input value={newItem.emoji || "📦"} onChange={e => setNewItem(p => ({ ...p, emoji: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl font-body text-sm text-white outline-none text-center"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }} />
                </div>
                <div>
                  <label className="font-body text-white/40 text-xs mb-1 block">Игра</label>
                  <select value={newItem.game || "steal-a-brainrot"} onChange={e => setNewItem(p => ({ ...p, game: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl font-body text-sm text-white outline-none"
                    style={{ background: "#1e2a3a", border: "1px solid rgba(255,255,255,0.1)" }}>
                    {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>

                {gameCategories[newItem.game || ""] && (
                  <div className="sm:col-span-2">
                    <label className="font-body text-white/40 text-xs mb-1 block">Категория</label>
                    <div className="flex gap-2">
                      {gameCategories[newItem.game || ""].map(cat => (
                        <button key={cat.id} onClick={() => setNewItem(p => ({ ...p, category: cat.id }))}
                          className="px-4 py-2 rounded-xl font-body text-sm transition-all"
                          style={{
                            background: (newItem.category || "units") === cat.id ? "rgba(0,102,255,0.25)" : "rgba(255,255,255,0.05)",
                            border: `1px solid ${(newItem.category || "units") === cat.id ? "rgba(0,102,255,0.5)" : "rgba(255,255,255,0.1)"}`,
                            color: (newItem.category || "units") === cat.id ? "#4DA6FF" : "rgba(255,255,255,0.4)"
                          }}>
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="font-body text-white/40 text-xs mb-1 block">Позиция в списке</label>
                  <input type="number" value={newItem.sort_order || 0} onChange={e => setNewItem(p => ({ ...p, sort_order: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-xl font-body text-sm text-white outline-none"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }} />
                  <p className="font-body text-white/25 text-xs mt-0.5">1 = первый в списке, 2 = второй и т.д.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={createCatalogItem}
                  className="flex-1 py-2.5 rounded-xl font-body font-bold text-sm text-white"
                  style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)" }}>
                  ✅ Создать
                </button>
                <button onClick={() => setShowNewItemForm(false)}
                  className="px-5 py-2.5 rounded-xl font-body text-sm text-white/40 hover:text-white"
                  style={{ background: "rgba(255,255,255,0.05)" }}>
                  Отмена
                </button>
              </div>
            </div>
          )}

          {/* Фильтр по игре */}
          {!catalogLoading && games.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2 items-center">
              <button
                onClick={() => setCatalogGameFilter(null)}
                className="px-3 py-1.5 rounded-lg font-body text-xs transition-all"
                style={{ background: catalogGameFilter === null ? "rgba(0,102,255,0.25)" : "rgba(255,255,255,0.05)", color: catalogGameFilter === null ? "#4DA6FF" : "rgba(255,255,255,0.4)", border: `1px solid ${catalogGameFilter === null ? "rgba(0,102,255,0.5)" : "rgba(255,255,255,0.1)"}` }}>
                Все игры
              </button>
              {games.map(g => (
                <button key={g.id} onClick={() => setCatalogGameFilter(g.id)}
                  className="px-3 py-1.5 rounded-lg font-body text-xs transition-all"
                  style={{ background: catalogGameFilter === g.id ? "rgba(0,102,255,0.25)" : "rgba(255,255,255,0.05)", color: catalogGameFilter === g.id ? "#4DA6FF" : "rgba(255,255,255,0.4)", border: `1px solid ${catalogGameFilter === g.id ? "rgba(0,102,255,0.5)" : "rgba(255,255,255,0.1)"}` }}>
                  {g.name}
                </button>
              ))}
              {catalogGameFilter && (
                <div className="ml-auto flex gap-2">
                  <button onClick={() => setAvailable({ game: catalogGameFilter }, false)}
                    className="px-3 py-1.5 rounded-lg font-body text-xs font-bold transition-all"
                    style={{ background: "rgba(232,52,58,0.12)", color: "#FF6B6B", border: "1px solid rgba(232,52,58,0.25)" }}>
                    🚫 Снять всю игру
                  </button>
                  <button onClick={() => setAvailable({ game: catalogGameFilter }, true)}
                    className="px-3 py-1.5 rounded-lg font-body text-xs font-bold transition-all"
                    style={{ background: "rgba(0,208,128,0.12)", color: "#00D080", border: "1px solid rgba(0,208,128,0.25)" }}>
                    ✅ Вернуть всю игру
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Список товаров по играм */}
          {catalogLoading ? (
            <p className="text-white/30 font-body text-sm">Загружаем...</p>
          ) : (
            games.filter(game => catalogGameFilter === null || game.id === catalogGameFilter).map(game => {
              const items = catalogItems.filter(i => i.game === game.id);
              return (
                <div key={game.id} className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-display font-bold text-white/70 text-sm">{game.name}</span>
                    <span className="font-body text-white/30 text-xs">({items.length} товаров)</span>
                    {items.some(i => !i.available) && (
                      <span className="font-body text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(232,52,58,0.1)", color: "#FF6B6B" }}>
                        {items.filter(i => !i.available).length} снято
                      </span>
                    )}
                  </div>
                  {items.length === 0 && (
                    <p className="text-white/20 font-body text-xs ml-2">Нет товаров — нажми «+ Добавить товар»</p>
                  )}
                  <div className="flex flex-col gap-2">
                    {items.map(item => (
                      <div key={item.id} className="rounded-xl px-4 py-3 flex items-center gap-3"
                        style={{ background: item.available ? "#161F2C" : "rgba(22,31,44,0.5)", border: `1px solid ${item.available ? "rgba(255,255,255,0.06)" : "rgba(232,52,58,0.15)"}`, opacity: item.available ? 1 : 0.75 }}>
                        {editingItem?.id === item.id ? (
                          <div className="flex-1 flex flex-col gap-2">
                            {/* Картинка при редактировании */}
                            <div className="flex items-center gap-2">
                              {editingItem.image ? (
                                <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0"
                                  style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                                  <img src={editingItem.image} alt="" className="w-full h-full object-cover" />
                                  <button onClick={() => setEditingItem(p => p ? { ...p, image: null } : p)}
                                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 text-white text-xs flex items-center justify-center">✕</button>
                                </div>
                              ) : (
                                <div className="w-14 h-14 rounded-lg flex items-center justify-center text-2xl flex-shrink-0"
                                  style={{ background: "rgba(255,255,255,0.05)", border: "2px dashed rgba(255,255,255,0.15)" }}>
                                  {editingItem.emoji}
                                </div>
                              )}
                              <label className={`px-3 py-1.5 rounded-lg font-body text-xs cursor-pointer transition-all ${uploadingImage ? "opacity-50" : "hover:bg-white/10"}`}
                                style={{ background: "rgba(0,102,255,0.15)", color: "#4DA6FF", border: "1px solid rgba(0,102,255,0.3)" }}>
                                {uploadingImage ? "Загрузка..." : "📁 Заменить фото"}
                                <input type="file" accept="image/*" className="hidden" disabled={uploadingImage}
                                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f, url => setEditingItem(p => p ? { ...p, image: url } : p)); }} />
                              </label>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              <input value={editingItem.name} onChange={e => setEditingItem(p => p ? { ...p, name: e.target.value } : p)}
                                className="col-span-2 px-2 py-1.5 rounded-lg font-body text-sm text-white outline-none"
                                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)" }} />
                              <div className="flex flex-col gap-0.5">
                                <div className="flex gap-1">
                                  <span className="font-body text-white/40 text-xs self-center">₽</span>
                                  <input type="number" step="1"
                                    value={Math.round(editingItem.price_usd * usdRate)}
                                    onChange={e => setEditingItem(p => p ? { ...p, price_usd: parseFloat((parseFloat(e.target.value) / usdRate).toFixed(2)) } : p)}
                                    className="flex-1 px-2 py-1.5 rounded-lg font-body text-sm text-white outline-none"
                                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)" }} />
                                </div>
                                <span className="font-body text-white/25 text-xs pl-4">≈ ${editingItem.price_usd.toFixed(2)}</span>
                              </div>
                              <div className="flex gap-1">
                                <span className="font-body text-white/40 text-xs self-center">шт</span>
                                <input type="number" value={editingItem.stock} onChange={e => setEditingItem(p => p ? { ...p, stock: parseInt(e.target.value) } : p)}
                                  className="flex-1 px-2 py-1.5 rounded-lg font-body text-sm text-white outline-none"
                                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)" }} />
                              </div>
                              {gameCategories[editingItem.game] && (
                                <div className="col-span-2 sm:col-span-4 flex gap-2 flex-wrap items-center">
                                  <span className="font-body text-white/30 text-xs">Категория:</span>
                                  {gameCategories[editingItem.game].map(cat => {
                                    const isActive = editingItem.category === cat.id;
                                    return (
                                      <button key={cat.id}
                                        onClick={() => setEditingItem(p => p ? { ...p, category: isActive ? "" : cat.id } : p)}
                                        className="px-3 py-1 rounded-lg font-body text-xs font-bold transition-all hover:scale-105"
                                        style={{
                                          background: isActive ? "linear-gradient(135deg, #0066FF, #0044BB)" : "rgba(255,255,255,0.07)",
                                          border: `1px solid ${isActive ? "#0066FF" : "rgba(255,255,255,0.12)"}`,
                                          color: isActive ? "#fff" : "rgba(255,255,255,0.5)"
                                        }}>
                                        {cat.label}
                                      </button>
                                    );
                                  })}
                                  {editingItem.category && (
                                    <button onClick={() => setEditingItem(p => p ? { ...p, category: "" } : p)}
                                      className="font-body text-white/25 text-xs hover:text-white/50 transition-colors">
                                      ✕
                                    </button>
                                  )}
                                </div>
                              )}
                              <div className="col-span-2 sm:col-span-4 flex gap-2 mt-1">
                                <button onClick={() => updateCatalogItem(editingItem)}
                                  className="px-4 py-1.5 rounded-lg font-body font-bold text-xs text-white"
                                  style={{ background: "#00D080" }}>Сохранить</button>
                                <button onClick={() => setEditingItem(null)}
                                  className="px-4 py-1.5 rounded-lg font-body text-xs text-white/40 hover:text-white"
                                  style={{ background: "rgba(255,255,255,0.05)" }}>Отмена</button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col gap-0">
                            <div className="flex items-center gap-3">
                              {item.image ? (
                                <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                              ) : (
                                <span className="text-xl w-12 text-center flex-shrink-0">{item.emoji}</span>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <div className="font-body text-sm truncate" style={{ color: item.available ? "white" : "rgba(255,255,255,0.35)" }}>{item.name}</div>
                                  {!item.available && (
                                    <span className="text-xs px-1.5 py-0.5 rounded font-body flex-shrink-0" style={{ background: "rgba(232,52,58,0.15)", color: "#FF6B6B" }}>снято</span>
                                  )}
                                </div>
                                <div className="font-body text-white/40 text-xs">
                                  <span style={{ color: "#4DA6FF" }}>{Math.round(item.price_usd * usdRate)} ₽</span>
                                  <span className="text-white/25"> · ${item.price_usd}</span>
                                </div>
                              </div>
                              {/* Инлайн-редактор количества */}
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button onClick={() => updateCatalogItem({ ...item, stock: Math.max(0, item.stock - 1) })}
                                  className="w-7 h-7 rounded-lg font-bold text-sm text-white/60 hover:text-white transition-colors flex items-center justify-center"
                                  style={{ background: "rgba(255,255,255,0.07)" }}>−</button>
                                <input
                                  type="number"
                                  value={item.stock}
                                  onChange={e => {
                                    const val = parseInt(e.target.value) || 0;
                                    setCatalogItems(prev => prev.map(i => i.id === item.id ? { ...i, stock: val } : i));
                                  }}
                                  onBlur={e => updateCatalogItem({ ...item, stock: parseInt(e.target.value) || 0 })}
                                  className="w-14 text-center px-1 py-1 rounded-lg font-body text-sm text-white outline-none"
                                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }} />
                                <button onClick={() => updateCatalogItem({ ...item, stock: item.stock + 1 })}
                                  className="w-7 h-7 rounded-lg font-bold text-sm text-white/60 hover:text-white transition-colors flex items-center justify-center"
                                  style={{ background: "rgba(255,255,255,0.07)" }}>+</button>
                                <span className="font-body text-white/30 text-xs ml-0.5">шт</span>
                              </div>
                              {/* Кнопка добавить лоты */}
                              <button
                                onClick={() => {
                                  if (inlineStockItemId === item.id) { setInlineStockItemId(null); setInlineStockText(""); setInlineStockMsg(""); }
                                  else { setInlineStockItemId(item.id); setInlineStockText(""); setInlineStockMsg(""); }
                                }}
                                className="px-3 py-1.5 rounded-lg font-body text-xs font-bold transition-all flex-shrink-0"
                                style={{
                                  background: inlineStockItemId === item.id ? "rgba(0,208,128,0.2)" : "rgba(0,208,128,0.1)",
                                  border: `1px solid ${inlineStockItemId === item.id ? "rgba(0,208,128,0.5)" : "rgba(0,208,128,0.2)"}`,
                                  color: "#00D080"
                                }}>
                                {inlineStockItemId === item.id ? "✕" : "📦 +лоты"}
                              </button>
                              <button
                                onClick={() => setAvailable({ id: item.id }, !item.available)}
                                className="px-3 py-1.5 rounded-lg font-body text-xs font-bold transition-all flex-shrink-0"
                                style={item.available
                                  ? { background: "rgba(232,52,58,0.08)", color: "#FF6B6B", border: "1px solid rgba(232,52,58,0.2)" }
                                  : { background: "rgba(0,208,128,0.1)", color: "#00D080", border: "1px solid rgba(0,208,128,0.25)" }}>
                                {item.available ? "🚫" : "✅"}
                              </button>
                              <button onClick={() => setEditingItem({ ...item })}
                                className="px-3 py-1.5 rounded-lg font-body text-xs text-white/60 hover:text-white transition-colors flex-shrink-0"
                                style={{ background: "rgba(255,255,255,0.05)" }}>✏️</button>
                              <button onClick={() => deleteCatalogItem(item.id)}
                                className="px-3 py-1.5 rounded-lg font-body text-xs text-red-400/60 hover:text-red-400 transition-colors flex-shrink-0"
                                style={{ background: "rgba(232,52,58,0.07)" }}>🗑️</button>
                            </div>

                            {/* Панель добавления лотов */}
                            {inlineStockItemId === item.id && (
                              <div className="mt-3 pl-15" style={{ paddingLeft: "60px" }}>
                                <div className="rounded-xl p-3 flex flex-col gap-2"
                                  style={{ background: "rgba(0,208,128,0.05)", border: "1px solid rgba(0,208,128,0.15)" }}>
                                  <div className="flex items-center justify-between">
                                    <span className="font-body text-white/50 text-xs">Вставь лоты — по одному на строку</span>
                                    {inlineStockText.trim() && (
                                      <span className="font-body text-xs px-2 py-0.5 rounded-full"
                                        style={{ background: "rgba(0,208,128,0.15)", color: "#00D080", border: "1px solid rgba(0,208,128,0.25)" }}>
                                        {inlineStockText.trim().split("\n").filter(l => l.trim()).length} лот
                                        {inlineStockText.trim().split("\n").filter(l => l.trim()).length === 1 ? "" :
                                          inlineStockText.trim().split("\n").filter(l => l.trim()).length < 5 ? "а" : "ов"}
                                      </span>
                                    )}
                                  </div>
                                  <textarea
                                    value={inlineStockText}
                                    onChange={e => setInlineStockText(e.target.value)}
                                    rows={4}
                                    placeholder={"login1:pass1\nlogin2:pass2\n..."}
                                    className="w-full px-3 py-2 rounded-lg font-mono text-xs text-white outline-none resize-none"
                                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                                    autoFocus
                                  />
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => inlineAddStock(item.id)}
                                      disabled={inlineStockSaving || !inlineStockText.trim()}
                                      className="px-4 py-1.5 rounded-lg font-body font-bold text-xs text-white disabled:opacity-40 transition-opacity"
                                      style={{ background: "linear-gradient(135deg, #00B06F, #007A4D)" }}>
                                      {inlineStockSaving ? "Загружаем..." : "✅ Добавить"}
                                    </button>
                                    <button onClick={() => { setInlineStockItemId(null); setInlineStockText(""); setInlineStockMsg(""); }}
                                      className="px-3 py-1.5 rounded-lg font-body text-xs text-white/40 hover:text-white transition-colors"
                                      style={{ background: "rgba(255,255,255,0.05)" }}>Отмена</button>
                                    {inlineStockMsg && (
                                      <span className="font-body text-xs ml-1" style={{ color: inlineStockMsg.startsWith("✅") ? "#00D080" : "#FF6B6B" }}>
                                        {inlineStockMsg}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
          </>}
        </div>
      )}

      {/* CHATS TAB */}
      {tab === "chats" && (
        <div className="flex flex-1 overflow-hidden">
          {/* Список чатов */}
          <div className="w-64 flex-shrink-0 border-r border-white/5 flex flex-col overflow-hidden"
            style={{ background: "#131C27" }}>
            {/* Подвкладки */}
            <div className="flex border-b border-white/5">
              {[
                { id: "seller", label: "🛍️ Покупатели", badge: sellerChats.reduce((s, c) => s + c.unread, 0) },
                { id: "support", label: "💬 Поддержка", badge: 0 },
                { id: "order",   label: "📦 Заказы", badge: 0 },
              ].map(st => (
                <button key={st.id} onClick={() => setChatSubTab(st.id as "support" | "order" | "seller")}
                  className="flex-1 py-2.5 font-body text-xs transition-all relative"
                  style={{
                    background: chatSubTab === st.id ? "rgba(0,102,255,0.15)" : "transparent",
                    color: chatSubTab === st.id ? "#4DA6FF" : "rgba(255,255,255,0.35)",
                    borderBottom: chatSubTab === st.id ? "2px solid #0066FF" : "2px solid transparent",
                  }}>
                  {st.label}
                  {st.badge > 0 && (
                    <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full text-xs font-bold flex items-center justify-center" style={{ background: "#E8343A", color: "#fff", fontSize: 10 }}>
                      {st.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Список: покупательские чаты */}
            {chatSubTab === "seller" && (
              <div className="flex-1 overflow-y-auto">
                {sellerChats.length === 0 && (
                  <div className="text-center text-white/20 text-sm mt-12 px-4">Нет диалогов</div>
                )}
                {sellerChats.map(chat => (
                  <button key={chat.id} onClick={() => { setSelectedSellerChat(chat); fetchSellerMessages(chat.id); }}
                    className="w-full text-left px-4 py-3 border-b border-white/5 transition-all hover:bg-white/5"
                    style={selectedSellerChat?.id === chat.id ? { background: "rgba(0,102,255,0.1)" } : {}}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-body font-bold text-sm text-white truncate">{chat.username}</span>
                      <div className="flex items-center gap-1.5">
                        {chat.unread > 0 && (
                          <span className="min-w-4 h-4 px-1 rounded-full text-xs font-bold flex items-center justify-center" style={{ background: "#E8343A", color: "#fff", fontSize: 10 }}>
                            {chat.unread}
                          </span>
                        )}
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${chat.status === "open" ? "bg-green-400" : "bg-white/20"}`} />
                      </div>
                    </div>
                    <p className="font-mono text-xs mb-1" style={{ color: "#FFB800" }}>
                      Заказ #{chat.order_id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="font-body text-xs text-white/40 truncate">{chat.last_message || "Нет сообщений"}</p>
                    <p className="font-body text-xs text-white/20 mt-1">{timeAgo(chat.updated_at)}</p>
                  </button>
                ))}
              </div>
            )}

            {/* Список: чаты поддержки / заказов */}
            {chatSubTab !== "seller" && (
              <div className="flex-1 overflow-y-auto">
                {chats.length === 0 && (
                  <div className="text-center text-white/20 text-sm mt-12 px-4">
                    {chatSubTab === "support" ? "Нет обращений" : "Нет заказных чатов"}
                  </div>
                )}
                {chats.map(chat => (
                  <button key={chat.id} onClick={() => { setSelectedChat(chat); fetchMessages(chat.id); }}
                    className="w-full text-left px-4 py-3 border-b border-white/5 transition-all hover:bg-white/5"
                    style={selectedChat?.id === chat.id ? { background: "rgba(0,102,255,0.1)" } : {}}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-body font-bold text-sm text-white truncate">{chat.visitor_name}</span>
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ml-2 ${chat.status === "open" ? "bg-green-400" : "bg-white/20"}`} />
                    </div>
                    {chat.chat_type === "order" && chat.order_id && (
                      <p className="font-mono text-xs mb-1" style={{ color: "#FFB800" }}>
                        📦 #{chat.order_id.slice(0, 8).toUpperCase()}
                      </p>
                    )}
                    <p className="font-body text-xs text-white/40 truncate">{chat.last_message || "Нет сообщений"}</p>
                    <p className="font-body text-xs text-white/20 mt-1">{timeAgo(chat.updated_at)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Переписка */}
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* === SELLER CHAT (покупатель ↔ продавец) === */}
            {chatSubTab === "seller" && (
              <>
                {!selectedSellerChat ? (
                  <div className="flex flex-col items-center justify-center flex-1 text-white/20">
                    <Icon name="ShoppingBag" size={48} />
                    <p className="font-body mt-3">Выберите диалог слева</p>
                  </div>
                ) : (
                  <>
                    <div className="h-14 flex items-center justify-between px-5 border-b border-white/5 flex-shrink-0"
                      style={{ background: "#161F2C" }}>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-body font-bold text-white">{selectedSellerChat.username}</span>
                          <span className="px-1.5 py-0.5 rounded font-body font-bold text-xs" style={{ background: "rgba(255,184,0,0.15)", color: "#FFB800" }}>
                            Заказ
                          </span>
                          <span className={`text-xs font-body ${selectedSellerChat.status === "open" ? "text-green-400" : "text-white/30"}`}>
                            {selectedSellerChat.status === "open" ? "• открыт" : "• закрыт"}
                          </span>
                        </div>
                        <p className="font-mono text-xs text-white/30 mt-0.5">#{selectedSellerChat.order_id.slice(0, 8).toUpperCase()}</p>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-1">
                      {sellerMessages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-white/20 gap-2">
                          <p className="font-body text-sm">Сообщений пока нет</p>
                        </div>
                      )}
                      {sellerMessages.map(msg => {
                        if (msg.sender === "system") {
                          const lines = msg.text.split("\n").filter(Boolean);
                          return (
                            <div key={msg.id} className="flex justify-center my-2">
                              <div className="rounded-xl px-4 py-3 text-center"
                                style={{ background: "rgba(0,176,111,0.1)", border: "1px solid rgba(0,176,111,0.2)" }}>
                                <p className="font-body font-bold text-green-400 text-xs mb-1">{lines[0]}</p>
                                {lines.slice(1).map((l: string, i: number) => (
                                  <p key={i} className="font-body text-white/50 text-xs">{l}</p>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div key={msg.id} className={`flex mb-1 ${msg.sender === "seller" ? "justify-end" : "justify-start"}`}>
                            <div className="max-w-[65%] flex flex-col">
                              <div className="px-4 py-2.5 font-body text-sm leading-relaxed"
                                style={{
                                  background: msg.sender === "seller" ? "linear-gradient(135deg, #0066FF, #0044BB)" : "rgba(255,255,255,0.08)",
                                  color: "white",
                                  borderRadius: msg.sender === "seller" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                                }}>
                                {msg.text}
                              </div>
                              <div className="flex items-center gap-1 px-1 mt-1">
                                <span className="text-xs text-white/25">
                                  {new Date(msg.created_at).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                                {msg.sender === "seller" && (
                                  <span className="text-white/25" style={{ fontSize: 11 }}>{msg.is_read ? "✓✓" : "✓"}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={sellerBottomRef} />
                    </div>
                    <div className="px-5 py-4 border-t border-white/5 flex gap-3 flex-shrink-0"
                      style={{ background: "#161F2C" }}>
                      <input className="flex-1 px-4 py-2.5 rounded-xl font-body text-sm text-white outline-none"
                        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
                        placeholder="Ответить покупателю..." value={sellerReplyText}
                        onChange={e => setSellerReplyText(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && sendSellerReply()} />
                      <button onClick={sendSellerReply} disabled={sellerSending || !sellerReplyText.trim()}
                        className="px-5 py-2.5 rounded-xl font-body font-bold text-sm text-white transition-all hover:scale-105 disabled:opacity-40"
                        style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)" }}>
                        <Icon name="Send" size={16} />
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {/* === SUPPORT / ORDER CHATS === */}
            {chatSubTab !== "seller" && (
              <>
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
                        <div className="flex items-center gap-2">
                          <span className="font-body font-bold text-white">{selectedChat.visitor_name}</span>
                          {selectedChat.chat_type === "order" && (
                            <span className="px-1.5 py-0.5 rounded font-body font-bold text-xs" style={{ background: "rgba(255,184,0,0.15)", color: "#FFB800" }}>
                              📦 Заказ
                            </span>
                          )}
                          <span className={`text-xs font-body ${selectedChat.status === "open" ? "text-green-400" : "text-white/30"}`}>
                            {selectedChat.status === "open" ? "• открыт" : "• закрыт"}
                          </span>
                        </div>
                        {selectedChat.chat_type === "order" && selectedChat.order_id && (
                          <p className="font-mono text-xs text-white/30 mt-0.5">#{selectedChat.order_id.slice(0, 8).toUpperCase()}</p>
                        )}
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
              </>
            )}
          </div>
        </div>
      )}


    </div>
  );
}