"""
СБП / Сбер — приём платежей по номеру телефона.
Покупатель переводит сумму в рублях, админ подтверждает вручную.
"""
import json
import os
import psycopg2

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token",
    "Content-Type": "application/json",
}

SBP_PHONE = "79181440716"
SBP_BANK  = "Сбербанк"
ADMIN_TOKEN = "admin_Cambeck_token_cambeck"


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def S():
    return os.environ.get("MAIN_DB_SCHEMA", "public")


def ok(data):
    return {"statusCode": 200, "headers": CORS_HEADERS, "body": json.dumps(data, default=str)}


def err(msg, code=400):
    return {"statusCode": code, "headers": CORS_HEADERS, "body": json.dumps({"error": msg})}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    qs     = event.get("queryStringParameters") or {}
    action = qs.get("action", "")
    hdrs   = event.get("headers") or {}

    # ── POST ?action=create — зафиксировать заказ, вернуть реквизиты ─────────
    if method == "POST" and action == "create":
        raw = event.get("body") or "{}"
        while isinstance(raw, str):
            raw = json.loads(raw)
        body = raw or {}
        order_id = (body.get("order_id") or "").strip()
        if not order_id:
            return err("order_id required")

        conn = get_conn()
        cur  = conn.cursor()

        cur.execute(
            f"SELECT id, item_name, price_usd, quantity, status"
            f" FROM {S()}.orders WHERE id = %s",
            (order_id,),
        )
        row = cur.fetchone()
        if not row:
            conn.close()
            return err("Заказ не найден", 404)

        _, item_name, price_usd, qty, status = row
        if status not in ("pending", "sbp_pending"):
            conn.close()
            return err("Заказ уже оплачен или недействителен")

        # Курс USD → RUB
        cur.execute(f"SELECT value FROM {S()}.settings WHERE key = 'usd_rate' LIMIT 1")
        rate_row = cur.fetchone()
        usd_rate   = float(rate_row[0]) if rate_row else 90.0
        import math
        amount_rub = math.ceil(float(price_usd) * usd_rate)  # целые рубли, без копеек

        cur.execute(
            f"UPDATE {S()}.orders SET status = 'sbp_pending', usd_rate = %s WHERE id = %s",
            (usd_rate, order_id),
        )
        conn.commit()
        conn.close()

        return ok({
            "phone":      SBP_PHONE,
            "bank":       SBP_BANK,
            "amount_rub": amount_rub,
            "usd_rate":   usd_rate,
            "comment":    f"Заказ {order_id[:8].upper()}",
        })

    # ── POST ?action=confirm — админ подтверждает СБП-оплату ─────────────────
    if method == "POST" and action == "confirm":
        if hdrs.get("X-Admin-Token") != ADMIN_TOKEN:
            return err("Нет доступа", 403)

        raw = event.get("body") or "{}"
        while isinstance(raw, str):
            raw = json.loads(raw)
        body = raw or {}
        order_id = (body.get("order_id") or "").strip()
        if not order_id:
            return err("order_id required")

        conn = get_conn()
        cur  = conn.cursor()

        cur.execute(
            f"SELECT id, item_id, item_name, quantity, status, game"
            f" FROM {S()}.orders WHERE id = %s",
            (order_id,),
        )
        row = cur.fetchone()
        if not row:
            conn.close()
            return err("Заказ не найден", 404)

        _, item_id, item_name, qty, status, game = row
        if status == "paid":
            conn.close()
            return ok({"success": True, "already_paid": True})

        # Помечаем оплаченным
        cur.execute(
            f"UPDATE {S()}.orders SET status = 'paid', paid_at = NOW() WHERE id = %s",
            (order_id,),
        )

        # Выдаём аккаунты для Steal a Brainrot
        if game == "steal-a-brainrot":
            cur.execute(
                f"SELECT id FROM {S()}.stock_accounts"
                f" WHERE item_id = %s AND is_sold = FALSE LIMIT %s FOR UPDATE",
                (item_id, qty),
            )
            ids = [str(r[0]) for r in cur.fetchall()]
            if ids:
                cur.execute(
                    f"UPDATE {S()}.stock_accounts"
                    f" SET is_sold = TRUE, order_id = %s, sold_at = NOW()"
                    f" WHERE id = ANY(%s::uuid[])",
                    (order_id, ids),
                )
        else:
            # Для других игр — создаём чат поддержки
            cur.execute(
                f"SELECT id FROM {S()}.chats"
                f" WHERE status = 'open' ORDER BY created_at DESC LIMIT 1"
            )
            chat_row = cur.fetchone()
            if not chat_row:
                cur.execute(
                    f"INSERT INTO {S()}.chats (visitor_id, visitor_name, status)"
                    f" VALUES (%s, 'Покупатель', 'open') RETURNING id",
                    (order_id,),
                )
                chat_id = str(cur.fetchone()[0])
            else:
                chat_id = str(chat_row[0])

            msg = f"✅ Оплата СБП получена! Товар: {item_name}\nПродавец передаст товар через игру."
            cur.execute(
                f"INSERT INTO {S()}.messages (chat_id, sender, text)"
                f" VALUES (%s, 'admin', %s)",
                (chat_id, msg),
            )
            cur.execute(
                f"UPDATE {S()}.orders SET chat_id = %s WHERE id = %s",
                (chat_id, order_id),
            )

        conn.commit()
        conn.close()
        return ok({"success": True})

    # ── POST ?action=reject — админ отклоняет СБП-заказ ──────────────────────
    if method == "POST" and action == "reject":
        if hdrs.get("X-Admin-Token") != ADMIN_TOKEN:
            return err("Нет доступа", 403)

        raw = event.get("body") or "{}"
        while isinstance(raw, str):
            raw = json.loads(raw)
        body = raw or {}
        order_id = (body.get("order_id") or "").strip()
        if not order_id:
            return err("order_id required")

        conn = get_conn()
        cur  = conn.cursor()
        cur.execute(
            f"UPDATE {S()}.orders SET status = 'rejected' WHERE id = %s AND status = 'sbp_pending'",
            (order_id,),
        )
        conn.commit()
        conn.close()
        return ok({"success": True})

    return err("Unknown action")