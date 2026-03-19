import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const CHAT_URL = "https://functions.poehali.dev/5dc1e3a3-dd70-49b6-a971-dd798391a238";
const ORDERS_URL = "https://functions.poehali.dev/f852d147-eae1-4265-a94d-63d014c42231";
const AUTH_URL = "https://functions.poehali.dev/4d9f59a5-cbc5-418a-bb2f-849af25b8236";

function getVisitorId() {
  let id = localStorage.getItem("cambeck_visitor_id");
  if (!id) {
    id = "v_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("cambeck_visitor_id", id);
  }
  return id;
}

type Message = { id: string; sender: string; text: string; created_at: string; isBot?: boolean };
type PendingOrder = { order_id: string; item_name: string; amount_usd: number; created_at: string };
type ServerOrder = { order_id: string; item_name: string; amount_usd: number; quantity: number; network: string; status: string; created_at: string; paid_at?: string };

const BOT_DELAY = 700;

const FAQ: { keywords: string[]; answer: string }[] = [
  { keywords: ["оплат", "платить", "заплатить", "способ", "карт", "крипт", "криптовалют", "usdt", "ltc", "sol", "litecoin", "solana"], answer: "💳 Принимаем оплату криптовалютой: LTC, USDT (BEP20/TRC20), SOL.\n\nКарты пока временно недоступны — используй крипту. Это быстро и безопасно!" },
  { keywords: ["когда", "приде", "придёт", "ждать", "время", "долго", "быстро", "скоро", "сроки"], answer: "⚡ Товары из Steal a Brainrot выдаются автоматически сразу после подтверждения оплаты — обычно меньше минуты.\n\nДля других игр (Blade Ball, Rivals, Blox Fruits и др.) я передаю товар вручную через игру — как правило в течение нескольких минут после оплаты." },
  { keywords: ["как получить", "получить товар", "выдача", "выдают", "где товар", "где аккаунт"], answer: "📦 После оплаты:\n\n• Steal a Brainrot — аккаунт появится прямо на странице оплаты автоматически.\n• Другие игры — открой чат, я свяжусь с тобой и передам товар через друзья в игре." },
  { keywords: ["возврат", "верните", "вернуть", "отмен", "не пришло", "не получил", "обман", "скам"], answer: "🔄 Если товар не пришёл или возникла проблема — напиши здесь, разберёмся!\n\nВозврат возможен если товар не был активирован. Обратись к оператору, решим быстро." },
  { keywords: ["цен", "стоит", "сколько", "прайс", "дорого", "дешево", "скидк"], answer: "💰 Все цены указаны в каталоге на сайте в рублях (курс ЦБ РФ обновляется каждые 30 минут).\n\nМы стараемся держать лучшие цены на рынке! Если нашёл дешевле — напиши, обсудим." },
  { keywords: ["steal", "брейнрот", "brainrot", "токен", "trade token", "юнит", "lucky block", "мутац"], answer: "🎮 Steal a Brainrot — основная игра в нашем каталоге!\n\nЕсть: Trade Tokens, Lucky Blocks, редкие юниты с мутациями. Всё выдаётся автоматически после оплаты." },
  { keywords: ["blade ball", "блейд", "rivals", "ривалс", "blox fruit", "блокс", "escape tsunami", "tsunami"], answer: "🎮 Для игр Blade Ball, Rivals, Blox Fruits и Escape Tsunami — товары передаются через игру вручную.\n\nПосле оплаты открой чат, я добавлю тебя в друзья и передам товар!" },
  { keywords: ["аккаунт", "логин", "пароль", "вход", "войти", "регистрац"], answer: "👤 На сайте есть личный кабинет — там хранится история твоих заказов и полученные товары.\n\nЗарегистрируйся или войди через кнопку в правом верхнем углу сайта." },
  { keywords: ["безопасно", "безопасность", "доверят", "честн", "провер", "надёжн", "отзыв"], answer: "✅ КамбекШОП работает уже давно — более 15 000 продаж!\n\nВсе отзывы можно посмотреть на странице сайта и на EasyDonate. Оплата только после оформления заказа, без предоплаты вслепую." },
  { keywords: ["телеграм", "telegram", "контакт", "связаться", "написать", "поддержк"], answer: "📨 Связаться с нами:\n\n• Telegram: @TanksCrypto\n• Email: cambeckshop@gmail.com\n• Этот чат — отвечаем быстро!" },
  { keywords: ["курс", "доллар", "рубл", "конверт"], answer: "📊 Цены в каталоге автоматически пересчитываются по актуальному курсу ЦБ РФ — обновляется каждые 30 минут.\n\nЦена в рублях которую ты видишь — уже актуальная." },
  { keywords: ["сток", "наличи", "есть ли", "в наличии", "осталось", "количество"], answer: "📦 Актуальное наличие товаров обновляется каждую минуту прямо в каталоге.\n\nЕсли товара нет — кнопка будет серой с надписью \"Нет в наличии\". Можешь написать что именно нужно — найду для тебя!" },
  { keywords: ["привет", "здравствуй", "хай", "hello", "добрый", "приветствую"], answer: "Привет! 👋 Я бот КамбекШОП — помогу ответить на частые вопросы.\n\nСпроси про оплату, товары, сроки или что-то ещё. Если нужен живой оператор — нажми кнопку ниже!" },
  { keywords: ["спасибо", "благодар", "окей", "ок", "понял", "понятно", "ясно"], answer: "Всегда рад помочь! 😊 Если появятся ещё вопросы — пиши. Удачных покупок!" },
];

