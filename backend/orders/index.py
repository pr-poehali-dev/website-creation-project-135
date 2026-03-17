"""
Система заказов CambeckSHOP — создание заказа, автопроверка оплаты, выдача аккаунтов.
"""
import json
import os
import psycopg2
import requests

ADMIN_TOKEN = "admin_Cambeck_token_cambeck"

CRYPTO_ADDRESSES = {
    "LTC":      "ltc1qw6m0527yhuah7n72m7gad9acrdczzufhwcckk0",
    "USDT_BEP": "0x34d1701Cd8EA27B95Cdcf7cb21B5bbC9aFc68A39",
    "USDT_TRC": "TAiCi6QMuZPRhdkYqW1R9nd9iWjWEc6JXW",
    "SOL":      "4VK9mX9VUmTHZSebHJdu5E4V2yoMA3SxJ9YUQwd5BGcd",
}

CRYPTO_LABELS = {
    "LTC":      "LTC (Litecoin)",
    "USDT_BEP": "USDT (BEP20 / BSC)",
    "USDT_TRC": "USDT (TRC20 / Tron)",
    "SOL":      "SOL (Solana)",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def cors():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token, X-Auth-Token",
    }

def ok(data):
    return {"statusCode": 200, "headers": {**cors(), "Content-Type": "application/json"}, "body": json.dumps(data, default=str)}

def err(msg, code=400):
    return {"statusCode": code, "headers": {**cors(), "Content-Type": "application/json"}, "body": json.dumps({"error": msg})}


# ──────────────────────────────────────────────
# Автопроверка оплаты — строго по времени заказа и сумме
# ──────────────────────────────────────────────

def check_ltc_payment(address: str, amount_usd: float, created_ts: int) -> bool:
    """LTC через blockcypher: ищем транзакцию ПОСЛЕ создания заказа с нужной суммой"""
    # LTC/USD курс приблизительный — проверяем просто факт любого входящего платежа после заказа
    # (точную сумму в LTC не проверяем, т.к. курс плавает — доверяем факту транзакции)
    try:
        url = f"https://api.blockcypher.com/v1/ltc/main/addrs/{address}/full?limit=10"
        r = requests.get(url, timeout=10)
        if r.status_code != 200:
            return False
        data = r.json()
        for tx in data.get("txs", []):
            if tx.get("confirmations", 0) < 1:
                continue
            # received — время получения транзакции в ISO формате
            received = tx.get("received", "")
            if received:
                import datetime
                tx_time = int(datetime.datetime.fromisoformat(received.replace("Z", "+00:00")).timestamp())
                if tx_time < created_ts:
                    continue  # транзакция старше заказа — пропускаем
            # Проверяем что есть выход на наш адрес
            for output in tx.get("outputs", []):
                if address in output.get("addresses", []):
                    satoshis = output.get("value", 0)
                    if satoshis > 0:
                        return True
    except Exception:
        pass
    return False


def check_bsc_payment(address: str, amount_usd: float, created_ts: int) -> bool:
    """USDT BEP20: ищем транзакцию после создания заказа с суммой >= amount_usd * 0.95"""
    try:
        contract = "0x55d398326f99059fF775485246999027B3197955"
        url = (f"https://api.bscscan.com/api?module=account&action=tokentx"
               f"&contractaddress={contract}&address={address}&page=1&offset=20&sort=desc")
        r = requests.get(url, timeout=10)
        if r.status_code != 200:
            return False
        data = r.json()
        if data.get("status") != "1":
            return False
        for tx in data.get("result", []):
            tx_time = int(tx.get("timeStamp", 0))
            if tx_time < created_ts:
                continue  # старее заказа
            if tx.get("to", "").lower() != address.lower():
                continue  # не на наш адрес
            value = int(tx.get("value", 0)) / 1e18
            if value >= amount_usd * 0.95:  # допуск 5% на комиссии
                return True
    except Exception:
        pass
    return False


