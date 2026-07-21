-- Return requests schema
-- Acuario La Casa del Pez

CREATE TABLE IF NOT EXISTS return_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES order_items(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN (
    'no_satisfecho', 'producto_danado', 'producto_incorrecto', 'otro'
  )),
  details TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN (
    'pendiente', 'aprobada', 'rechazada'
  )),
  requested_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (requested_amount >= 0),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_return_requests_order ON return_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_user ON return_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_status ON return_requests(status);
CREATE INDEX IF NOT EXISTS idx_return_requests_created ON return_requests(created_at DESC);

ALTER TABLE return_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "return_requests_select_own" ON return_requests;
CREATE POLICY "return_requests_select_own" ON return_requests FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "return_requests_insert_own" ON return_requests;
CREATE POLICY "return_requests_insert_own" ON return_requests FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = return_requests.order_id
        AND orders.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "return_requests_admin_all" ON return_requests;
CREATE POLICY "return_requests_admin_all" ON return_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'employee')
    )
  );
