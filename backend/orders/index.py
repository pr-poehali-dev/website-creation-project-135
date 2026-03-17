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
        "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token",
    }

def ok(data):
    return {"statusCode": 200, "headers": {**cors(), "Content-Type": "application/json"}, "body": json.dumps(data, default=str)}

def err(msg, code=400):
    return {"statusCode": code, "headers": {**cors(), "Content-Type": "application/json"}, "body": json.dumps({"error": msg})}


# ──────────────────────────────────────────────
# Автопроверка оплаты по блокчейну (без API ключей)
# ──────────────────────────────────────────────

def check_ltc_payment(address: str, amount_usd: float) -> bool:
    """Проверяем входящие транзакции LTC через blockcypher (бесплатно, без ключа)"""
    try:
        url = f"https://api.blockcypher.com/v1/ltc/main/addrs/{address}/full?limit=5"
        r = requests.get(url, timeout=10)
        if r.status_code != 200:
            return False
        data = r.json()
        txs = data.get("txs", [])
        # Ищем любую входящую транзакцию за последние 2 часа
        import time
        cutoff = time.time() - 7200  # 2 часа
        for tx in txs:
            # Проверяем что транзакция подтверждена (confirmations > 0)
            if tx.get("confirmations", 0) < 1:
                continue
            # Проверяем что есть выходы на наш адрес
            for output in tx.get("outputs", []):
                if address in output.get("addresses", []):
                    return True
    except Exception:
        pass
    return False


def check_bsc_payment(address: str, amount_usd: float) -> bool:
    """Проверяем USDT BEP20 через публичный BSC API"""
    try:
        # USDT contract на BSC
        contract = "0x55d398326f99059fF775485246999027B3197955"
        url = f"https://api.bscscan.com/api?module=account&action=tokentx&contractaddress={contract}&address={address}&page=1&offset=10&sort=desc"
        r = requests.get(url, timeout=10)
        if r.status_code != 200:
            return False
        data = r.json()
        if data.get("status") != "1":
            return False
        txs = data.get("result", [])
        import time
        cutoff = int(time.time()) - 7200
        for tx in txs:
            if int(tx.get("timeStamp", 0)) < cutoff:
                continue
            if tx.get("to", "").lower() == address.lower():
                # value в wei (18 decimals для USDT BEP20)
                value = int(tx.get("value", 0)) / 1e18
                if value > 0:
                    return True
    except Exception:
        pass
    return False


def check_trc_payment(address: str, amount_usd: float) -> bool:
    """Проверяем USDT TRC20 через Tronscan публичный API"""
    try:
        # USDT TRC20 contract
        contract = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"
        url = f"https://apilist.tronscanapi.com/api/token_trc20/transfers?limit=10&start=0&toAddress={address}&contract_address={contract}"
        r = requests.get(url, timeout=10)
        if r.status_code != 200:
            return False
        data = r.json()
        txs = data.get("token_transfers", [])
        import time
        cutoff = (int(time.time()) - 7200) * 1000  # в миллисекундах
        for tx in txs:
            if int(tx.get("block_ts", 0)) < cutoff:
                continue
            if tx.get("toAddress", "") == address:
                quant = float(tx.get("quant", 0)) / 1e6
                if quant > 0:
                    return True
    except Exception:
        pass
    return False


def check_sol_payment(address: str, amount_usd: float) -> bool:
    """Проверяем SOL через публичный RPC"""
    try:
        url = "https://api.mainnet-beta.solana.com"
        payload = {
            "jsonrpc": "2.0", "id": 1,
            "method": "getSignaturesForAddress",
            "params": [address, {"limit": 5}]
        }
        r = requests.post(url, json=payload, timeout=10)
        if r.status_code != 200:
            return False
        data = r.json()
        sigs = data.get("result", [])
        import time
        cutoff = int(time.time()) - 7200
        for sig in sigs:
            if sig.get("err") is not None:
                continue
            block_time = sig.get("blockTime", 0)
            if block_time and block_time > cutoff:
                return True
    except Exception:
        pass
    return False


def verify_crypto_payment(network: str, address: str, amount_usd: float) -> bool:
    if network == "LTC":
        return check_ltc_payment(address, amount_usd)
    elif network == "USDT_BEP":
        return check_bsc_payment(address, amount_usd)
    elif network == "USDT_TRC":
        return check_trc_payment(address, amount_usd)
    elif network == "SOL":
        return check_sol_payment(address, amount_usd)
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
    is_admin = token == ADMIN_TOKEN

    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

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

        cur.execute(
            "INSERT INTO orders (item_id, item_name, price_usd, quantity, crypto_network, crypto_address, status) VALUES (%s, %s, %s, %s, %s, %s, 'pending') RETURNING id, created_at",
            (item_id, item_name, total_usd, quantity, network, address)
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

    # GET status — статус + автопроверка блокчейна
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

        db_item_id = row[1]
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

        # Если заказ pending — автоматически проверяем блокчейн
        if order["status"] == "pending":
            paid = verify_crypto_payment(order["network"], order["address"], order["amount_usd"])
            if paid:
                issue_accounts(cur, order_id, db_item_id, order["quantity"])
                cur.execute("UPDATE orders SET status = 'paid', paid_at = NOW() WHERE id = %s", (order_id,))
                conn.commit()
                order["status"] = "paid"

        accounts = []
        if order["status"] == "paid":
            cur.execute("SELECT credentials FROM stock_accounts WHERE order_id = %s", (order_id,))
            accounts = [r[0] for r in cur.fetchall()]

        conn.close()
        return ok({**order, "accounts": accounts})

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

    # GET stock — остатки
    if method == "GET" and action == "stock":
        if not is_admin:
            return err("Нет доступа", 403)
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("SELECT item_id, COUNT(*) FROM stock_accounts WHERE is_sold = FALSE GROUP BY item_id")
        rows = cur.fetchall()
        conn.close()
        return ok({"stock": {str(r[0]): r[1] for r in rows}})

    return err("Неизвестный action", 404)
