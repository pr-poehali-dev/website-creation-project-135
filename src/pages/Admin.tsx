import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";

const CHAT_URL = "https://functions.poehali.dev/5dc1e3a3-dd70-49b6-a971-dd798391a238";

type Chat = {
  id: string;
  visitor_name: string;
  visitor_id: string;
  status: string;
  last_message: string;
  msg_count: number;
  updated_at: string;
};

type Message = { id: string; sender: string; text: string; created_at: string };

export default function Admin() {
  const [token, setToken] = useState(() => localStorage.getItem("cambeck_admin_token") || "");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const isAuthed = !!token;

  useEffect(() => {
    if (!isAuthed) return;
    fetchChats();
    const interval = setInterval(fetchChats, 4000);
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

  async function doLogin() {
    setLoginError("");
    const res = await fetch(`${CHAT_URL}?action=login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, password }),
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
    const res = await fetch(`${CHAT_URL}?action=chats`, {
      headers: { "X-Admin-Token": token },
    });
    const data = await res.json();
    if (data.chats) setChats(data.chats);
  }

  async function fetchMessages(chatId: string) {
    const res = await fetch(`${CHAT_URL}?action=messages&chat_id=${chatId}`, {
      headers: { "X-Admin-Token": token },
    });
    const data = await res.json();
    if (data.messages) setMessages(data.messages);
  }

  async function sendReply() {
    if (!text.trim() || !selectedChat || sending) return;
    setSending(true);
    await fetch(`${CHAT_URL}?action=message`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Admin-Token": token },
      body: JSON.stringify({ text: text.trim(), chat_id: selectedChat.id }),
    });
    setText("");
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
            <input
              className="w-full px-4 py-3 rounded-xl font-body text-sm text-white outline-none"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
              placeholder="Логин"
              value={login}
              onChange={e => setLogin(e.target.value)}
              onKeyDown={e => e.key === "Enter" && doLogin()}
            />
            <input
              type="password"
              className="w-full px-4 py-3 rounded-xl font-body text-sm text-white outline-none"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
              placeholder="Пароль"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && doLogin()}
            />
            <button
              onClick={doLogin}
              className="btn-shimmer w-full py-3 rounded-xl font-body font-bold text-sm text-white transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)" }}
            >
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
      <nav className="h-14 flex items-center justify-between px-6 border-b border-white/5"
        style={{ background: "#161F2C" }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-display font-bold text-white"
            style={{ background: "linear-gradient(135deg, #0066FF, #E8343A)" }}>C</div>
          <span className="font-display font-bold text-white">Cambeck<span style={{ color: "#FFB800" }}>SHOP</span></span>
          <span className="font-body text-white/30 text-xs ml-1">— Поддержка</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-body text-white/40 text-xs hidden sm:block">
            Чатов: {chats.length} • Открытых: {chats.filter(c => c.status === "open").length}
          </span>
          <button onClick={logout}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-body text-xs text-white/50 hover:text-white transition-all hover:bg-white/5">
            <Icon name="LogOut" size={14} />
            Выйти
          </button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Список чатов */}
        <div className="w-72 flex-shrink-0 border-r border-white/5 flex flex-col overflow-hidden"
          style={{ background: "#131C27" }}>
          <div className="px-4 py-3 border-b border-white/5">
            <p className="font-body text-white/40 text-xs uppercase tracking-wider">Обращения</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {chats.length === 0 && (
              <div className="text-center text-white/20 text-sm mt-12 px-4">
                Пока нет обращений
              </div>
            )}
            {chats.map(chat => (
              <button
                key={chat.id}
                onClick={() => { setSelectedChat(chat); fetchMessages(chat.id); }}
                className="w-full text-left px-4 py-3 border-b border-white/5 transition-all hover:bg-white/5"
                style={selectedChat?.id === chat.id ? { background: "rgba(0,102,255,0.1)" } : {}}
              >
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
              {/* Chat header */}
              <div className="h-14 flex items-center justify-between px-5 border-b border-white/5"
                style={{ background: "#161F2C" }}>
                <div>
                  <span className="font-body font-bold text-white">{selectedChat.visitor_name}</span>
                  <span className={`ml-2 text-xs font-body ${selectedChat.status === "open" ? "text-green-400" : "text-white/30"}`}>
                    {selectedChat.status === "open" ? "• открыт" : "• закрыт"}
                  </span>
                </div>
                {selectedChat.status === "open" && (
                  <button
                    onClick={() => closeChat(selectedChat.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-body text-xs text-white/50 hover:text-red-400 transition-all hover:bg-red-400/10"
                  >
                    <Icon name="X" size={13} />
                    Закрыть чат
                  </button>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender === "admin" ? "justify-end" : "justify-start"}`}>
                    <div
                      className="max-w-[65%] px-4 py-2.5 font-body text-sm leading-relaxed"
                      style={{
                        background: msg.sender === "admin"
                          ? "linear-gradient(135deg, #0066FF, #0044BB)"
                          : "rgba(255,255,255,0.08)",
                        color: "white",
                        borderRadius: msg.sender === "admin" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                      }}
                    >
                      {msg.text}
                      <div className="text-xs mt-1 opacity-40">
                        {new Date(msg.created_at).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Reply input */}
              {selectedChat.status === "open" && (
                <div className="px-5 py-4 border-t border-white/5 flex gap-3"
                  style={{ background: "#161F2C" }}>
                  <input
                    className="flex-1 px-4 py-2.5 rounded-xl font-body text-sm text-white outline-none"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
                    placeholder="Ответить..."
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendReply()}
                  />
                  <button
                    onClick={sendReply}
                    disabled={sending || !text.trim()}
                    className="px-5 py-2.5 rounded-xl font-body font-bold text-sm text-white transition-all hover:scale-105 disabled:opacity-40"
                    style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)" }}
                  >
                    <Icon name="Send" size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
