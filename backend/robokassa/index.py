"""
Robokassa интеграция для CambeckSHOP — создание платежа и обработка webhook.
"""
import json
import os
import hashlib
import psycopg2
from urllib.parse import urlencode

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

def make_signature_1(login, amount, inv_id, pass1):
    """Подпись для создания платежа: MD5(login:amount:inv_id:pass1)"""
    raw = f"{login}:{amount}:{inv_id}:{pass1}"
    return hashlib.md5(raw.encode()).hexdigest().upper()

def make_signature_2(amount, inv_id, pass2):
    """Подпись для проверки webhook: MD5(amount:inv_id:pass2)"""
    raw = f"{amount}:{inv_id}:{pass2}"
    return hashlib.md5(raw.encode()).hexdigest().upper()

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors(), "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")
    headers = event.get("headers") or {}
    auth_token = headers.get("X-Auth-Token", "")

    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    LOGIN = os.environ.get("ROBOKASSA_LOGIN", "cambeckshop")
    PASS1 = os.environ.get("ROBOKASSA_PASS1", "")
    PASS2 = os.environ.get("ROBOKASSA_PASS2", "")

    # POST create — создать платёж через Robokassa
    if method == "POST" and action == "create":
        item_id = body.get("item_id")
        item_name = body.get("item_name", "")
        price_usd = float(body.get("price_usd", 0))
        quantity = int(body.get("quantity", 1))
        usd_to_rub = float(body.get("usd_to_rub", 90))

        if not all([item_id, item_name, price_usd]):
            return err("Не все поля заполнены")

        amount_rub = round(price_usd * quantity * usd_to_rub, 2)

        # Получаем user_id из токена
        conn = get_conn()
        cur = conn.cursor()
        user_id = None
        if auth_token:
            cur.execute("SELECT user_id FROM user_sessions WHERE token = %s", (auth_token,))
            row = cur.fetchone()
            if row:
                user_id = str(row[0])

        # Создаём заказ в БД
        cur.execute(
            """INSERT INTO orders (item_id, item_name, price_usd, quantity, crypto_network, crypto_address, status, user_id)
               VALUES (%s, %s, %s, %s, 'CARD', 'robokassa', 'pending', %s) RETURNING id""",
            (item_id, item_name, price_usd * quantity, quantity, user_id)
        )
        order_id = str(cur.fetchone()[0])
        conn.commit()
        conn.close()

        # Robokassa использует числовой InvId — берём последние 8 символов UUID как число
        inv_id = abs(hash(order_id)) % 2147483647

        # Сохраняем маппинг inv_id -> order_id
        conn2 = get_conn()
        cur2 = conn2.cursor()
        cur2.execute("UPDATE orders SET tx_hash = %s WHERE id = %s", (str(inv_id), order_id))
        conn2.commit()
        conn2.close()

        signature = make_signature_1(LOGIN, f"{amount_rub:.2f}", inv_id, PASS1)

        # Формируем URL для редиректа на Robokassa
        params_rk = {
            "MerchantLogin": LOGIN,
            "OutSum": f"{amount_rub:.2f}",
            "InvId": inv_id,
            "Description": f"{item_name} x{quantity}",
            "SignatureValue": signature,
            "Culture": "ru",
            "Encoding": "utf-8",
        }
        pay_url = "https://auth.robokassa.ru/Merchant/Index.aspx?" + urlencode(params_rk)

        return ok({
            "order_id": order_id,
            "pay_url": pay_url,
            "amount_rub": amount_rub,
            "inv_id": inv_id,
        })

    # POST webhook — Robokassa отправляет ResultURL после оплаты
    if method == "POST" and action == "webhook":
        # Robokassa шлёт form-data, парсим из body
        raw_body = event.get("body", "")
        from urllib.parse import parse_qs
        form = parse_qs(raw_body)

        def get_field(key):
            vals = form.get(key, form.get(key.lower(), [""]))
            return vals[0] if vals else ""

        out_sum = get_field("OutSum")
        inv_id = get_field("InvId")
        signature = get_field("SignatureValue")

        if not out_sum or not inv_id:
            return {"statusCode": 400, "headers": cors(), "body": "bad request"}

        # Проверяем подпись
        expected = make_signature_2(out_sum, inv_id, PASS2)
        if signature.upper() != expected:
            return {"statusCode": 400, "headers": cors(), "body": "bad signature"}

        # Находим заказ по inv_id
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("SELECT id, item_id, quantity, status FROM orders WHERE tx_hash = %s", (inv_id,))
        row = cur.fetchone()

        if not row:
            conn.close()
            return {"statusCode": 404, "headers": cors(), "body": "order not found"}

        order_id = str(row[0])
        item_id = row[1]
        quantity = row[2]
        status = row[3]

        if status != "paid":
            # Выдаём аккаунты если есть
            cur.execute(
                "SELECT id FROM stock_accounts WHERE item_id = %s AND is_sold = FALSE LIMIT %s FOR UPDATE",
                (item_id, quantity)
            )
            acc_rows = cur.fetchall()
            if acc_rows:
                ids = [str(r[0]) for r in acc_rows]
                cur.execute(
                    "UPDATE stock_accounts SET is_sold = TRUE, order_id = %s, sold_at = NOW() WHERE id = ANY(%s::uuid[])",
                    (order_id, ids)
                )
            cur.execute("UPDATE orders SET status = 'paid', paid_at = NOW() WHERE id = %s", (order_id,))
            conn.commit()

        conn.close()
        return {"statusCode": 200, "headers": cors(), "body": f"OK{inv_id}"}

    return err("Неизвестный action", 404)
