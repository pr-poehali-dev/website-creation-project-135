import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";

const CHAT_URL = "https://functions.poehali.dev/5dc1e3a3-dd70-49b6-a971-dd798391a238";

function getVisitorId() {
  let id = localStorage.getItem("cambeck_visitor_id");
  if (!id) {
    id = "v_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("cambeck_visitor_id", id);
  }
  return id;
}

type Message = { id: string; sender: string; text: string; created_at: string };

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [chatId, setChatId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [visitorName, setVisitorName] = useState("");
  const [nameEntered, setNameEntered] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const visitorId = getVisitorId();

  useEffect(() => {
    const saved = localStorage.getItem("cambeck_visitor_name");
    if (saved) { setVisitorName(saved); setNameEntered(true); }
  }, []);

  useEffect(() => {
    if (!open || !nameEntered) return;
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [open, nameEntered, chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchMessages() {
    const url = chatId
      ? `${CHAT_URL}?action=messages&chat_id=${chatId}`
      : `${CHAT_URL}?action=messages`;
    const res = await fetch(url, { headers: { "X-Visitor-Id": visitorId } });
    const data = await res.json();
    if (data.chat_id) setChatId(data.chat_id);
    if (data.messages) setMessages(data.messages);
  }

  async function sendMessage() {
    if (!text.trim() || sending) return;
    setSending(true);
    const res = await fetch(`${CHAT_URL}?action=message`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Visitor-Id": visitorId },
      body: JSON.stringify({ text: text.trim(), visitor_name: visitorName }),
    });
    const data = await res.json();
    if (data.chat_id) setChatId(data.chat_id);
    setText("");
    await fetchMessages();
    setSending(false);
  }

  function handleNameSubmit() {
    if (!visitorName.trim()) return;
    localStorage.setItem("cambeck_visitor_name", visitorName.trim());
    setNameEntered(true);
  }

  return (
    <>
      {/* Кнопка открытия */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 animate-pulse-glow"
        style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)" }}
      >
        <Icon name={open ? "X" : "MessageCircle"} size={24} />
      </button>

      {/* Чат окно */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 w-80 rounded-2xl flex flex-col overflow-hidden animate-bounce-in"
          style={{ background: "#161F2C", border: "1px solid rgba(0,102,255,0.3)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)", height: "420px" }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5"
            style={{ background: "linear-gradient(135deg, #0066FF22, #0044BB22)" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
              style={{ background: "linear-gradient(135deg, #0066FF, #E8343A)" }}>C</div>
            <div>
              <div className="font-display font-bold text-white text-sm">CambeckSHOP</div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                <span className="text-xs text-white/40">Поддержка онлайн</span>
              </div>
            </div>
          </div>

          {!nameEntered ? (
            /* Ввод имени */
            <div className="flex flex-col items-center justify-center flex-1 px-5 gap-4">
              <div className="text-3xl">👋</div>
              <p className="font-body text-white/70 text-sm text-center">Как вас зовут? Мы ответим быстро!</p>
              <input
                className="w-full px-4 py-2.5 rounded-xl font-body text-sm text-white outline-none"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
                placeholder="Ваше имя или ник"
                value={visitorName}
                onChange={e => setVisitorName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleNameSubmit()}
              />
              <button
                onClick={handleNameSubmit}
                className="w-full py-2.5 rounded-xl font-body font-bold text-sm text-white transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)" }}
              >
                Начать чат
              </button>
            </div>
          ) : (
            <>
              {/* Сообщения */}
              <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
                {messages.length === 0 && (
                  <div className="text-center text-white/30 text-xs mt-8">
                    Напишите вопрос — мы ответим как можно скорее 🎮
                  </div>
                )}
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender === "visitor" ? "justify-end" : "justify-start"}`}>
                    <div
                      className="max-w-[75%] px-3 py-2 rounded-xl font-body text-sm leading-relaxed"
                      style={{
                        background: msg.sender === "visitor"
                          ? "linear-gradient(135deg, #0066FF, #0044BB)"
                          : "rgba(255,255,255,0.08)",
                        color: "white",
                        borderRadius: msg.sender === "visitor" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                      }}
                    >
                      {msg.sender === "admin" && (
                        <div className="text-xs font-bold mb-1" style={{ color: "#FFB800" }}>CambeckSHOP</div>
                      )}
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Ввод */}
              <div className="px-3 py-3 border-t border-white/5 flex gap-2">
                <input
                  className="flex-1 px-3 py-2 rounded-xl font-body text-sm text-white outline-none"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
                  placeholder="Ваш вопрос..."
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMessage()}
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !text.trim()}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105 disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)" }}
                >
                  <Icon name="Send" size={15} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
