CREATE TABLE IF NOT EXISTS paypal_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  paypal_order_id VARCHAR(80) NOT NULL UNIQUE,
  item_name VARCHAR(120) NOT NULL,
  amount NUMERIC(9, 2) NOT NULL CHECK (amount > 0),
  currency CHAR(3) NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'CREATED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS paypal_orders_user_id_idx ON paypal_orders(user_id);
