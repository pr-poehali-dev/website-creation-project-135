"""
Система авторизации CambeckSHOP — регистрация, вход, профиль, история заказов.
"""
import json
import os
import hashlib
import secrets
import psycopg2

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def cors():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
    }

def ok(data):
    return {"statusCode": 200, "headers": {**cors(), "Content-Type": "application/json"}, "body": json.dumps(data, default=str)}

def err(msg, code=400):
    return {"statusCode": code, "headers": {**cors(), "Content-Type": "application/json"}, "body": json.dumps({"error": msg})}

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def make_token(user_id: str) -> str:
    return hashlib.sha256(f"{user_id}:{secrets.token_hex(16)}".encode()).hexdigest()

def get_user_by_token(cur, token: str):
    cur.execute("SELECT id, username, email FROM users WHERE password_hash LIKE %s", (f"%{token[:8]}%",))
    # Используем отдельную таблицу сессий через простой механизм
    return None

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors(), "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")
    headers = event.get("headers") or {}
    token = headers.get("X-Auth-Token", "")

    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    # POST register
    if method == "POST" and action == "register":
        username = body.get("username", "").strip()
        email = body.get("email", "").strip().lower()
        password = body.get("password", "")

        if not username or not email or not password:
            return err("Заполните все поля")
        if len(username) < 3:
            return err("Имя пользователя минимум 3 символа")
        if len(password) < 6:
            return err("Пароль минимум 6 символов")
        if "@" not in email:
            return err("Некорректный email")

        conn = get_conn()
        cur = conn.cursor()

        cur.execute("SELECT id FROM users WHERE email = %s OR username = %s", (email, username))
        if cur.fetchone():
            conn.close()
            return err("Пользователь с таким email или именем уже существует")

        pw_hash = hash_password(password)
        session_token = secrets.token_hex(32)
        # Храним токен сессии в отдельном поле (добавим колонку)
        cur.execute(
            "INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s) RETURNING id, username, email, created_at",
            (username, email, pw_hash)
        )
        row = cur.fetchone()
        user_id = str(row[0])

        # Сохраняем токен сессии
        session_token = hashlib.sha256(f"{user_id}:{secrets.token_hex(16)}".encode()).hexdigest()
        cur.execute("UPDATE users SET last_login = NOW() WHERE id = %s", (user_id,))
        # Храним токен как отдельную запись в sessions
        cur.execute("""
            INSERT INTO user_sessions (user_id, token) VALUES (%s, %s)
        """, (user_id, session_token))

        conn.commit()
        conn.close()

        return ok({
            "token": session_token,
            "user": {"id": user_id, "username": row[1], "email": row[2]}
        })

    # POST login
    if method == "POST" and action == "login":
        login = body.get("login", "").strip().lower()
        password = body.get("password", "")

        if not login or not password:
            return err("Заполните все поля")

        conn = get_conn()
        cur = conn.cursor()
        pw_hash = hash_password(password)

        cur.execute(
            "SELECT id, username, email FROM users WHERE (email = %s OR username = %s) AND password_hash = %s",
            (login, login, pw_hash)
        )
        row = cur.fetchone()
        if not row:
            conn.close()
            return err("Неверный логин или пароль", 401)

        user_id = str(row[0])
        session_token = hashlib.sha256(f"{user_id}:{secrets.token_hex(16)}".encode()).hexdigest()

        cur.execute("UPDATE users SET last_login = NOW() WHERE id = %s", (user_id,))
        cur.execute("INSERT INTO user_sessions (user_id, token) VALUES (%s, %s)", (user_id, session_token))
        conn.commit()
        conn.close()

        return ok({
            "token": session_token,
            "user": {"id": user_id, "username": row[1], "email": row[2]}
        })

    # GET me — получить текущего пользователя
    if method == "GET" and action == "me":
        if not token:
            return err("Нет токена", 401)

        conn = get_conn()
        cur = conn.cursor()
        cur.execute("""
            SELECT u.id, u.username, u.email, u.created_at
            FROM users u
            JOIN user_sessions s ON s.user_id = u.id
            WHERE s.token = %s
        """, (token,))
        row = cur.fetchone()
        if not row:
            conn.close()
            return err("Сессия не найдена", 401)

        user_id = str(row[0])

        # Получаем историю заказов
        cur.execute("""
            SELECT id, item_name, price_usd, quantity, crypto_network, status, created_at, paid_at
            FROM orders WHERE user_id = %s ORDER BY created_at DESC LIMIT 50
        """, (user_id,))
        orders = [{
            "order_id": str(r[0]), "item_name": r[1], "amount_usd": float(r[2]),
            "quantity": r[3], "network": r[4], "status": r[5],
            "created_at": r[6], "paid_at": r[7]
        } for r in cur.fetchall()]

        # Для оплаченных заказов — полученные аккаунты
        paid_items = []
        for o in orders:
            if o["status"] == "paid":
                cur.execute("SELECT credentials FROM stock_accounts WHERE order_id = %s", (o["order_id"],))
                accs = [r[0] for r in cur.fetchall()]
                if accs:
                    paid_items.append({"order_id": o["order_id"], "item_name": o["item_name"], "accounts": accs})

        conn.close()
        return ok({
            "user": {"id": user_id, "username": row[1], "email": row[2], "created_at": row[3]},
            "orders": orders,
            "paid_items": paid_items,
        })

    # POST logout — деактивируем сессию
    if method == "POST" and action == "logout":
        if not token:
            return ok({"success": True})
        conn = get_conn()
        cur = conn.cursor()
        # Помечаем сессию как истёкшую через обновление токена
        cur.execute("UPDATE user_sessions SET token = 'expired_' || id::text WHERE token = %s", (token,))
        conn.commit()
        conn.close()
        return ok({"success": True})

    return err("Неизвестный action", 404)