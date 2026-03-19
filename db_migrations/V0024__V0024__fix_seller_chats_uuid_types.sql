ALTER TABLE seller_chats ALTER COLUMN order_id TYPE UUID USING order_id::text::uuid;
ALTER TABLE seller_chats ALTER COLUMN user_id TYPE UUID USING user_id::text::uuid;
ALTER TABLE seller_messages ALTER COLUMN chat_id TYPE BIGINT USING chat_id;
