-- Core Schema: Categories, Products, Animals, Inventory
-- Acuario La Casa del Pez

-- Categories table (for both products and animals)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('product', 'animal')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table (filters, food, accessories, aquariums)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  compare_at_price DECIMAL(10, 2) CHECK (compare_at_price >= 0),
  cost DECIMAL(10, 2) CHECK (cost >= 0),
  sku TEXT UNIQUE,
  barcode TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  images TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  weight DECIMAL(10, 3),
  dimensions JSONB,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Animals table (fish, invertebrates, plants)
CREATE TABLE IF NOT EXISTS animals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  scientific_name TEXT,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  compare_at_price DECIMAL(10, 2) CHECK (compare_at_price >= 0),
  cost DECIMAL(10, 2) CHECK (cost >= 0),
  sku TEXT UNIQUE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  images TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  -- Care information
  care_level TEXT CHECK (care_level IN ('facil', 'moderado', 'avanzado')),
  temperament TEXT CHECK (temperament IN ('pacifico', 'semi-agresivo', 'agresivo')),
  diet TEXT,
  min_tank_size INTEGER, -- in liters
  temperature_min DECIMAL(4, 1),
  temperature_max DECIMAL(4, 1),
  ph_min DECIMAL(3, 1),
  ph_max DECIMAL(3, 1),
  max_size DECIMAL(5, 1), -- in cm
  origin TEXT,
  lifespan TEXT,
  compatibility TEXT[],
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory table (unified for products and animals)
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  animal_id UUID REFERENCES animals(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  low_stock_threshold INTEGER DEFAULT 5,
  location TEXT DEFAULT 'almacen',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT inventory_item_check CHECK (
    (product_id IS NOT NULL AND animal_id IS NULL) OR
    (product_id IS NULL AND animal_id IS NOT NULL)
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_animals_category ON animals(category_id);
CREATE INDEX IF NOT EXISTS idx_animals_active ON animals(is_active);
CREATE INDEX IF NOT EXISTS idx_animals_featured ON animals(is_featured);
CREATE INDEX IF NOT EXISTS idx_animals_slug ON animals(slug);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_animal ON inventory(animal_id);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Public read access for categories, products, animals (storefront)
CREATE POLICY "categories_public_read" ON categories FOR SELECT USING (true);
CREATE POLICY "products_public_read" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "animals_public_read" ON animals FOR SELECT USING (is_active = true);
CREATE POLICY "inventory_public_read" ON inventory FOR SELECT USING (true);

-- Admin policies will be added after profiles table is created
