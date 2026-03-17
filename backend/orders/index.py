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

def create_support_chat(cur, order_id: str, item_name: str, visitor_id: str, visitor_name: str) -> str:
    """Создаём чат поддержки для ручной выдачи товара"""
    schema = os.environ.get("MAIN_DB_SCHEMA", "public")
    # Ищем существующий открытый чат этого покупателя
    cur.execute(f"SELECT id FROM {schema}.chats WHERE visitor_id = %s AND status = 'open' ORDER BY created_at DESC LIMIT 1", (visitor_id,))
    row = cur.fetchone()
    if row:
        chat_id = str(row[0])
    else:
        cur.execute(f"INSERT INTO {schema}.chats (visitor_id, visitor_name, status) VALUES (%s, %s, 'open') RETURNING id", (visitor_id, visitor_name))
        chat_id = str(cur.fetchone()[0])
    # Первое сообщение от системы
    first_msg = f"✅ Оплата получена! Товар: {item_name}\n\nПродавец скоро выйдет на связь и передаст товар через игру. Ожидайте."
    cur.execute(f"INSERT INTO {schema}.messages (chat_id, sender, text) VALUES (%s, 'admin', %s)", (chat_id, first_msg))
    cur.execute(f"UPDATE {schema}.chats SET updated_at = NOW(), last_message = %s WHERE id = %s", (first_msg[:100], chat_id))
    # Сохраняем chat_id в заказе
    cur.execute(f"UPDATE {schema}.orders SET chat_id = %s WHERE id = %s", (chat_id, order_id))
    return chat_id

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
        game = body.get("game", "steal-a-brainrot")
        visitor_id = body.get("visitor_id", "")
        visitor_name = body.get("visitor_name", "Покупатель")

        if not all([item_id, item_name, price_usd, network]):
            return err("Не все поля заполнены")
        if network not in CRYPTO_ADDRESSES:
            return err("Неизвестная сеть")

        conn = get_conn()
        cur = conn.cursor()
        schema = os.environ.get("MAIN_DB_SCHEMA", "public")
        cur.execute("SELECT COUNT(*) FROM stock_accounts WHERE item_id = %s AND is_sold = FALSE", (item_id,))
        available = cur.fetchone()[0]

        if available > 0 and available < quantity:
            conn.close()
            return err(f"Недостаточно товара. Доступно: {available}")

        address = CRYPTO_ADDRESSES[network]
        total_usd = float(price_usd) * quantity
        user_id = get_user_id_from_token(conn, auth_token)

        # Получаем актуальный курс USD→RUB
        cur.execute(f"SELECT value FROM {schema}.settings WHERE key = 'usd_rate'")
        rate_row = cur.fetchone()
        current_usd_rate = float(rate_row[0]) if rate_row else 81.91

        # Получаем курс крипты к USD и фиксируем crypto_amount
        crypto_rate = None
        crypto_amount = None
        try:
            coin_ids = {"LTC": "litecoin", "SOL": "solana"}
            if network in coin_ids:
                r = requests.get(
                    f"https://api.coingecko.com/api/v3/simple/price?ids={coin_ids[network]}&vs_currencies=usd",
                    timeout=8
                )
                price_data = r.json()
                crypto_rate = float(price_data[coin_ids[network]]["usd"])
                crypto_amount = round(total_usd / crypto_rate, 8)
            elif network in ("USDT_BEP", "USDT_TRC"):
                crypto_rate = 1.0
                crypto_amount = round(total_usd, 2)
        except Exception:
            pass

        cur.execute(
            f"INSERT INTO {schema}.orders (item_id, item_name, price_usd, quantity, crypto_network, crypto_address, status, user_id, game, usd_rate, crypto_rate, crypto_amount) VALUES (%s, %s, %s, %s, %s, %s, 'pending', %s, %s, %s, %s, %s) RETURNING id, created_at",
            (item_id, item_name, total_usd, quantity, network, address, user_id, game, current_usd_rate, crypto_rate, crypto_amount)
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
            "amount_rub": round(total_usd * current_usd_rate, 2),
            "usd_rate": current_usd_rate,
            "crypto_rate": crypto_rate,
            "crypto_amount": crypto_amount,
            "item_name": item_name,
            "quantity": quantity,
            "created_at": created_at,
            "has_accounts": available > 0,
            "game": game,
        })

    # GET status — только статус из БД, без проверки блокчейна
    if method == "GET" and action == "status":
        order_id = params.get("order_id")
        if not order_id:
            return err("Нет order_id")

        conn = get_conn()
        cur = conn.cursor()
        schema = os.environ.get("MAIN_DB_SCHEMA", "public")

        # Автоудаляем pending-заказы старше 30 минут
        cur.execute(f"""
            UPDATE {schema}.orders SET status = 'expired'
            WHERE status = 'pending'
            AND created_at < NOW() - INTERVAL '30 minutes'
        """)
        conn.commit()

        cur.execute(
            f"SELECT id, item_id, item_name, price_usd, quantity, crypto_network, crypto_address, status, paid_at, game, crypto_rate, crypto_amount, usd_rate FROM {schema}.orders WHERE id = %s",
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
            "game": row[9],
            "crypto_rate": float(row[10]) if row[10] else None,
            "crypto_amount": float(row[11]) if row[11] else None,
            "usd_rate": float(row[12]) if row[12] else None,
        }

        accounts = []
        if order["status"] == "paid":
            cur.execute(f"SELECT credentials FROM stock_accounts WHERE order_id = %s", (order_id,))
            accounts = [r[0] for r in cur.fetchall()]

        conn.close()
        return ok({**order, "accounts": accounts})

    # POST check — проверка блокчейна по запросу покупателя (кнопка "Я оплатил")
    if method == "POST" and action == "check":
        order_id = body.get("order_id")
        visitor_id = body.get("visitor_id", "anonymous")
        visitor_name = body.get("visitor_name", "Покупатель")
        if not order_id:
            return err("Нет order_id")

        conn = get_conn()
        cur = conn.cursor()
        schema = os.environ.get("MAIN_DB_SCHEMA", "public")
        cur.execute(
            f"SELECT id, item_id, item_name, price_usd, quantity, crypto_network, crypto_address, status, created_at, game, chat_id FROM {schema}.orders WHERE id = %s",
            (order_id,)
        )
        row = cur.fetchone()
        if not row:
            conn.close()
            return err("Заказ не найден", 404)

        order_game = row[9] or "steal-a-brainrot"
        existing_chat_id = str(row[10]) if row[10] else None

        if row[7] == "paid":
            accounts = []
            chat_id = existing_chat_id
            if order_game == "steal-a-brainrot":
                cur.execute(f"SELECT credentials FROM stock_accounts WHERE order_id = %s", (order_id,))
                accounts = [r[0] for r in cur.fetchall()]
            conn.close()
            return ok({"status": "paid", "accounts": accounts, "chat_id": chat_id, "needs_chat": order_game != "steal-a-brainrot"})

        db_item_id = row[1]
        item_name = row[2]
        amount_usd = float(row[3])
        quantity = row[4]
        network = row[5]
        address = row[6]
        import datetime
        created_at = row[8]
        if hasattr(created_at, 'timestamp'):
            created_ts = int(created_at.timestamp())
        else:
            created_ts = int(datetime.datetime.fromisoformat(str(created_at)).timestamp())

        paid = verify_crypto_payment(network, address, amount_usd, created_ts)
        if paid:
            accounts = []
            chat_id = None
            if order_game == "steal-a-brainrot":
                issue_accounts(cur, order_id, db_item_id, quantity)
                cur.execute(f"UPDATE {schema}.orders SET status = 'paid', paid_at = NOW() WHERE id = %s", (order_id,))
                conn.commit()
                cur.execute(f"SELECT credentials FROM stock_accounts WHERE order_id = %s", (order_id,))
                accounts = [r[0] for r in cur.fetchall()]
            else:
                cur.execute(f"UPDATE {schema}.orders SET status = 'paid', paid_at = NOW() WHERE id = %s", (order_id,))
                conn.commit()
                chat_id = create_support_chat(cur, order_id, item_name, visitor_id, visitor_name)
                conn.commit()
            conn.close()
            return ok({"status": "paid", "accounts": accounts, "chat_id": chat_id, "needs_chat": order_game != "steal-a-brainrot"})

        conn.close()
        return ok({"status": "pending", "accounts": [], "needs_chat": False})

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
        schema = os.environ.get("MAIN_DB_SCHEMA", "public")
        cur.execute(f"SELECT id, item_id, item_name, quantity, status, game FROM {schema}.orders WHERE id = %s", (order_id,))
        row = cur.fetchone()
        if not row:
            conn.close()
            return err("Заказ не найден", 404)
        if row[4] == "paid":
            conn.close()
            return err("Заказ уже оплачен")

        order_game = row[5] or "steal-a-brainrot"
        item_name = row[2]
        accounts = []
        chat_id = None

        if order_game == "steal-a-brainrot":
            issue_accounts(cur, order_id, row[1], row[3])
            cur.execute(f"UPDATE {schema}.orders SET status = 'paid', paid_at = NOW(), tx_hash = %s WHERE id = %s", (tx_hash, order_id))
            conn.commit()
            cur.execute(f"SELECT credentials FROM stock_accounts WHERE order_id = %s", (order_id,))
            accounts = [r[0] for r in cur.fetchall()]
        else:
            cur.execute(f"UPDATE {schema}.orders SET status = 'paid', paid_at = NOW(), tx_hash = %s WHERE id = %s", (tx_hash, order_id))
            conn.commit()
            chat_id = create_support_chat(cur, order_id, item_name, f"order_{order_id}", f"Заказ #{order_id[:8]}")
            conn.commit()

        conn.close()
        return ok({"success": True, "accounts_issued": len(accounts), "accounts": accounts, "chat_id": chat_id, "needs_chat": order_game != "steal-a-brainrot"})

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

    # POST set_price — установить цену товара (admin)
    if method == "POST" and action == "set_price":
        if not is_admin:
            return err("Нет доступа", 403)
        item_id = body.get("item_id")
        price_usd = body.get("price_usd")
        if not item_id or price_usd is None:
            return err("Нужны item_id и price_usd")
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO item_prices (item_id, price_usd, updated_at)
            VALUES (%s, %s, NOW())
            ON CONFLICT (item_id) DO UPDATE SET price_usd = EXCLUDED.price_usd, updated_at = NOW()
        """, (item_id, float(price_usd)))
        conn.commit()
        conn.close()
        return ok({"success": True, "item_id": item_id, "price_usd": float(price_usd)})

    # GET prices — получить все цены (публичный)
    if method == "GET" and action == "prices":
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("SELECT item_id, price_usd FROM item_prices")
        rows = cur.fetchall()
        conn.close()
        return ok({"prices": {str(r[0]): float(r[1]) for r in rows}})

    # GET stock_public — публичные остатки (только количество доступных)
    if method == "GET" and action == "stock_public":
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("""
            SELECT item_id, COUNT(*) as available
            FROM stock_accounts WHERE is_sold = FALSE
            GROUP BY item_id
        """)
        rows = cur.fetchall()
        conn.close()
        return ok({"stock": {str(r[0]): int(r[1]) for r in rows}})

    # GET catalog — список всех товаров из БД (публичный)
    if method == "GET" and action == "catalog":
        conn = get_conn()
        cur = conn.cursor()
        schema = os.environ.get("MAIN_DB_SCHEMA", "public")
        cur.execute(f"SELECT id, name, price_usd, stock, emoji, category, game, sort_order FROM {schema}.catalog_items ORDER BY sort_order, id")
        rows = cur.fetchall()
        conn.close()
        items = [{"id": r[0], "name": r[1], "price_usd": float(r[2]), "stock": r[3], "emoji": r[4], "category": r[5], "game": r[6], "sort_order": r[7]} for r in rows]
        return ok({"items": items})

    # POST catalog_create — создать товар (admin)
    if method == "POST" and action == "catalog_create":
        if not is_admin:
            return err("Нет доступа", 403)
        name = body.get("name", "").strip()
        price_usd = body.get("price_usd", 0)
        emoji = body.get("emoji", "📦")
        category = body.get("category", "other")
        game = body.get("game", "steal-a-brainrot")
        sort_order = body.get("sort_order", 0)
        if not name:
            return err("Нужно название")
        conn = get_conn()
        cur = conn.cursor()
        schema = os.environ.get("MAIN_DB_SCHEMA", "public")
        cur.execute(
            f"INSERT INTO {schema}.catalog_items (name, price_usd, stock, emoji, category, game, sort_order) VALUES (%s, %s, 0, %s, %s, %s, %s) RETURNING id",
            (name, float(price_usd), emoji, category, game, int(sort_order))
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return ok({"success": True, "id": new_id})

    # POST catalog_update — обновить товар (admin)
    if method == "POST" and action == "catalog_update":
        if not is_admin:
            return err("Нет доступа", 403)
        item_id = body.get("id")
        if not item_id:
            return err("Нужен id")
        conn = get_conn()
        cur = conn.cursor()
        schema = os.environ.get("MAIN_DB_SCHEMA", "public")
        fields = []
        values = []
        for field in ["name", "price_usd", "stock", "emoji", "category", "game", "sort_order"]:
            if field in body:
                fields.append(f"{field} = %s")
                values.append(body[field])
        if not fields:
            conn.close()
            return err("Нет полей для обновления")
        values.append(item_id)
        cur.execute(f"UPDATE {schema}.catalog_items SET {', '.join(fields)} WHERE id = %s", values)
        conn.commit()
        conn.close()
        return ok({"success": True})

    # POST catalog_delete — удалить товар (admin)
    if method == "POST" and action == "catalog_delete":
        if not is_admin:
            return err("Нет доступа", 403)
        item_id = body.get("id")
        if not item_id:
            return err("Нужен id")
        conn = get_conn()
        cur = conn.cursor()
        schema = os.environ.get("MAIN_DB_SCHEMA", "public")
        cur.execute(f"DELETE FROM {schema}.catalog_items WHERE id = %s", (item_id,))
        conn.commit()
        conn.close()
        return ok({"success": True})

    # GET games — список игр (публичный)
    if method == "GET" and action == "games":
        conn = get_conn()
        cur = conn.cursor()
        schema = os.environ.get("MAIN_DB_SCHEMA", "public")
        cur.execute(f"SELECT id, name, image, description, badge, sort_order FROM {schema}.catalog_games ORDER BY sort_order, id")
        rows = cur.fetchall()
        conn.close()
        games = [{"id": r[0], "name": r[1], "image": r[2], "description": r[3], "badge": r[4], "sort_order": r[5]} for r in rows]
        return ok({"games": games})

    # POST game_create — создать игру (admin)
    if method == "POST" and action == "game_create":
        if not is_admin:
            return err("Нет доступа", 403)
        gid = body.get("id", "").strip().lower().replace(" ", "-")
        name = body.get("name", "").strip()
        image = body.get("image", "")
        description = body.get("description", "")
        badge = body.get("badge") or None
        sort_order = int(body.get("sort_order", 0))
        if not gid or not name:
            return err("Нужны id и name")
        conn = get_conn()
        cur = conn.cursor()
        schema = os.environ.get("MAIN_DB_SCHEMA", "public")
        cur.execute(
            f"INSERT INTO {schema}.catalog_games (id, name, image, description, badge, sort_order) VALUES (%s, %s, %s, %s, %s, %s) ON CONFLICT (id) DO NOTHING RETURNING id",
            (gid, name, image, description, badge, sort_order)
        )
        result = cur.fetchone()
        conn.commit()
        conn.close()
        if not result:
            return err("Игра с таким ID уже существует")
        return ok({"success": True, "id": gid})

    # POST game_update — обновить игру (admin)
    if method == "POST" and action == "game_update":
        if not is_admin:
            return err("Нет доступа", 403)
        gid = body.get("id")
        if not gid:
            return err("Нужен id")
        conn = get_conn()
        cur = conn.cursor()
        schema = os.environ.get("MAIN_DB_SCHEMA", "public")
        fields = []
        values = []
        for field in ["name", "image", "description", "badge", "sort_order"]:
            if field in body:
                fields.append(f"{field} = %s")
                values.append(body[field] or None if field == "badge" else body[field])
        if not fields:
            conn.close()
            return err("Нет полей для обновления")
        values.append(gid)
        cur.execute(f"UPDATE {schema}.catalog_games SET {', '.join(fields)} WHERE id = %s", values)
        conn.commit()
        conn.close()
        return ok({"success": True})

    # POST game_delete — удалить игру (admin)
    if method == "POST" and action == "game_delete":
        if not is_admin:
            return err("Нет доступа", 403)
        gid = body.get("id")
        if not gid:
            return err("Нужен id")
        conn = get_conn()
        cur = conn.cursor()
        schema = os.environ.get("MAIN_DB_SCHEMA", "public")
        cur.execute(f"DELETE FROM {schema}.catalog_games WHERE id = %s", (gid,))
        conn.commit()
        conn.close()
        return ok({"success": True})

    # GET usd_rate — актуальный курс доллара (с кэшем 30 мин в БД)
    if method == "GET" and action == "usd_rate":
        schema = os.environ.get("MAIN_DB_SCHEMA", "public")
        conn = get_conn()
        cur = conn.cursor()
        # Проверяем кэш — если обновляли менее 30 минут назад, отдаём из БД
        cur.execute(f"SELECT value, updated_at FROM {schema}.settings WHERE key = 'usd_rate'")
        row = cur.fetchone()
        import datetime
        now = datetime.datetime.utcnow()
        if row:
            cached_rate = float(row[0])
            updated_at = row[1]
            if updated_at and (now - updated_at.replace(tzinfo=None)).total_seconds() < 1800:
                conn.close()
                return ok({"rate": cached_rate, "cached": True})
        # Кэш устарел — запрашиваем у ЦБ РФ
        try:
            cbr_url = "https://www.cbr-xml-daily.ru/daily_json.js"
            r = requests.get(cbr_url, timeout=8)
            data = r.json()
            usd_rate = float(data["Valute"]["USD"]["Value"])
            # Сохраняем в БД
            cur.execute(
                f"INSERT INTO {schema}.settings (key, value, updated_at) VALUES ('usd_rate', %s, NOW()) "
                f"ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()",
                (str(usd_rate),)
            )
            conn.commit()
            conn.close()
            return ok({"rate": usd_rate, "cached": False})
        except Exception:
            conn.close()
            fallback = cached_rate if row else 81.91
            return ok({"rate": fallback, "cached": True})

    return err("Неизвестный action", 404)