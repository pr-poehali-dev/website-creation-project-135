"""
ЮMoney — генерация ссылки на оплату (форма) и приём webhook-уведомлений.
Поддерживает оплату с банковской карты и по СБП через кошелёк ЮMoney.
"""
import hashlib
import json
import os
from urllib.parse import urlencode
from datetime import datetime

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def schema():
    return os.environ.get("MAIN_DB_SCHEMA", "public")


def ok(data):
    return {"statusCode": 200, "headers": CORS_HEADERS, "body": json.dumps(data, default=str)}


def err(msg, code=400):
    return {"statusCode": code, "headers": CORS_HEADERS, "body": json.dumps({"error": msg})}


def verify_notification(params: dict, secret: str) -> bool:
    """Проверяем подпись ЮMoney-уведомления через SHA-1"""
    keys = [
        "notification_type", "operation_id", "amount",
        "currency", "datetime", "sender", "codepro",
        secret, "label"
    ]
    values = [
        params.get("notification_type", ""),
        params.get("operation_id", ""),
        params.get("amount", ""),
        params.get("currency", ""),
        params.get("datetime", ""),
        params.get("sender", ""),
        params.get("codepro", ""),
        secret,
        params.get("label", ""),
    ]
    check_str = "&".join(values)
    expected = hashlib.sha1(check_str.encode("utf-8")).hexdigest()
    return expected == params.get("sha1_hash", "")


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    qs = event.get("queryStringParameters") or {}
    action = qs.get("action", "")

    # ── POST /yoomoney?action=create — создать ссылку на оплату ──────────────
    if method == "POST" and action == "create":
        body = json.loads(event.get("body") or "{}")
        order_id = body.get("order_id", "").strip()
        if not order_id:
            return err("order_id required")

        conn = get_conn()
        cur = conn.cursor()
        S = schema()

        cur.execute(
            f"SELECT id, item_name, price_usd, quantity, status FROM {S}.orders WHERE id = %s",
            (order_id,),
        )
        row = cur.fetchone()
        if not row:
            conn.close()
            return err("Заказ не найден", 404)

        _, item_name, price_usd, qty, status = row
        if status not in ("pending", "yoomoney_pending"):
            conn.close()
            return err("Заказ уже оплачен или недействителен")

        # Конвертируем USD → RUB (фиксированный курс из настроек)
        cur.execute(f"SELECT value FROM {S}.settings WHERE key = 'usd_rate' LIMIT 1")
        rate_row = cur.fetchone()
        usd_rate = float(rate_row[0]) if rate_row else 90.0
        amount_rub = round(float(price_usd) * usd_rate, 2)

        wallet = os.environ.get("YOOMONEY_WALLET", "")
        if not wallet:
            conn.close()
            return err("YOOMONEY_WALLET не настроен", 500)

        # Обновляем статус заказа
        cur.execute(
            f"UPDATE {S}.orders SET status = 'yoomoney_pending', usd_rate = %s WHERE id = %s",
            (usd_rate, order_id),
        )
        conn.commit()
        conn.close()

        # Формируем параметры формы ЮMoney
        params = {
            "receiver": wallet,
            "quickpay-form": "shop",
            "targets": f"Оплата заказа {order_id[:8].upper()} — {item_name}",
            "paymentType": "AC",          # AC = банковская карта; SB = СБП
            "sum": amount_rub,
            "label": order_id,            # order_id как метка для webhook
            "successURL": f"{body.get('return_url', '')}",
            "formcomment": "CambeckSHOP",
            "short-dest": item_name[:50],
        }

        payment_url = "https://yoomoney.ru/quickpay/confirm?" + urlencode(params)

        return ok({
            "payment_url": payment_url,
            "amount_rub": amount_rub,
            "usd_rate": usd_rate,
        })

    # ── POST /yoomoney?action=webhook — уведомление от ЮMoney ────────────────
    if method == "POST" and action == "webhook":
        raw_body = event.get("body") or ""

        # ЮMoney шлёт application/x-www-form-urlencoded
        from urllib.parse import parse_qs
        parsed = parse_qs(raw_body)
        params = {k: v[0] for k, v in parsed.items()}

        secret = os.environ.get("YOOMONEY_SECRET", "")
        if not verify_notification(params, secret):
            return {"statusCode": 400, "headers": CORS_HEADERS, "body": "bad signature"}

        if params.get("codepro", "false") == "true":
            return {"statusCode": 200, "headers": CORS_HEADERS, "body": "codepro not supported"}

        label = params.get("label", "")
        amount = params.get("amount", "0")
        notification_type = params.get("notification_type", "")

        if notification_type not in ("p2p-incoming", "card-incoming"):
            return {"statusCode": 200, "headers": CORS_HEADERS, "body": "ignored"}

        if not label:
            return {"statusCode": 200, "headers": CORS_HEADERS, "body": "no label"}

        conn = get_conn()
        cur = conn.cursor()
        S = schema()

        cur.execute(
            f"SELECT id, item_id, item_name, price_usd, quantity, status, user_id, game FROM {S}.orders WHERE id = %s",
            (label,),
        )
        row = cur.fetchone()
        if not row:
            conn.close()
            return {"statusCode": 200, "headers": CORS_HEADERS, "body": "order not found"}

        order_id, item_id, item_name, price_usd, qty, status, user_id, game = row

        if status == "paid":
            conn.close()
            return {"statusCode": 200, "headers": CORS_HEADERS, "body": "already paid"}

        # Помечаем заказ оплаченным
        cur.execute(
            f"""UPDATE {S}.orders
                SET status = 'paid', paid_at = NOW(),
                    tx_hash = %s
                WHERE id = %s""",
            (params.get("operation_id", ""), str(order_id)),
        )

        # Выдаём аккаунты из стока (для Brainrot)
        cur.execute(
            f"SELECT id FROM {S}.stock_accounts WHERE item_id = %s AND is_sold = FALSE LIMIT %s FOR UPDATE",
            (item_id, qty),
        )
        acc_rows = cur.fetchall()
        if acc_rows:
            ids = [str(r[0]) for r in acc_rows]
            cur.execute(
                f"UPDATE {S}.stock_accounts SET is_sold = TRUE, order_id = %s, sold_at = NOW() WHERE id = ANY(%s::uuid[])",
                (str(order_id), ids),
            )

        conn.commit()
        conn.close()

        return {"statusCode": 200, "headers": CORS_HEADERS, "body": "ok"}

    # ── GET /yoomoney?action=status&order_id=xxx ─────────────────────────────
    if method == "GET" and action == "status":
        order_id = qs.get("order_id", "")
        if not order_id:
            return err("order_id required")

        conn = get_conn()
        cur = conn.cursor()
        S = schema()

        cur.execute(
            f"SELECT status, paid_at FROM {S}.orders WHERE id = %s",
            (order_id,),
        )
        row = cur.fetchone()
        conn.close()

        if not row:
            return err("Заказ не найден", 404)

        return ok({"status": row[0], "paid_at": row[1]})

    return err("Unknown action")