"""
Чат поддержки CambeckSHOP.
- Один чат на visitor_id (переиспользуем открытый)
- Автозакрытие через 15 мин без сообщений от пользователя
- Типы чатов: support / order
"""
import json
import os
import psycopg2
from datetime import datetime, timezone

ADMIN_LOGIN = "Cambeck"
ADMIN_PASSWORD = "M23092009C"
ADMIN_TOKEN = "admin_Cambeck_token_cambeck"
AUTO_CLOSE_MINUTES = 15

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def schema():
    return os.environ.get("MAIN_DB_SCHEMA", "public")

def cors_headers():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Visitor-Id, X-Admin-Token",
    }

def ok(data):
    return {"statusCode": 200, "headers": {**cors_headers(), "Content-Type": "application/json"}, "body": json.dumps(data, default=str)}

def err(msg, code=400):
    return {"statusCode": code, "headers": {**cors_headers(), "Content-Type": "application/json"}, "body": json.dumps({"error": msg})}

def auto_close_inactive(cur, s):
    """Закрываем чаты где нет сообщений от пользователя более AUTO_CLOSE_MINUTES минут"""
    cur.execute(f"""
        UPDATE {s}.chats SET status = 'closed'
        WHERE status = 'open'
        AND (
            SELECT MAX(created_at) FROM {s}.messages
            WHERE chat_id = {s}.chats.id AND sender = 'visitor'
        ) < NOW() - INTERVAL '{AUTO_CLOSE_MINUTES} minutes'
        AND (
            SELECT COUNT(*) FROM {s}.messages WHERE chat_id = {s}.chats.id AND sender = 'visitor'
        ) > 0
    """)

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers(), "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")
    headers_in = event.get("headers") or {}
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    token = headers_in.get("X-Admin-Token", "")
    is_admin = token == ADMIN_TOKEN
    s = schema()

    # POST login
    if method == "POST" and action == "login":
        if body.get("login") == ADMIN_LOGIN and body.get("password") == ADMIN_PASSWORD:
            return ok({"token": ADMIN_TOKEN})
        return err("Неверный логин или пароль", 401)

    # GET chats — с фильтром по типу
    if method == "GET" and action == "chats":
        if not is_admin:
            return err("Нет доступа", 403)
        conn = get_conn()
        cur = conn.cursor()
        auto_close_inactive(cur, s)
        conn.commit()
        chat_type = params.get("chat_type", "")  # support / order / "" (все)
        type_filter = "AND c.chat_type = %s" if chat_type else ""
        type_val = (chat_type,) if chat_type else ()
        cur.execute(f"""
            SELECT c.id, c.visitor_id, c.visitor_name, c.status, c.created_at, c.updated_at,
                   c.chat_type,
                   (SELECT text FROM {s}.messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
                   (SELECT COUNT(*) FROM {s}.messages WHERE chat_id = c.id AND sender = 'visitor') as msg_count
            FROM {s}.chats c
            WHERE 1=1 {type_filter}
            ORDER BY c.updated_at DESC
        """, type_val)
        rows = cur.fetchall()
        chats = [{"id": str(r[0]), "visitor_id": r[1], "visitor_name": r[2], "status": r[3],
                  "created_at": r[4], "updated_at": r[5], "chat_type": r[6],
                  "last_message": r[7], "msg_count": int(r[8])} for r in rows]
        conn.close()
        return ok({"chats": chats})

    # GET messages
    if method == "GET" and action == "messages":
        chat_id = params.get("chat_id")
        visitor_id = headers_in.get("X-Visitor-Id", "")
        conn = get_conn()
        cur = conn.cursor()
        if not chat_id:
            if not visitor_id:
                conn.close()
                return err("Нет visitor_id")
            # Берём последний открытый чат этого посетителя
            cur.execute(f"SELECT id, status FROM {s}.chats WHERE visitor_id = %s ORDER BY updated_at DESC LIMIT 1", (visitor_id,))
            row = cur.fetchone()
            if not row:
                conn.close()
                return ok({"chat_id": None, "messages": [], "chat_status": None})
            chat_id = str(row[0])
            chat_status = row[1]
        else:
            cur.execute(f"SELECT status FROM {s}.chats WHERE id = %s", (chat_id,))
            r = cur.fetchone()
            chat_status = r[0] if r else None
        cur.execute(f"SELECT id, sender, text, created_at FROM {s}.messages WHERE chat_id = %s ORDER BY created_at ASC", (chat_id,))
        rows = cur.fetchall()
        messages = [{"id": str(r[0]), "sender": r[1], "text": r[2], "created_at": r[3]} for r in rows]
        conn.close()
        return ok({"chat_id": chat_id, "messages": messages, "chat_status": chat_status})

    # POST message
    if method == "POST" and action == "message":
        text = body.get("text", "").strip()
        if not text:
            return err("Пустое сообщение")
        conn = get_conn()
        cur = conn.cursor()
        if is_admin:
            chat_id = body.get("chat_id")
            if not chat_id:
                conn.close()
                return err("Нет chat_id")
            sender = "admin"
        else:
            visitor_id = headers_in.get("X-Visitor-Id", "")
            visitor_name = body.get("visitor_name", "Гость")
            if not visitor_id:
                conn.close()
                return err("Нет visitor_id")
            # Ищем открытый чат поддержки — переиспользуем его
            cur.execute(f"""
                SELECT id FROM {s}.chats
                WHERE visitor_id = %s AND status = 'open' AND chat_type = 'support'
                ORDER BY updated_at DESC LIMIT 1
            """, (visitor_id,))
            row = cur.fetchone()
            if not row:
                # Создаём новый чат поддержки
                cur.execute(f"INSERT INTO {s}.chats (visitor_id, visitor_name, status, chat_type) VALUES (%s, %s, 'open', 'support') RETURNING id", (visitor_id, visitor_name))
                chat_id = str(cur.fetchone()[0])
            else:
                chat_id = str(row[0])
            sender = "visitor"

        cur.execute(f"INSERT INTO {s}.messages (chat_id, sender, text) VALUES (%s, %s, %s) RETURNING id, created_at", (chat_id, sender, text))
        msg_id, created_at = cur.fetchone()
        cur.execute(f"UPDATE {s}.chats SET updated_at = NOW(), last_message = %s WHERE id = %s", (text[:200], chat_id))
        conn.commit()
        conn.close()
        return ok({"id": str(msg_id), "chat_id": chat_id, "sender": sender, "text": text, "created_at": created_at})

    # POST close
    if method == "POST" and action == "close":
        if not is_admin:
            return err("Нет доступа", 403)
        chat_id = body.get("chat_id")
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"UPDATE {s}.chats SET status = 'closed' WHERE id = %s", (chat_id,))
        conn.commit()
        conn.close()
        return ok({"success": True})

    return err("Неизвестный action", 404)
