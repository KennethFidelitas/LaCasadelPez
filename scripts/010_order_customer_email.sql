-- Email de contacto y confirmacion para pedidos en linea.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_email TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_customer_email
  ON orders (LOWER(customer_email));
