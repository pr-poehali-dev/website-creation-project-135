"""
Чат покупатель ↔ продавец (CambeckSHOP).
Отдельно от чата поддержки. Привязан к заказу.
Покупатель авторизован через X-Auth-Token, продавец через X-Admin-Token.
"""
import json
import os
import psycopg2

ADMIN_TOKEN = "admin_Cambeck_token_cambeck"


def send_telegram(text: str):
    import requests as req
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID", "")
    if not token or not chat_id:
        return
    try:
        req.post(
            f"https://api.telegram.org/bot{token}/sendMessage",
            json={"chat_id": chat_id, "text": text, "parse_mode": "HTML"},
            timeout=5,
        )
    except Exception:
        pass


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def schema():
    return os.environ.get("MAIN_DB_SCHEMA", "public")


def cors_headers():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token, X-Admin-Token",
    }


def ok(data):
    return {
        "statusCode": 200,
        "headers": {**cors_headers(), "Content-Type": "application/json"},
        "body": json.dumps(data, default=str),
    }


def err(msg, code=400):
    return {
        "statusCode": code,
        "headers": {**cors_headers(), "Content-Type": "application/json"},
        "body": json.dumps({"error": msg}),
    }


def get_user_from_token(cur, s, token):
    cur.execute(
        f"SELECT u.id, u.username FROM {s}.users u JOIN {s}.user_sessions us ON us.user_id = u.id WHERE us.token = %s LIMIT 1",
        (token,),
    )
    return cur.fetchone()


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

    auth_token = headers_in.get("X-Auth-Token", "")
    admin_token = headers_in.get("X-Admin-Token", "")
    is_admin = admin_token == ADMIN_TOKEN
    s = schema()

    # POST open — открыть/получить чат по заказу (покупатель)
    if method == "POST" and action == "open":
        if not auth_token:
            return err("Нет авторизации", 401)
        order_id = body.get("order_id")
        if not order_id:
            return err("order_id обязателен")

        conn = get_conn()
        cur = conn.cursor()

        user = get_user_from_token(cur, s, auth_token)
        if not user:
            conn.close()
            return err("Токен недействителен", 401)
        user_id, username = user

        # Проверяем что заказ принадлежит пользователю
        cur.execute(
            f"SELECT id FROM {s}.orders WHERE id = %s AND user_id = %s AND status = 'paid'",
            (order_id, user_id),
        )
        if not cur.fetchone():
            conn.close()
            return err("Заказ не найден или не оплачен", 404)

        # Ищем существующий чат
        cur.execute(
            f"SELECT id FROM {s}.seller_chats WHERE order_id = %s AND user_id = %s LIMIT 1",
            (order_id, user_id),
        )
        row = cur.fetchone()
        if row:
            chat_id = row[0]
        else:
            cur.execute(
                f"INSERT INTO {s}.seller_chats (order_id, user_id, username, status) VALUES (%s, %s, %s, 'open') RETURNING id",
                (order_id, user_id, username),
            )
            chat_id = cur.fetchone()[0]
            conn.commit()

        conn.close()
        return ok({"chat_id": str(chat_id)})

    # GET messages — получить сообщения (покупатель или продавец)
    if method == "GET" and action == "messages":
        chat_id = params.get("chat_id")
        if not chat_id:
            return err("chat_id обязателен")

        conn = get_conn()
        cur = conn.cursor()

        if is_admin:
            # Отмечаем сообщения покупателя как прочитанные
            cur.execute(
                f"UPDATE {s}.seller_messages SET is_read = TRUE WHERE chat_id = %s AND sender = 'buyer' AND is_read = FALSE",
                (chat_id,),
            )
            conn.commit()
        else:
            if not auth_token:
                conn.close()
                return err("Нет авторизации", 401)
            user = get_user_from_token(cur, s, auth_token)
            if not user:
                conn.close()
                return err("Токен недействителен", 401)
            user_id = user[0]
            cur.execute(
                f"SELECT user_id FROM {s}.seller_chats WHERE id = %s",
                (chat_id,),
            )
            row = cur.fetchone()
            if not row or row[0] != user_id:
                conn.close()
                return err("Нет доступа", 403)
            # Отмечаем сообщения продавца как прочитанные
            cur.execute(
                f"UPDATE {s}.seller_messages SET is_read = TRUE WHERE chat_id = %s AND sender = 'seller' AND is_read = FALSE",
                (chat_id,),
            )
            conn.commit()

        cur.execute(
            f"SELECT id, sender, text, created_at, is_read FROM {s}.seller_messages WHERE chat_id = %s ORDER BY created_at ASC",
            (chat_id,),
        )
        rows = cur.fetchall()
        messages = [
            {"id": str(r[0]), "sender": r[1], "text": r[2], "created_at": r[3], "is_read": r[4]}
            for r in rows
        ]

        # Получаем инфо о чате
        cur.execute(
            f"SELECT c.status, c.username, c.order_id, c.updated_at FROM {s}.seller_chats c WHERE c.id = %s",
            (chat_id,),
        )
        chat_row = cur.fetchone()
        chat_info = {}
        if chat_row:
            chat_info = {
                "status": chat_row[0],
                "username": chat_row[1],
                "order_id": str(chat_row[2]),
                "updated_at": chat_row[3],
            }

        conn.close()
        return ok({"messages": messages, "chat": chat_info})

    # POST send — отправить сообщение
    if method == "POST" and action == "send":
        chat_id = body.get("chat_id")
        text = (body.get("text") or "").strip()
        if not chat_id or not text:
            return err("chat_id и text обязательны")
        if len(text) > 2000:
            return err("Слишком длинное сообщение")

        conn = get_conn()
        cur = conn.cursor()

        if is_admin:
            sender = "seller"
        else:
            if not auth_token:
                conn.close()
                return err("Нет авторизации", 401)
            user = get_user_from_token(cur, s, auth_token)
            if not user:
                conn.close()
                return err("Токен недействителен", 401)
            user_id = user[0]
            cur.execute(
                f"SELECT user_id FROM {s}.seller_chats WHERE id = %s",
                (chat_id,),
            )
            row = cur.fetchone()
            if not row or row[0] != user_id:
                conn.close()
                return err("Нет доступа", 403)
            sender = "buyer"

        # Получаем инфо о чате для уведомления
        cur.execute(
            f"SELECT username, order_id FROM {s}.seller_chats WHERE id = %s",
            (chat_id,),
        )
        chat_info_row = cur.fetchone()

        cur.execute(
            f"INSERT INTO {s}.seller_messages (chat_id, sender, text) VALUES (%s, %s, %s) RETURNING id, created_at",
            (chat_id, sender, text),
        )
        msg_row = cur.fetchone()
        cur.execute(
            f"UPDATE {s}.seller_chats SET updated_at = NOW(), status = 'open' WHERE id = %s",
            (chat_id,),
        )
        conn.commit()
        conn.close()

        # Уведомление в Telegram только при сообщении от покупателя
        if sender == "buyer" and chat_info_row:
            username = chat_info_row[0]
            order_id = str(chat_info_row[1])
            send_telegram(
                f"💬 <b>Новое сообщение от покупателя!</b>\n\n"
                f"👤 {username}\n"
                f"🔑 Заказ #{order_id[:8].upper()}\n\n"
                f"<i>{text[:200]}</i>"
            )

        return ok({"id": str(msg_row[0]), "created_at": msg_row[1], "sender": sender, "text": text})

    # GET chats — список чатов для продавца
    if method == "GET" and action == "chats":
        if not is_admin:
            return err("Нет доступа", 403)

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"""
            SELECT
                c.id, c.order_id, c.user_id, c.username, c.status,
                c.created_at, c.updated_at,
                (SELECT text FROM {s}.seller_messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_msg,
                (SELECT COUNT(*) FROM {s}.seller_messages WHERE chat_id = c.id AND sender = 'buyer' AND is_read = FALSE) as unread
            FROM {s}.seller_chats c
            ORDER BY c.updated_at DESC
            """,
        )
        rows = cur.fetchall()
        chats = [
            {
                "id": str(r[0]),
                "order_id": str(r[1]),
                "user_id": str(r[2]),
                "username": r[3],
                "status": r[4],
                "created_at": r[5],
                "updated_at": r[6],
                "last_message": r[7],
                "unread": int(r[8]),
            }
            for r in rows
        ]
        conn.close()
        return ok({"chats": chats})

    # GET chat_by_order — получить chat_id по order_id (покупатель)
    if method == "GET" and action == "chat_by_order":
        order_id = params.get("order_id")
        if not order_id:
            return err("order_id обязателен")
        if not auth_token:
            return err("Нет авторизации", 401)

        conn = get_conn()
        cur = conn.cursor()
        user = get_user_from_token(cur, s, auth_token)
        if not user:
            conn.close()
            return err("Токен недействителен", 401)
        user_id = user[0]

        cur.execute(
            f"SELECT id FROM {s}.seller_chats WHERE order_id = %s AND user_id = %s LIMIT 1",
            (order_id, user_id),
        )
        row = cur.fetchone()
        conn.close()
        if row:
            return ok({"chat_id": str(row[0])})
        return ok({"chat_id": None})

    return err("Неизвестное действие", 404)