-- POS (Point of Sale) Schema
-- Acuario La Casa del Pez

-- POS sessions (daily cash register)
CREATE TABLE IF NOT EXISTS pos_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opened_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  closed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  opening_cash DECIMAL(10, 2) NOT NULL DEFAULT 0,
  closing_cash DECIMAL(10, 2),
  expected_cash DECIMAL(10, 2),
  cash_difference DECIMAL(10, 2),
  total_sales DECIMAL(10, 2) DEFAULT 0,
  total_transactions INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  notes TEXT,
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- POS transactions
CREATE TABLE IF NOT EXISTS pos_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_number TEXT NOT NULL UNIQUE,
  session_id UUID NOT NULL REFERENCES pos_sessions(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  customer_name TEXT,
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
  discount DECIMAL(10, 2) DEFAULT 0,
  tax DECIMAL(10, 2) DEFAULT 0,
  credits_applied DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('efectivo', 'tarjeta', 'credito', 'mixto')),
  cash_received DECIMAL(10, 2),
  cash_change DECIMAL(10, 2),
  card_amount DECIMAL(10, 2),
  credit_amount DECIMAL(10, 2),
  items JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'refunded', 'partial_refund')),
  processed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generate POS transaction number
CREATE OR REPLACE FUNCTION generate_pos_transaction_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  today_prefix TEXT;
  next_seq INTEGER;
BEGIN
  today_prefix := 'T' || TO_CHAR(NOW(), 'YYMMDD');
  SELECT COALESCE(MAX(CAST(SUBSTRING(transaction_number FROM 8) AS INTEGER)), 0) + 1
  INTO next_seq
  FROM pos_transactions
  WHERE transaction_number LIKE today_prefix || '%';
  new_number := today_prefix || LPAD(next_seq::TEXT, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger for POS transaction number
CREATE OR REPLACE FUNCTION set_pos_transaction_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.transaction_number IS NULL THEN
    NEW.transaction_number := generate_pos_transaction_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_pos_transaction_number ON pos_transactions;
CREATE TRIGGER trigger_set_pos_transaction_number
  BEFORE INSERT ON pos_transactions
  FOR EACH ROW
  EXECUTE FUNCTION set_pos_transaction_number();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pos_sessions_status ON pos_sessions(status);
CREATE INDEX IF NOT EXISTS idx_pos_sessions_opened_at ON pos_sessions(opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_pos_transactions_session ON pos_transactions(session_id);
CREATE INDEX IF NOT EXISTS idx_pos_transactions_created ON pos_transactions(created_at DESC);

-- Enable RLS
ALTER TABLE pos_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_transactions ENABLE ROW LEVEL SECURITY;

-- POS sessions policies (admin/employee only)
CREATE POLICY "pos_sessions_admin" ON pos_sessions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'employee')
    )
  );

-- POS transactions policies (admin/employee only)
CREATE POLICY "pos_transactions_admin" ON pos_transactions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'employee')
    )
  );
