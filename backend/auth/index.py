"""
Система авторизации CambeckSHOP — регистрация, вход, профиль, история заказов, восстановление пароля. v2
"""
import json
import os
import hashlib
import secrets
import smtplib
import psycopg2
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

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

def send_reset_email(to_email: str, reset_url: str):
    smtp_host = os.environ.get("SMTP_HOST", "")
    smtp_port = int(os.environ.get("SMTP_PORT", "587"))
    smtp_user = os.environ.get("SMTP_USER", "")
    smtp_pass = os.environ.get("SMTP_PASSWORD", "")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Восстановление пароля — КамбекШОП"
    msg["From"] = smtp_user
    msg["To"] = to_email

    html = f"""
    <html><body style="background:#0F1923;font-family:Arial,sans-serif;padding:32px">
      <div style="max-width:480px;margin:0 auto;background:#161F2C;border-radius:16px;padding:32px;border:1px solid rgba(255,255,255,0.08)">
        <div style="text-align:center;margin-bottom:24px">
          <div style="display:inline-flex;align-items:center;gap:8px">
            <div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#0066FF,#E8343A);display:inline-block;text-align:center;line-height:40px;color:white;font-weight:bold;font-size:18px">C</div>
            <span style="color:white;font-size:20px;font-weight:bold">КамбекШОП</span>
          </div>
        </div>
        <h2 style="color:white;text-align:center;margin-bottom:8px">Сброс пароля</h2>
        <p style="color:rgba(255,255,255,0.5);text-align:center;margin-bottom:28px">Нажми кнопку ниже, чтобы задать новый пароль. Ссылка действительна 1 час.</p>
        <div style="text-align:center;margin-bottom:24px">
          <a href="{reset_url}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#0066FF,#0044BB);color:white;font-weight:bold;text-decoration:none;border-radius:12px;font-size:16px">
            Сбросить пароль
          </a>
        </div>
        <p style="color:rgba(255,255,255,0.3);text-align:center;font-size:12px">Если ты не запрашивал сброс пароля — просто проигнорируй это письмо.</p>
        <p style="color:rgba(255,255,255,0.2);text-align:center;font-size:11px;margin-top:8px">Или скопируй ссылку: <a href="{reset_url}" style="color:#4A9EFF">{reset_url}</a></p>
      </div>
    </body></html>
    """
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_user, to_email, msg.as_string())

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
        cur.execute(
            "INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s) RETURNING id, username, email, created_at",
            (username, email, pw_hash)
        )
        row = cur.fetchone()
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

    # POST login
    if method == "POST" and action == "login":
        login_val = body.get("login", "").strip().lower()
        password = body.get("password", "")

        if not login_val or not password:
            return err("Заполните все поля")

        conn = get_conn()
        cur = conn.cursor()
        pw_hash = hash_password(password)

        cur.execute(
            "SELECT id, username, email FROM users WHERE (email = %s OR username = %s) AND password_hash = %s",
            (login_val, login_val, pw_hash)
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

        schema = os.environ.get("MAIN_DB_SCHEMA", "public")
        cur.execute(f"""
            SELECT id, item_name, price_usd, quantity, crypto_network, status, created_at, paid_at, game
            FROM {schema}.orders WHERE user_id = %s ORDER BY created_at DESC LIMIT 50
        """, (user_id,))
        orders = [{
            "order_id": str(r[0]), "item_name": r[1], "amount_usd": float(r[2]),
            "quantity": r[3], "network": r[4], "status": r[5],
            "created_at": r[6], "paid_at": r[7], "game": r[8]
        } for r in cur.fetchall()]

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

    # POST logout
    if method == "POST" and action == "logout":
        if not token:
            return ok({"success": True})
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("UPDATE user_sessions SET token = 'expired_' || id::text WHERE token = %s", (token,))
        conn.commit()
        conn.close()
        return ok({"success": True})

    # POST request_reset — запросить письмо для сброса пароля
    if method == "POST" and action == "request_reset":
        email = body.get("email", "").strip().lower()
        if not email or "@" not in email:
            return err("Введите корректный email")

        conn = get_conn()
        cur = conn.cursor()
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        row = cur.fetchone()

        if not row:
            conn.close()
            return ok({"success": True})

        user_id = str(row[0])
        reset_token = secrets.token_hex(32)

        cur.execute("""
            INSERT INTO password_reset_tokens (user_id, token)
            VALUES (%s, %s)
        """, (user_id, reset_token))
        conn.commit()
        conn.close()

        site_url = os.environ.get("SITE_URL", "https://cambeckshop.ru")
        reset_url = f"{site_url}/reset-password?token={reset_token}"

        try:
            send_reset_email(email, reset_url)
        except Exception:
            pass

        return ok({"success": True})

    # POST reset_password — установить новый пароль по токену
    if method == "POST" and action == "reset_password":
        reset_token = body.get("token", "").strip()
        new_password = body.get("password", "")

        if not reset_token:
            return err("Токен не указан")
        if len(new_password) < 6:
            return err("Пароль минимум 6 символов")

        conn = get_conn()
        cur = conn.cursor()
        cur.execute("""
            SELECT user_id FROM password_reset_tokens
            WHERE token = %s AND used = FALSE AND expires_at > NOW()
        """, (reset_token,))
        row = cur.fetchone()
        if not row:
            conn.close()
            return err("Ссылка недействительна или истекла. Запросите новую.", 400)

        user_id = str(row[0])
        pw_hash = hash_password(new_password)

        cur.execute("UPDATE users SET password_hash = %s WHERE id = %s", (pw_hash, user_id))
        cur.execute("UPDATE password_reset_tokens SET used = TRUE WHERE token = %s", (reset_token,))
        conn.commit()
        conn.close()

        return ok({"success": True})

    return err("Неизвестный action", 404)