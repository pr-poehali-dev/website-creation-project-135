CREATE TABLE t_p41710039_website_creation_pro.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES t_p41710039_website_creation_pro.orders(id),
    user_id UUID NOT NULL REFERENCES t_p41710039_website_creation_pro.users(id),
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    text TEXT NOT NULL DEFAULT '',
    is_visible BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);