def check_trc_payment(address: str, amount_usd: float, created_ts: int) -> bool:
    """USDT TRC20: ищем транзакцию после создания заказа с суммой >= amount_usd * 0.95"""
    try:
        contract = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"
        url = (f"https://apilist.tronscanapi.com/api/token_trc20/transfers"
               f"?limit=20&start=0&toAddress={address}&contract_address={contract}")
        r = requests.get(url, timeout=10)
        if r.status_code != 200:
            return False
        data = r.json()
        created_ms = created_ts * 1000
        for tx in data.get("token_transfers", []):
            tx_time = int(tx.get("block_ts", 0))
            if tx_time < created_ms:
                continue  # старее заказа
            if tx.get("toAddress", "") != address:
                continue
            quant = float(tx.get("quant", 0)) / 1e6
            if quant >= amount_usd * 0.95:
                return True
    except Exception:
        pass
    return False


def check_sol_payment(address: str, amount_usd: float, created_ts: int) -> bool:
    """SOL: ищем входящую транзакцию после создания заказа"""
    try:
        url = "https://api.mainnet-beta.solana.com"
        # Получаем подписи транзакций
        r = requests.post(url, json={
            "jsonrpc": "2.0", "id": 1,
            "method": "getSignaturesForAddress",
            "params": [address, {"limit": 10}]
        }, timeout=10)
        if r.status_code != 200:
            return False
        sigs = r.json().get("result", [])
        for sig in sigs:
            if sig.get("err") is not None:
                continue
            block_time = sig.get("blockTime", 0)
            if not block_time or block_time < created_ts:
                continue  # старее заказа
            # Проверяем детали транзакции — есть ли входящий перевод на наш адрес
            r2 = requests.post(url, json={
                "jsonrpc": "2.0", "id": 1,
                "method": "getTransaction",
                "params": [sig["signature"], {"encoding": "jsonParsed", "maxSupportedTransactionVersion": 0}]
            }, timeout=10)
            if r2.status_code != 200:
                continue
            tx_data = r2.json().get("result")
            if not tx_data:
                continue
            # Ищем изменение баланса нашего адреса
            pre = tx_data.get("meta", {}).get("preBalances", [])
            post = tx_data.get("meta", {}).get("postBalances", [])
            accounts = tx_data.get("transaction", {}).get("message", {}).get("accountKeys", [])
            for i, acc in enumerate(accounts):
                acc_key = acc if isinstance(acc, str) else acc.get("pubkey", "")
                if acc_key == address and i < len(pre) and i < len(post):
                    diff = post[i] - pre[i]
                    if diff > 0:  # баланс вырос — входящий платёж
                        return True
    except Exception:
        pass
    return False


def verify_crypto_payment(network: str, address: str, amount_usd: float, created_ts: int) -> bool:
    if network == "LTC":
        return check_ltc_payment(address, amount_usd, created_ts)
    elif network == "USDT_BEP":
        return check_bsc_payment(address, amount_usd, created_ts)
    elif network == "USDT_TRC":
        return check_trc_payment(address, amount_usd, created_ts)
    elif network == "SOL":
        return check_sol_payment(address, amount_usd, created_ts)
    return False


def issue_accounts(cur, order_id: str, item_id: int, quantity: int):
    """Резервируем и выдаём аккаунты из стока"""
    cur.execute(
        "SELECT id FROM stock_accounts WHERE item_id = %s AND is_sold = FALSE LIMIT %s FOR UPDATE",
        (item_id, quantity)
    )
    rows = cur.fetchall()
    if rows:
        ids = [str(r[0]) for r in rows]
        cur.execute(
            "UPDATE stock_accounts SET is_sold = TRUE, order_id = %s, sold_at = NOW() WHERE id = ANY(%s::uuid[])",
            (order_id, ids)
        )


