"""
Счётчик онлайн-посетителей — ping от клиентов и получение количества активных сессий. v2
"""
import json
import os
import psycopg2

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def cors():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token",
    }

def ok(data):
    return {"statusCode": 200, "headers": {**cors(), "Content-Type": "application/json"}, "body": json.dumps(data)}

def err(msg, code=400):
    return {"statusCode": code, "headers": {**cors(), "Content-Type": "application/json"}, "body": json.dumps({"error": msg})}

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors(), "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")
    headers = event.get("headers") or {}

    # POST ping — посетитель сообщает о своём присутствии
    if method == "POST" and action == "ping":
        body = {}
        if event.get("body"):
            body = json.loads(event["body"])

        session_id = body.get("session_id", "").strip()
        if not session_id or len(session_id) < 8:
            return err("Нет session_id")

        ip = (event.get("requestContext") or {}).get("identity", {}).get("sourceIp", "")

        conn = get_conn()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO online_visitors (session_id, last_seen, ip)
            VALUES (%s, NOW(), %s)
            ON CONFLICT (session_id) DO UPDATE SET last_seen = NOW(), ip = EXCLUDED.ip
        """, (session_id, ip))
        conn.commit()
        conn.close()

        return ok({"ok": True})

    # GET count — получить количество онлайн за последние 3 минуты
    if method == "GET" and action == "count":
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM online_visitors WHERE last_seen > NOW() - INTERVAL '3 minutes'")
        count = cur.fetchone()[0]
        conn.close()
        return ok({"count": count})

    return err("Неизвестный action", 404)