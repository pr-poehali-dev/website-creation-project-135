CREATE TABLE IF NOT EXISTS seller_chats (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    username VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS seller_chats_order_id_idx ON seller_chats(order_id);
CREATE INDEX IF NOT EXISTS seller_chats_user_id_idx ON seller_chats(user_id);
CREATE INDEX IF NOT EXISTS seller_chats_status_idx ON seller_chats(status);

CREATE TABLE IF NOT EXISTS seller_messages (
    id BIGSERIAL PRIMARY KEY,
    chat_id BIGINT NOT NULL REFERENCES seller_chats(id),
    sender VARCHAR(20) NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_read BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS seller_messages_chat_id_idx ON seller_messages(chat_id);
CREATE INDEX IF NOT EXISTS seller_messages_created_at_idx ON seller_messages(created_at);
