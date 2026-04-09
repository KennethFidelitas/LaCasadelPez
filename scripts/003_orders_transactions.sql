-- Orders, Transactions, Credits Schema
-- Acuario La Casa del Pez

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN (
    'pendiente', 'confirmado', 'procesando', 'enviado', 'entregado', 'cancelado', 'reembolsado'
  )),
  payment_status TEXT NOT NULL DEFAULT 'pendiente' CHECK (payment_status IN (
    'pendiente', 'pagado', 'fallido', 'reembolsado'
  )),
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
  discount DECIMAL(10, 2) DEFAULT 0 CHECK (discount >= 0),
  tax DECIMAL(10, 2) DEFAULT 0 CHECK (tax >= 0),
  shipping_cost DECIMAL(10, 2) DEFAULT 0 CHECK (shipping_cost >= 0),
  credits_applied DECIMAL(10, 2) DEFAULT 0 CHECK (credits_applied >= 0),
  total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
  shipping_address JSONB,
  billing_address JSONB,
  notes TEXT,
  source TEXT DEFAULT 'online' CHECK (source IN ('online', 'pos', 'phone')),
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  animal_id UUID REFERENCES animals(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  sku TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT order_item_type_check CHECK (
    (product_id IS NOT NULL AND animal_id IS NULL) OR
    (product_id IS NULL AND animal_id IS NOT NULL)
  )
);

-- Credits table (store credit system)
CREATE TABLE IF NOT EXISTS credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  balance DECIMAL(10, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('issued', 'earned', 'used', 'expired', 'refund')),
  description TEXT,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  issued_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shopping carts (for logged-in users)
CREATE TABLE IF NOT EXISTS carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id TEXT,
  items JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT cart_owner_check CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

-- Generate order number function
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  year_prefix TEXT;
  next_seq INTEGER;
BEGIN
  year_prefix := TO_CHAR(NOW(), 'YY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 3) AS INTEGER)), 0) + 1
  INTO next_seq
  FROM orders
  WHERE order_number LIKE year_prefix || '%';
  new_number := year_prefix || LPAD(next_seq::TEXT, 6, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate order number
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_order_number ON orders;
CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_credits_user ON credits(user_id);
CREATE INDEX IF NOT EXISTS idx_carts_user ON carts(user_id);
CREATE INDEX IF NOT EXISTS idx_carts_session ON carts(session_id);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;

-- Orders policies
CREATE POLICY "orders_select_own" ON orders FOR SELECT 
  USING (auth.uid() = user_id);
CREATE POLICY "orders_insert_own" ON orders FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "orders_admin_all" ON orders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'employee')
    )
  );

-- Order items policies
CREATE POLICY "order_items_select_own" ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
    )
  );
CREATE POLICY "order_items_admin_all" ON order_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'employee')
    )
  );

-- Credits policies
CREATE POLICY "credits_select_own" ON credits FOR SELECT 
  USING (auth.uid() = user_id);
CREATE POLICY "credits_admin_all" ON credits FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'employee')
    )
  );

-- Carts policies
CREATE POLICY "carts_select_own" ON carts FOR SELECT 
  USING (auth.uid() = user_id);
CREATE POLICY "carts_insert_own" ON carts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "carts_update_own" ON carts FOR UPDATE 
  USING (auth.uid() = user_id);
CREATE POLICY "carts_delete_own" ON carts FOR DELETE 
  USING (auth.uid() = user_id);
