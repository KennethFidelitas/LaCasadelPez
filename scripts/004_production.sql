-- Production Orders Schema (Custom Aquariums)
-- Acuario La Casa del Pez

-- Production orders table
CREATE TABLE IF NOT EXISTS production_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'cotizado' CHECK (status IN (
    'cotizado', 'confirmado', 'en_produccion', 'listo', 'entregado', 'cancelado'
  )),
  payment_status TEXT NOT NULL DEFAULT 'pendiente' CHECK (payment_status IN (
    'pendiente', 'anticipo', 'pagado', 'reembolsado'
  )),
  -- Configuration
  config JSONB NOT NULL DEFAULT '{}',
  -- Aquarium specs
  width DECIMAL(6, 2), -- cm
  height DECIMAL(6, 2), -- cm
  depth DECIMAL(6, 2), -- cm
  glass_type TEXT,
  glass_thickness DECIMAL(4, 2), -- mm
  -- Accessories and extras
  accessories JSONB DEFAULT '[]',
  -- Pricing
  materials_cost DECIMAL(10, 2) DEFAULT 0,
  labor_cost DECIMAL(10, 2) DEFAULT 0,
  accessories_cost DECIMAL(10, 2) DEFAULT 0,
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
  discount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
  deposit_paid DECIMAL(10, 2) DEFAULT 0,
  -- Timeline
  estimated_days INTEGER,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  -- Contact info (for non-registered users)
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  -- Notes
  notes TEXT,
  internal_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Production notes/updates
CREATE TABLE IF NOT EXISTS production_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_order_id UUID NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  status TEXT,
  message TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generate production order number
CREATE OR REPLACE FUNCTION generate_production_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  year_prefix TEXT;
  next_seq INTEGER;
BEGIN
  year_prefix := 'P' || TO_CHAR(NOW(), 'YY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 4) AS INTEGER)), 0) + 1
  INTO next_seq
  FROM production_orders
  WHERE order_number LIKE year_prefix || '%';
  new_number := year_prefix || LPAD(next_seq::TEXT, 5, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger for production order number
CREATE OR REPLACE FUNCTION set_production_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_production_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_production_order_number ON production_orders;
CREATE TRIGGER trigger_set_production_order_number
  BEFORE INSERT ON production_orders
  FOR EACH ROW
  EXECUTE FUNCTION set_production_order_number();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_production_orders_user ON production_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_production_orders_status ON production_orders(status);
CREATE INDEX IF NOT EXISTS idx_production_orders_created ON production_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_production_updates_order ON production_updates(production_order_id);

-- Enable RLS
ALTER TABLE production_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_updates ENABLE ROW LEVEL SECURITY;

-- Production orders policies
CREATE POLICY "production_orders_select_own" ON production_orders FOR SELECT 
  USING (auth.uid() = user_id);
CREATE POLICY "production_orders_insert" ON production_orders FOR INSERT 
  WITH CHECK (true);
CREATE POLICY "production_orders_admin_all" ON production_orders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'employee')
    )
  );

-- Production updates policies
CREATE POLICY "production_updates_select_own" ON production_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM production_orders 
      WHERE production_orders.id = production_updates.production_order_id 
      AND production_orders.user_id = auth.uid()
    )
  );
CREATE POLICY "production_updates_admin_all" ON production_updates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'employee')
    )
  );
