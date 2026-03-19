"""
Система отзывов — создание, получение, модерация.
"""
import json
import os
import psycopg2

ADMIN_TOKEN = "admin_Cambeck_token_cambeck"

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def get_schema():
    return os.environ.get("MAIN_DB_SCHEMA", "public")

def cors():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token, X-Admin-Token",
    }

def ok(data):
    return {"statusCode": 200, "headers": {**cors(), "Content-Type": "application/json"}, "body": json.dumps(data, default=str)}

def err(msg, code=400):
    return {"statusCode": code, "headers": {**cors(), "Content-Type": "application/json"}, "body": json.dumps({"error": msg})}

def get_user_by_token(cur, token, schema):
    cur.execute(f"""
        SELECT u.id, u.username FROM {schema}.users u
        JOIN {schema}.user_sessions s ON s.user_id = u.id
        WHERE s.token = %s AND s.expires_at > NOW()
    """, (token,))
    return cur.fetchone()

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors(), "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")
    headers = event.get("headers") or {}
    auth_token = headers.get("X-Auth-Token") or headers.get("x-auth-token") or ""
    admin_token = headers.get("X-Admin-Token") or headers.get("x-admin-token") or ""
    schema = get_schema()

    # GET list — публичный список видимых отзывов
    if method == "GET" and action == "list":
        limit = int(params.get("limit", 20))
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"""
            SELECT r.id, r.rating, r.text, r.created_at,
                   u.username, r.order_id,
                   o.item_name, o.game
            FROM {schema}.reviews r
            JOIN {schema}.users u ON u.id = r.user_id
            JOIN {schema}.orders o ON o.id = r.order_id
            WHERE r.is_visible = TRUE
            ORDER BY r.created_at DESC
            LIMIT %s
        """, (limit,))
        rows = cur.fetchall()
        conn.close()
        reviews = [
            {"id": str(r[0]), "rating": r[1], "text": r[2], "created_at": str(r[3]),
             "username": r[4], "order_id": str(r[5]), "item_name": r[6], "game": r[7]}
            for r in rows
        ]
        return ok({"reviews": reviews})

    # GET can_review — может ли пользователь оставить отзыв на заказ
    if method == "GET" and action == "can_review":
        if not auth_token:
            return err("Нет токена", 401)
        order_id = params.get("order_id", "")
        if not order_id:
            return err("Нет order_id")
        conn = get_conn()
        cur = conn.cursor()
        user = get_user_by_token(cur, auth_token, schema)
        if not user:
            conn.close()
            return err("Неверный токен", 401)
        user_id = user[0]
        cur.execute(f"SELECT id, status FROM {schema}.orders WHERE id = %s AND user_id = %s", (order_id, user_id))
        order = cur.fetchone()
        if not order:
            conn.close()
            return err("Заказ не найден", 404)
        if order[1] != "paid":
            conn.close()
            return ok({"can_review": False, "reason": "order_not_paid"})
        cur.execute(f"SELECT id FROM {schema}.reviews WHERE order_id = %s AND user_id = %s", (order_id, user_id))
        already = cur.fetchone()
        conn.close()
        return ok({"can_review": not already, "already_reviewed": bool(already)})

    # POST create — оставить отзыв
    if method == "POST" and action == "create":
        if not auth_token:
            return err("Нет токена", 401)
        body = json.loads(event.get("body") or "{}")
        order_id = body.get("order_id", "").strip()
        rating = body.get("rating")
        text = body.get("text", "").strip()
        if not order_id:
            return err("Нет order_id")
        if not isinstance(rating, int) or rating < 1 or rating > 5:
            return err("Оценка должна быть от 1 до 5")
        conn = get_conn()
        cur = conn.cursor()
        user = get_user_by_token(cur, auth_token, schema)
        if not user:
            conn.close()
            return err("Неверный токен", 401)
        user_id = user[0]
        cur.execute(f"SELECT id, status FROM {schema}.orders WHERE id = %s AND user_id = %s", (order_id, user_id))
        order = cur.fetchone()
        if not order:
            conn.close()
            return err("Заказ не найден", 404)
        if order[1] != "paid":
            conn.close()
            return err("Можно оставить отзыв только на оплаченный заказ")
        cur.execute(f"SELECT id FROM {schema}.reviews WHERE order_id = %s AND user_id = %s", (order_id, user_id))
        if cur.fetchone():
            conn.close()
            return err("Отзыв уже оставлен")
        cur.execute(f"""
            INSERT INTO {schema}.reviews (order_id, user_id, rating, text)
            VALUES (%s, %s, %s, %s) RETURNING id
        """, (order_id, user_id, rating, text))
        review_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return ok({"ok": True, "review_id": str(review_id)})

    # GET admin_list — все отзывы для админа
    if method == "GET" and action == "admin_list":
        if admin_token != ADMIN_TOKEN:
            return err("Нет доступа", 403)
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"""
            SELECT r.id, r.rating, r.text, r.created_at, r.is_visible,
                   u.username, u.email, r.order_id, o.item_name, o.game
            FROM {schema}.reviews r
            JOIN {schema}.users u ON u.id = r.user_id
            JOIN {schema}.orders o ON o.id = r.order_id
            ORDER BY r.created_at DESC
        """)
        rows = cur.fetchall()
        conn.close()
        reviews = [
            {"id": str(r[0]), "rating": r[1], "text": r[2], "created_at": str(r[3]),
             "is_visible": r[4], "username": r[5], "email": r[6],
             "order_id": str(r[7]), "item_name": r[8], "game": r[9]}
            for r in rows
        ]
        return ok({"reviews": reviews})

    # POST toggle_visible — скрыть/показать отзыв (админ)
    if method == "POST" and action == "toggle_visible":
        if admin_token != ADMIN_TOKEN:
            return err("Нет доступа", 403)
        body = json.loads(event.get("body") or "{}")
        review_id = body.get("review_id", "")
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"UPDATE {schema}.reviews SET is_visible = NOT is_visible WHERE id = %s RETURNING is_visible", (review_id,))
        row = cur.fetchone()
        if not row:
            conn.close()
            return err("Отзыв не найден", 404)
        conn.commit()
        conn.close()
        return ok({"ok": True, "is_visible": row[0]})

    return err("Неизвестный action", 404)