function getBotAnswer(input: string): string | null {
  const lower = input.toLowerCase();
  for (const faq of FAQ) {
    if (faq.keywords.some(kw => lower.includes(kw))) return faq.answer;
  }
  return null;
}

let botMsgId = 0;
function makeBotMsg(text: string): Message {
  return { id: `bot_${++botMsgId}`, sender: "bot", text, created_at: new Date().toISOString(), isBot: true };
}

export default function ChatWidget() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "orders">("chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [chatId, setChatId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [visitorName, setVisitorName] = useState("");
  const [nameEntered, setNameEntered] = useState(false);
  const [operatorRequested, setOperatorRequested] = useState(false);
  const [botTyping, setBotTyping] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null);

  const [orderLoading, setOrderLoading] = useState(false);
  const [serverOrders, setServerOrders] = useState<ServerOrder[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const visitorId = getVisitorId();

  useEffect(() => {
    const saved = localStorage.getItem("cambeck_visitor_name");
    if (saved) { setVisitorName(saved); setNameEntered(true); }
    // Загружаем незавершённый заказ
    const raw = localStorage.getItem("cambeck_pending_order");
    if (raw) {
      try { setPendingOrder(JSON.parse(raw)); } catch { /* ignore */ }
    }
  }, []);

  // Загружаем заказы с сервера при открытии вкладки Заказы
  useEffect(() => {
    if (open && activeTab === "orders") {
      fetchServerOrders();
    }
  }, [open, activeTab]);

  // Обновляем статус заказа каждые 15 сек если панель открыта
  useEffect(() => {
    if (!pendingOrder) return;
    checkOrderStatus();
    const interval = setInterval(checkOrderStatus, 15000);
    return () => clearInterval(interval);
  }, [pendingOrder, open]);

  useEffect(() => {
    if (!open || !nameEntered) return;
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [open, nameEntered, chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, botTyping]);

  useEffect(() => {
    if (open && nameEntered && messages.length === 0 && !operatorRequested && activeTab === "chat") {
      setTimeout(() => {
        setMessages([makeBotMsg(`Привет, ${visitorName}! 👋 Я бот КамбекШОП — отвечу на частые вопросы мгновенно.\n\nЕсли нужен живой оператор — нажми кнопку «Позвать оператора» под любым моим ответом.`)]);
      }, 400);
    }
  }, [open, nameEntered, activeTab]);

  async function fetchServerOrders() {
    const authToken = localStorage.getItem("cambeck_token");
    if (!authToken) return;
    setOrderLoading(true);
    try {
      const res = await fetch(`${AUTH_URL}?action=me`, {
        headers: { "X-Auth-Token": authToken },
      });
      const data = await res.json();
      if (data.orders) {
        // Показываем только оплаченные заказы
        setServerOrders(data.orders.filter((o: ServerOrder) => o.status === "paid"));
      }
    } catch { /* ignore */ }
    setOrderLoading(false);
  }

  async function checkOrderStatus() {
    if (!pendingOrder) return;
    setOrderLoading(true);
    try {
      const res = await fetch(`${ORDERS_URL}?action=status&order_id=${pendingOrder.order_id}`);
      const data = await res.json();
      if (data.status) {
        if (data.status === "paid") {
          localStorage.removeItem("cambeck_pending_order");
          setPendingOrder(null);
        }
      }
    } catch { /* ignore */ }
    setOrderLoading(false);
  }

  function openOrderChat(orderId: string) {
    setOpen(false);
    navigate(`/order-chat/${orderId}`);
  }

  async function fetchMessages() {
    if (operatorRequested) {
      const url = chatId
        ? `${CHAT_URL}?action=messages&chat_id=${chatId}`
        : `${CHAT_URL}?action=messages`;
      const res = await fetch(url, { headers: { "X-Visitor-Id": visitorId } });
      const data = await res.json();
      if (data.chat_id) setChatId(data.chat_id);
      if (data.messages) {
        setMessages(prev => {
          const botMsgs = prev.filter(m => m.isBot);
          const realIds = new Set(data.messages.map((m: Message) => m.id));
          const uniqueBots = botMsgs.filter(m => !realIds.has(m.id));
          return [...uniqueBots, ...data.messages].sort((a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        });
      }
    }
  }

  async function callOperator() {
    setOperatorRequested(true);
    setBotTyping(true);
    setTimeout(async () => {
      setBotTyping(false);
      const notifyMsg = `[Бот] Пользователь ${visitorName} запросил оператора`;
      const res = await fetch(`${CHAT_URL}?action=message`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Visitor-Id": visitorId },
        body: JSON.stringify({ text: notifyMsg, visitor_name: visitorName }),
      });
      const data = await res.json();
      if (data.chat_id) setChatId(data.chat_id);
      setMessages(prev => [...prev, makeBotMsg("✅ Оператор уже в пути! Обычно отвечаем в течение нескольких минут.\n\nПока ждёшь — можешь написать свой вопрос прямо здесь.")]);
    }, BOT_DELAY);
  }

  async function sendMessage() {
    if (!text.trim() || sending) return;
    const userText = text.trim();
    setSending(true);
    setText("");
    const userMsg: Message = { id: `user_${Date.now()}`, sender: "visitor", text: userText, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    if (operatorRequested) {
      const res = await fetch(`${CHAT_URL}?action=message`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Visitor-Id": visitorId },
        body: JSON.stringify({ text: userText, visitor_name: visitorName }),
      });
      const data = await res.json();
      if (data.chat_id) setChatId(data.chat_id);
      await fetchMessages();
      setSending(false);
      return;
    }
    setBotTyping(true);
    const answer = getBotAnswer(userText);
    setTimeout(() => {
      setBotTyping(false);
      setMessages(prev => [...prev, makeBotMsg(answer || "Хм, не совсем понял вопрос 🤔\n\nМогу позвать живого оператора — он точно поможет!")]);
      setSending(false);
    }, BOT_DELAY);
  }

  function handleNameSubmit() {
    if (!visitorName.trim()) return;
    localStorage.setItem("cambeck_visitor_name", visitorName.trim());
    setNameEntered(true);
  }

  const hasRealOperatorMessages = messages.some(m => m.sender === "admin");
  const orderAge = pendingOrder ? Math.floor((Date.now() - new Date(pendingOrder.created_at).getTime()) / 60000) : 0;

  return (
    <>
      {/* Кнопка открытия */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 animate-pulse-glow"
        style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)" }}
      >
        <Icon name={open ? "X" : "MessageCircle"} size={24} />
        {(pendingOrder || serverOrders.length > 0) && !open && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center text-xs font-bold text-black">
            {serverOrders.length + (pendingOrder ? 1 : 0)}
          </span>
        )}
      </button>

      {/* Панель — полноэкранная на мобиле, фиксированная на ПК */}
      {open && (
        <div
          className="fixed z-50 flex flex-col overflow-hidden animate-bounce-in
            inset-0 sm:inset-auto sm:bottom-24 sm:right-6 sm:w-80 sm:rounded-2xl"
          style={{
            background: "#161F2C",
            border: "1px solid rgba(0,102,255,0.3)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            height: undefined,
            maxHeight: "100dvh",
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #0066FF22, #0044BB22)" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #0066FF, #E8343A)" }}>C</div>
            <div className="flex-1 min-w-0">
              <div className="font-display font-bold text-white text-sm">КамбекШОП</div>
              <div className="text-xs text-white/40">
                {activeTab === "orders" ? "Мои заказы" : operatorRequested && hasRealOperatorMessages ? "Оператор онлайн" : operatorRequested ? "Ожидаем оператора..." : "Бот поддержки"}
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white transition-colors">
              <Icon name="X" size={18} />
            </button>
          </div>

          {/* Вкладки */}
          {(() => {
            const totalPending = serverOrders.length + (pendingOrder ? 1 : 0);
            return (
              <div className="flex border-b border-white/5 flex-shrink-0">
                {[
                  { id: "chat", label: "💬 Чат", badge: null },
                  { id: "orders", label: "📦 Заказы", badge: totalPending > 0 ? totalPending : null },
                ].map(t => (
                  <button key={t.id} onClick={() => setActiveTab(t.id as "chat" | "orders")}
                    className="flex-1 py-2.5 font-body text-sm font-bold relative transition-all"
                    style={{
                      color: activeTab === t.id ? "#4DA6FF" : "rgba(255,255,255,0.35)",
                      borderBottom: activeTab === t.id ? "2px solid #0066FF" : "2px solid transparent",
                    }}>
                    {t.label}
                    {t.badge && (
                      <span className="absolute top-1.5 right-6 w-4 h-4 rounded-full bg-yellow-400 text-xs font-bold text-black flex items-center justify-center">{t.badge}</span>
                    )}
                  </button>
                ))}
              </div>
            );
          })()}

          {/* ===== ВКЛАДКА ЗАКАЗЫ ===== */}
          {activeTab === "orders" && (
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {/* Не авторизован */}
              {!localStorage.getItem("cambeck_token") && (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-10">
                  <div className="text-4xl">🔐</div>
                  <p className="font-body text-white/50 text-sm">История заказов доступна после входа</p>
                  <p className="font-body text-white/30 text-xs">Войди чтобы видеть оплаченные покупки</p>
                  <Link to="/login" onClick={() => setOpen(false)}
                    className="mt-2 px-4 py-2 rounded-xl font-body font-bold text-sm text-white transition-all hover:scale-105"
                    style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)" }}>
                    Войти в аккаунт
                  </Link>
                </div>
              )}

              {/* Авторизован */}
              {localStorage.getItem("cambeck_token") && (
                <>
                  {orderLoading && serverOrders.length === 0 && (
                    <div className="flex justify-center py-8">
                      <div className="w-6 h-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                    </div>
                  )}

                  {!orderLoading && serverOrders.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-10">
                      <div className="text-4xl">📭</div>
                      <p className="font-body text-white/50 text-sm">Оплаченных заказов пока нет</p>
                      <p className="font-body text-white/30 text-xs">Здесь появятся твои покупки после оплаты</p>
                    </div>
                  )}

                  <div className="flex flex-col gap-3">
                    {serverOrders.map(order => {
                      const paidAt = order.paid_at ? new Date(order.paid_at).toLocaleDateString("ru") : "";
                      return (
                        <div key={order.order_id} className="rounded-2xl p-4" style={{ background: "rgba(0,176,111,0.07)", border: "1px solid rgba(0,176,111,0.2)" }}>
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="font-body font-bold text-white text-sm">{order.item_name} × {order.quantity}</div>
                              <div className="font-mono text-white/20 text-xs mt-0.5">#{order.order_id.slice(0,8).toUpperCase()}</div>
                            </div>
                            <span className="px-2 py-1 rounded-lg font-body font-bold text-xs flex-shrink-0"
                              style={{ background: "rgba(0,176,111,0.15)", color: "#00D080" }}>
                              ✅ Оплачен
                            </span>
                          </div>
                          {paidAt && <div className="font-body text-white/30 text-xs mb-3">{paidAt}</div>}
                          <button
                            onClick={() => openOrderChat(order.order_id)}
                            className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl font-body font-bold text-sm text-white transition-all hover:scale-105"
                            style={{ background: "rgba(0,102,255,0.2)", border: "1px solid rgba(0,102,255,0.3)" }}>
                            <Icon name="MessageCircle" size={14} />
                            Написать продавцу
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ===== ВКЛАДКА ЧАТ ===== */}
          {activeTab === "chat" && (
            <>
              {!nameEntered ? (
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
                  <button onClick={handleNameSubmit}
                    className="w-full py-2.5 rounded-xl font-body font-bold text-sm text-white transition-all hover:scale-105"
                    style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)" }}>
                    Начать чат
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
                    {messages.map((msg, idx) => (
                      <div key={msg.id}>
                        <div className={`flex ${msg.sender === "visitor" ? "justify-end" : "justify-start"}`}>
                          <div className="max-w-[78%] px-3 py-2 font-body text-sm leading-relaxed whitespace-pre-wrap"
                            style={{
                              background: msg.sender === "visitor" ? "linear-gradient(135deg, #0066FF, #0044BB)" : msg.sender === "admin" ? "rgba(255,184,0,0.12)" : "rgba(255,255,255,0.08)",
                              color: "white",
                              borderRadius: msg.sender === "visitor" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                            }}>
                            {(msg.sender === "bot" || msg.sender === "admin") && (
                              <div className="text-xs font-bold mb-1" style={{ color: msg.sender === "admin" ? "#FFB800" : "#4DA6FF" }}>
                                {msg.sender === "admin" ? "👤 Оператор" : "🤖 Бот"}
                              </div>
                            )}
                            {msg.text}
                          </div>
                        </div>
                        {msg.sender === "bot" && !operatorRequested && idx === messages.length - 1 && (
                          <div className="flex justify-start mt-1 ml-1">
                            <button onClick={callOperator}
                              className="text-xs font-body px-3 py-1.5 rounded-lg transition-all hover:scale-105"
                              style={{ background: "rgba(255,184,0,0.12)", color: "#FFB800", border: "1px solid rgba(255,184,0,0.2)" }}>
                              👤 Позвать оператора
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    {botTyping && (
                      <div className="flex justify-start">
                        <div className="px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1 items-center" style={{ background: "rgba(255,255,255,0.08)" }}>
                          <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    )}
                    <div ref={bottomRef} />
                  </div>

                  <div className="px-3 py-3 border-t border-white/5 flex gap-2 flex-shrink-0">
                    <input
                      className="flex-1 px-3 py-2 rounded-xl font-body text-sm text-white outline-none"
                      style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
                      placeholder={operatorRequested ? "Напишите оператору..." : "Задайте вопрос..."}
                      value={text}
                      onChange={e => setText(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && sendMessage()}
                    />
                    <button onClick={sendMessage} disabled={sending || !text.trim()}
                      className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105 disabled:opacity-40"
                      style={{ background: "linear-gradient(135deg, #0066FF, #0044BB)" }}>
                      <Icon name="Send" size={15} />
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}