"""
Чат поддержки CambeckSHOP — основной обработчик сообщений и чатов.
Методы: GET /messages, POST /message, GET /chats, POST /close, POST /login
"""
import json
import os
import psycopg2
from datetime import datetime

ADMIN_LOGIN = "Cambeck"
ADMIN_PASSWORD = "M23092009C"
ADMIN_TOKEN = "admin_Cambeck_token_cambeck"

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

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

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers(), "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")
    headers = event.get("headers") or {}
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    token = headers.get("X-Admin-Token", "")
    is_admin = token == ADMIN_TOKEN

    # POST login — не требует DB
    if method == "POST" and action == "login":
        if body.get("login") == ADMIN_LOGIN and body.get("password") == ADMIN_PASSWORD:
            return ok({"token": ADMIN_TOKEN})
        return err("Неверный логин или пароль", 401)

    # GET chats
    if method == "GET" and action == "chats":
        if not is_admin:
            return err("Нет доступа", 403)
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("""
            SELECT c.id, c.visitor_id, c.visitor_name, c.status, c.created_at, c.updated_at,
                   (SELECT text FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
                   (SELECT COUNT(*) FROM messages WHERE chat_id = c.id AND sender = 'visitor') as msg_count
            FROM chats c ORDER BY c.updated_at DESC
        """)
        rows = cur.fetchall()
        chats = [{"id": str(r[0]), "visitor_id": r[1], "visitor_name": r[2], "status": r[3],
                  "created_at": r[4], "updated_at": r[5], "last_message": r[6], "msg_count": int(r[7])} for r in rows]
        conn.close()
        return ok({"chats": chats})

    # GET messages
    if method == "GET" and action == "messages":
        chat_id = params.get("chat_id")
        visitor_id = headers.get("X-Visitor-Id", "")
        conn = get_conn()
        cur = conn.cursor()
        if not chat_id:
            if not visitor_id:
                conn.close()
                return err("Нет visitor_id")
            cur.execute("SELECT id FROM chats WHERE visitor_id = %s ORDER BY created_at DESC LIMIT 1", (visitor_id,))
            row = cur.fetchone()
            if not row:
                conn.close()
                return ok({"chat_id": None, "messages": []})
            chat_id = str(row[0])
        cur.execute("SELECT id, sender, text, created_at FROM messages WHERE chat_id = %s ORDER BY created_at ASC", (chat_id,))
        rows = cur.fetchall()
        messages = [{"id": str(r[0]), "sender": r[1], "text": r[2], "created_at": r[3]} for r in rows]
        conn.close()
        return ok({"chat_id": chat_id, "messages": messages})

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
            visitor_id = headers.get("X-Visitor-Id", "")
            visitor_name = body.get("visitor_name", "Гость")
            if not visitor_id:
                conn.close()
                return err("Нет visitor_id")
            cur.execute("SELECT id FROM chats WHERE visitor_id = %s ORDER BY created_at DESC LIMIT 1", (visitor_id,))
            row = cur.fetchone()
            if not row:
                cur.execute("INSERT INTO chats (visitor_id, visitor_name) VALUES (%s, %s) RETURNING id", (visitor_id, visitor_name))
                chat_id = str(cur.fetchone()[0])
            else:
                chat_id = str(row[0])
            sender = "visitor"
        cur.execute("INSERT INTO messages (chat_id, sender, text) VALUES (%s, %s, %s) RETURNING id, created_at", (chat_id, sender, text))
        msg_id, created_at = cur.fetchone()
        cur.execute("UPDATE chats SET updated_at = NOW() WHERE id = %s", (chat_id,))
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
        cur.execute("UPDATE chats SET status = 'closed' WHERE id = %s", (chat_id,))
        conn.commit()
        conn.close()
        return ok({"success": True})

    return err("Неизвестный action", 404)