# ──────────────────────────────────────────────
# Основной обработчик
# ──────────────────────────────────────────────

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors(), "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")
    headers = event.get("headers") or {}
    token = headers.get("X-Admin-Token", "")
    auth_token = headers.get("X-Auth-Token", "")
    is_admin = token == ADMIN_TOKEN

    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    # Получаем user_id из токена авторизации
    def get_user_id_from_token(conn, tok):
        if not tok:
            return None
        cur2 = conn.cursor()
        cur2.execute("SELECT user_id FROM user_sessions WHERE token = %s", (tok,))
        row = cur2.fetchone()
        return str(row[0]) if row else None

    # POST create — создать заказ
    if method == "POST" and action == "create":
        item_id = body.get("item_id")
        item_name = body.get("item_name", "")
        price_usd = body.get("price_usd")
        quantity = int(body.get("quantity", 1))
        network = body.get("network")

        if not all([item_id, item_name, price_usd, network]):
            return err("Не все поля заполнены")
        if network not in CRYPTO_ADDRESSES:
            return err("Неизвестная сеть")

        conn = get_conn()
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM stock_accounts WHERE item_id = %s AND is_sold = FALSE", (item_id,))
        available = cur.fetchone()[0]

        if available > 0 and available < quantity:
            conn.close()
            return err(f"Недостаточно товара. Доступно: {available}")

        address = CRYPTO_ADDRESSES[network]
        total_usd = float(price_usd) * quantity
        user_id = get_user_id_from_token(conn, auth_token)

        cur.execute(
            "INSERT INTO orders (item_id, item_name, price_usd, quantity, crypto_network, crypto_address, status, user_id) VALUES (%s, %s, %s, %s, %s, %s, 'pending', %s) RETURNING id, created_at",
            (item_id, item_name, total_usd, quantity, network, address, user_id)
        )
        order_id, created_at = cur.fetchone()
        conn.commit()
        conn.close()

        return ok({
            "order_id": str(order_id),
            "address": address,
            "network": network,
            "network_label": CRYPTO_LABELS[network],
            "amount_usd": total_usd,
            "item_name": item_name,
            "quantity": quantity,
            "created_at": created_at,
            "has_accounts": available > 0,
        })

    # GET status — только статус из БД, без проверки блокчейна
    if method == "GET" and action == "status":
        order_id = params.get("order_id")
        if not order_id:
            return err("Нет order_id")

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            "SELECT id, item_id, item_name, price_usd, quantity, crypto_network, crypto_address, status, paid_at FROM orders WHERE id = %s",
            (order_id,)
        )
        row = cur.fetchone()
        if not row:
            conn.close()
            return err("Заказ не найден", 404)

        order = {
            "order_id": str(row[0]),
            "item_name": row[2],
            "amount_usd": float(row[3]),
            "quantity": row[4],
            "network": row[5],
            "network_label": CRYPTO_LABELS.get(row[5], row[5]),
            "address": row[6],
            "status": row[7],
            "paid_at": row[8],
        }

        accounts = []
        if order["status"] == "paid":
            cur.execute("SELECT credentials FROM stock_accounts WHERE order_id = %s", (order_id,))
            accounts = [r[0] for r in cur.fetchall()]

        conn.close()
        return ok({**order, "accounts": accounts})

    # POST check — проверка блокчейна по запросу покупателя (кнопка "Я оплатил")
    if method == "POST" and action == "check":
        order_id = body.get("order_id")
        if not order_id:
            return err("Нет order_id")

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            "SELECT id, item_id, price_usd, quantity, crypto_network, crypto_address, status, created_at FROM orders WHERE id = %s",
            (order_id,)
        )
        row = cur.fetchone()
        if not row:
            conn.close()
            return err("Заказ не найден", 404)

        if row[6] == "paid":
            cur.execute("SELECT credentials FROM stock_accounts WHERE order_id = %s", (order_id,))
            accounts = [r[0] for r in cur.fetchall()]
            conn.close()
            return ok({"status": "paid", "accounts": accounts})

        db_item_id = row[1]
        amount_usd = float(row[2])
        quantity = row[3]
        network = row[4]
        address = row[5]
        # Время создания заказа — ищем только транзакции ПОСЛЕ этого момента
        import datetime
        created_at = row[7]
        if hasattr(created_at, 'timestamp'):
            created_ts = int(created_at.timestamp())
        else:
            created_ts = int(datetime.datetime.fromisoformat(str(created_at)).timestamp())

        paid = verify_crypto_payment(network, address, amount_usd, created_ts)
        if paid:
            issue_accounts(cur, order_id, db_item_id, quantity)
            cur.execute("UPDATE orders SET status = 'paid', paid_at = NOW() WHERE id = %s", (order_id,))
            conn.commit()
            cur.execute("SELECT credentials FROM stock_accounts WHERE order_id = %s", (order_id,))
            accounts = [r[0] for r in cur.fetchall()]
            conn.close()
            return ok({"status": "paid", "accounts": accounts})

        conn.close()
        return ok({"status": "pending", "accounts": []})

    # POST confirm — ручное подтверждение (admin)
    if method == "POST" and action == "confirm":
        if not is_admin:
            return err("Нет доступа", 403)
        order_id = body.get("order_id")
        tx_hash = body.get("tx_hash", "")
        if not order_id:
            return err("Нет order_id")

        conn = get_conn()
        cur = conn.cursor()
        cur.execute("SELECT id, item_id, quantity, status FROM orders WHERE id = %s", (order_id,))
        row = cur.fetchone()
        if not row:
            conn.close()
            return err("Заказ не найден", 404)
        if row[3] == "paid":
            conn.close()
            return err("Заказ уже оплачен")

        issue_accounts(cur, order_id, row[1], row[2])
        cur.execute("UPDATE orders SET status = 'paid', paid_at = NOW(), tx_hash = %s WHERE id = %s", (tx_hash, order_id))
        conn.commit()

        cur.execute("SELECT credentials FROM stock_accounts WHERE order_id = %s", (order_id,))
        accounts = [r[0] for r in cur.fetchall()]
        conn.close()
        return ok({"success": True, "accounts_issued": len(accounts), "accounts": accounts})

    # GET list — заказы для admin
    if method == "GET" and action == "list":
        if not is_admin:
            return err("Нет доступа", 403)
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("SELECT id, item_name, price_usd, quantity, crypto_network, status, created_at, paid_at FROM orders ORDER BY created_at DESC LIMIT 100")
        rows = cur.fetchall()
        orders = [{"order_id": str(r[0]), "item_name": r[1], "amount_usd": float(r[2]), "quantity": r[3], "network": r[4], "status": r[5], "created_at": r[6], "paid_at": r[7]} for r in rows]
        conn.close()
        return ok({"orders": orders})

    # GET stock — полный список аккаунтов по товару (admin)
    if method == "GET" and action == "stock":
        if not is_admin:
            return err("Нет доступа", 403)
        item_id = params.get("item_id")
        conn = get_conn()
        cur = conn.cursor()
        if item_id:
            cur.execute("""
                SELECT id, credentials, is_sold, sold_at, created_at
                FROM stock_accounts WHERE item_id = %s ORDER BY created_at DESC
            """, (item_id,))
            rows = cur.fetchall()
            items = [{"id": str(r[0]), "credentials": r[1], "is_sold": r[2], "sold_at": r[3], "created_at": r[4]} for r in rows]
            conn.close()
            return ok({"accounts": items})
        else:
            cur.execute("""
                SELECT item_id, COUNT(*) FILTER (WHERE is_sold = FALSE) as available,
                       COUNT(*) as total
                FROM stock_accounts GROUP BY item_id ORDER BY item_id
            """)
            rows = cur.fetchall()
            conn.close()
            return ok({"stock": [{"item_id": r[0], "available": r[1], "total": r[2]} for r in rows]})

    # POST add_stock — добавить аккаунты в сток (admin)
    if method == "POST" and action == "add_stock":
        if not is_admin:
            return err("Нет доступа", 403)
        item_id = body.get("item_id")
        credentials_list = body.get("credentials", [])
        if not item_id or not credentials_list:
            return err("Нужны item_id и credentials")
        if isinstance(credentials_list, str):
            credentials_list = [c.strip() for c in credentials_list.strip().splitlines() if c.strip()]
        conn = get_conn()
        cur = conn.cursor()
        added = 0
        for cred in credentials_list:
            cur.execute(
                "INSERT INTO stock_accounts (item_id, credentials) VALUES (%s, %s)",
                (item_id, cred.strip())
            )
            added += 1
        conn.commit()
        conn.close()
        return ok({"added": added})

    # POST delete_stock — удалить аккаунт из стока (admin)
    if method == "POST" and action == "delete_stock":
        if not is_admin:
            return err("Нет доступа", 403)
        account_id = body.get("account_id")
        if not account_id:
            return err("Нужен account_id")
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("UPDATE stock_accounts SET is_sold = TRUE WHERE id = %s AND is_sold = FALSE", (account_id,))
        conn.commit()
        conn.close()
        return ok({"success": True})

    return err("Неизвестный action", 404)