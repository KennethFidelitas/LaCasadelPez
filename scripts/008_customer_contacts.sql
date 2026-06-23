-- Customer contacts managed by staff
-- Acuario La Casa del Pez

CREATE TABLE IF NOT EXISTS customer_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT customer_contacts_email_or_phone_check CHECK (
    COALESCE(NULLIF(BTRIM(email), ''), NULL) IS NOT NULL
    OR COALESCE(NULLIF(BTRIM(phone), ''), NULL) IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_customer_contacts_created_at ON customer_contacts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_contacts_email ON customer_contacts(email);
CREATE INDEX IF NOT EXISTS idx_customer_contacts_phone ON customer_contacts(phone);

ALTER TABLE customer_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_contacts_staff_all" ON customer_contacts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'employee')
    )
  );
