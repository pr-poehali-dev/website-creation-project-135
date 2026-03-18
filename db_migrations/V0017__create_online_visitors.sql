CREATE TABLE IF NOT EXISTS online_visitors (
    session_id VARCHAR(64) PRIMARY KEY,
    last_seen TIMESTAMP DEFAULT NOW(),
    ip VARCHAR(64)
);