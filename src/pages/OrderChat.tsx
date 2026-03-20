import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Icon from "@/components/ui/icon";

const SELLER_CHAT_URL = "https://functions.poehali.dev/6f29f896-2b7e-4b27-ad18-6f4da48ef96a";
const AUTH_URL = "https://functions.poehali.dev/4d9f59a5-cbc5-418a-bb2f-849af25b8236";
const POLL_INTERVAL = 8000;

interface Message {
  id: string;
  sender: "buyer" | "seller" | "system";
  text: string;
  created_at: string;
  is_read: boolean;
}

interface OrderInfo {
  id: string;
  item_name: string;
  status: string;
}

export default function OrderChat() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const token = localStorage.getItem("cambeck_token") || "";

  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading]);

  // Загружаем инфо о заказе
  useEffect(() => {
    if (!orderId || !token) return;
    fetch(`${AUTH_URL}?action=me`, {
      headers: { "X-Auth-Token": token },
    })
      .then((r) => r.json())
      .then((data) => {
        const found = (data.orders || []).find((o: OrderInfo) => String(o.order_id) === orderId || String(o.id) === orderId);
        if (found) setOrder({ id: String(found.order_id || found.id), item_name: found.item_name, status: found.status });
      });
  }, [orderId, token]);

  // Открываем или получаем чат
  useEffect(() => {
    if (!orderId || !token) return;
    openChat();
  }, [orderId, token]);

  async function openChat() {
    setInitializing(true);
    setError("");
    const res = await fetch(`${SELLER_CHAT_URL}?action=open`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Auth-Token": token },
      body: JSON.stringify({ order_id: orderId }),
    });
    const data = await res.json();
    if (data.error) {
      setError(data.error);
      setInitializing(false);
      return;
    }
    setChatId(data.chat_id);
    setInitializing(false);
  }

  // Polling сообщений
  const fetchMessages = useCallback(async (id: string) => {
    const res = await fetch(`${SELLER_CHAT_URL}?action=messages&chat_id=${id}`, {
      headers: { "X-Auth-Token": token },
    });
    const data = await res.json();
    if (!data.error) {
      setMessages(data.messages || []);
    }
  }, [token]);

  useEffect(() => {
    if (!chatId) return;
    fetchMessages(chatId);
    pollRef.current = setInterval(() => fetchMessages(chatId), POLL_INTERVAL);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [chatId, fetchMessages]);

  // Скролл вниз при новых сообщениях
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!text.trim() || !chatId || sending) return;
    const msgText = text.trim();
    setText("");
    setSending(true);

    // Оптимистичное добавление
    const tempId = "temp_" + Date.now();
    setMessages((prev) => [
      ...prev,
      { id: tempId, sender: "buyer", text: msgText, created_at: new Date().toISOString(), is_read: false },
    ]);

    await fetch(`${SELLER_CHAT_URL}?action=send`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Auth-Token": token },
      body: JSON.stringify({ chat_id: chatId, text: msgText }),
    });
    setSending(false);
    fetchMessages(chatId);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function formatTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "Сегодня";
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Вчера";
    return d.toLocaleDateString("ru", { day: "numeric", month: "long" });
  }

  // Группируем сообщения по датам
  const grouped: { date: string; msgs: Message[] }[] = [];
  for (const msg of messages) {
    const dateLabel = formatDate(msg.created_at);
    const last = grouped[grouped.length - 1];
    if (last && last.date === dateLabel) {
      last.msgs.push(msg);
    } else {
      grouped.push({ date: dateLabel, msgs: [msg] });
    }
  }

  if (loading || initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0F1923" }}>
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen" style={{ background: "#0F1923" }}>
      {/* Шапка */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b border-white/5 flex-shrink-0"
        style={{ background: "#161F2C" }}
      >
        <button
          onClick={() => navigate("/profile")}
          className="text-white/40 hover:text-white transition-colors"
        >
          <Icon name="ArrowLeft" size={20} />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #0066FF, #E8343A)" }}
            >
              C
            </div>
            <div className="min-w-0">
              <p className="font-display font-bold text-white text-sm">Продавец КамбекШОП</p>
              <p className="font-body text-white/40 text-xs truncate">
                {order ? order.item_name : `Заказ #${orderId}`}
              </p>
            </div>
          </div>
        </div>

        {/* Кнопка к заказу */}
        <Link
          to="/profile"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-body text-xs text-white/70 hover:text-white hover:bg-white/5 transition-all border border-white/10"
        >
          <Icon name="Package" size={14} />
          <span className="hidden sm:inline">К заказу</span>
        </Link>
      </div>

      {/* Ошибка */}
      {error && (
        <div className="mx-4 mt-3 px-4 py-3 rounded-xl text-sm font-body text-red-400 border border-red-500/20" style={{ background: "rgba(239,68,68,0.08)" }}>
          {error}
        </div>
      )}

      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1">
        {messages.length === 0 && !error && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(0,102,255,0.1)" }}>
              <Icon name="MessageCircle" size={28} className="text-blue-400" />
            </div>
            <p className="font-display font-bold text-white text-lg mb-2">Начните диалог</p>
            <p className="font-body text-white/40 text-sm max-w-xs">
              Напишите продавцу — он ответит в ближайшее время. Обычно отвечаем в течение нескольких минут.
            </p>
          </div>
        )}

        {grouped.map((group) => (
          <div key={group.date}>
            {/* Разделитель даты */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
              <span className="font-body text-white/25 text-xs">{group.date}</span>
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
            </div>

            {group.msgs.map((msg) => {
              const isBuyer = msg.sender === "buyer";
              const isSystem = msg.sender === "system";

              // Системное сообщение — карточка заказа
              if (isSystem) {
                const lines = msg.text.split("\n").filter(Boolean);
                return (
                  <div key={msg.id} className="flex justify-center my-3">
                    <div
                      className="rounded-2xl px-5 py-4 max-w-xs w-full text-center"
                      style={{ background: "rgba(0,176,111,0.1)", border: "1px solid rgba(0,176,111,0.25)" }}
                    >
                      <div className="text-lg mb-1">✅</div>
                      <p className="font-body font-bold text-green-400 text-sm mb-1">{lines[0]}</p>
                      {lines.slice(1).map((l, i) => (
                        <p key={i} className="font-body text-white/60 text-xs">{l}</p>
                      ))}
                      <p className="font-body text-white/25 text-xs mt-2">{formatTime(msg.created_at)}</p>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex mb-2 ${isBuyer ? "justify-end" : "justify-start"}`}
                >
                  {!isBuyer && (
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mr-2 mt-1"
                      style={{ background: "linear-gradient(135deg, #0066FF, #E8343A)" }}
                    >
                      C
                    </div>
                  )}
                  <div className={`max-w-[75%] ${isBuyer ? "items-end" : "items-start"} flex flex-col`}>
                    <div
                      className="px-4 py-2.5 rounded-2xl text-sm font-body leading-relaxed break-words"
                      style={
                        isBuyer
                          ? { background: "linear-gradient(135deg, #0066FF, #0044BB)", color: "#fff", borderBottomRightRadius: 4 }
                          : { background: "#1E2A3A", color: "rgba(255,255,255,0.9)", borderBottomLeftRadius: 4 }
                      }
                    >
                      {msg.text}
                    </div>
                    <div className="flex items-center gap-1 mt-1 px-1">
                      <span className="font-body text-white/25 text-xs">{formatTime(msg.created_at)}</span>
                      {isBuyer && (
                        <span className="text-white/30" style={{ fontSize: 11 }}>
                          {msg.is_read ? "✓✓" : "✓"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Ввод сообщения */}
      <div
        className="px-4 py-3 border-t border-white/5 flex-shrink-0"
        style={{ background: "#161F2C" }}
      >
        <div className="flex items-end gap-3">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Напишите сообщение..."
            rows={1}
            className="flex-1 px-4 py-3 rounded-xl font-body text-sm text-white outline-none resize-none"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.1)",
              maxHeight: 120,
              overflowY: "auto",
            }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = Math.min(el.scrollHeight, 120) + "px";
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!text.trim() || sending}
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
            style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)" }}
          >
            <Icon name="Send" size={18} className="text-white" />
          </button>
        </div>
        <p className="font-body text-white/20 text-xs mt-2 text-center">
          Enter — отправить · Shift+Enter — новая строка
        </p>
      </div>
    </div>
  );
}