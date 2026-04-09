-- Seed Data for Acuario La Casa del Pez
-- Sample categories, products, and animals

-- Product Categories
INSERT INTO categories (name, slug, description, type) VALUES
  ('Acuarios', 'acuarios', 'Acuarios de vidrio de todas las medidas', 'product'),
  ('Filtros', 'filtros', 'Filtros internos, externos y de cascada', 'product'),
  ('Iluminación', 'iluminacion', 'Lámparas LED y fluorescentes', 'product'),
  ('Alimento', 'alimento', 'Alimento para peces de agua dulce y salada', 'product'),
  ('Decoración', 'decoracion', 'Plantas artificiales, rocas y adornos', 'product'),
  ('Calentadores', 'calentadores', 'Calentadores y termómetros', 'product'),
  ('Accesorios', 'accesorios', 'Redes, mangueras, válvulas y más', 'product'),
  ('Medicamentos', 'medicamentos', 'Tratamientos y acondicionadores de agua', 'product')
ON CONFLICT (slug) DO NOTHING;

-- Animal Categories
INSERT INTO categories (name, slug, description, type) VALUES
  ('Peces Tropicales', 'peces-tropicales', 'Peces de agua dulce tropical', 'animal'),
  ('Peces de Agua Fría', 'peces-agua-fria', 'Goldfish y carpas', 'animal'),
  ('Peces Marinos', 'peces-marinos', 'Peces de agua salada', 'animal'),
  ('Bettas', 'bettas', 'Peces betta de colores variados', 'animal'),
  ('Cíclidos', 'ciclidos', 'Cíclidos africanos y americanos', 'animal'),
  ('Invertebrados', 'invertebrados', 'Caracoles, camarones y cangrejos', 'animal'),
  ('Plantas Vivas', 'plantas-vivas', 'Plantas acuáticas naturales', 'animal')
ON CONFLICT (slug) DO NOTHING;

-- Sample Products
INSERT INTO products (name, slug, description, price, compare_at_price, sku, category_id, is_featured, images) VALUES
  (
    'Acuario Rectangular 40L',
    'acuario-rectangular-40l',
    'Acuario de vidrio de 40 litros, medidas 50x25x32cm. Ideal para principiantes.',
    899.00,
    1099.00,
    'ACU-R40',
    (SELECT id FROM categories WHERE slug = 'acuarios'),
    true,
    ARRAY['https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800']
  ),
  (
    'Acuario Rectangular 80L',
    'acuario-rectangular-80l',
    'Acuario de vidrio de 80 litros, medidas 60x30x45cm. Para acuaristas intermedios.',
    1599.00,
    NULL,
    'ACU-R80',
    (SELECT id FROM categories WHERE slug = 'acuarios'),
    true,
    ARRAY['https://images.unsplash.com/photo-1520301255226-bf5f144451c1?w=800']
  ),
  (
    'Filtro de Cascada HBL-302',
    'filtro-cascada-hbl-302',
    'Filtro de cascada para acuarios de 20-40 litros. Silencioso y eficiente.',
    349.00,
    NULL,
    'FIL-HBL302',
    (SELECT id FROM categories WHERE slug = 'filtros'),
    false,
    ARRAY['https://images.unsplash.com/photo-1584267385494-9fdd9a71ad75?w=800']
  ),
  (
    'Filtro Canister 1000L/H',
    'filtro-canister-1000',
    'Filtro externo canister con capacidad de 1000 litros por hora. Incluye medios filtrantes.',
    2899.00,
    3299.00,
    'FIL-CAN1000',
    (SELECT id FROM categories WHERE slug = 'filtros'),
    true,
    ARRAY['https://images.unsplash.com/photo-1584267385494-9fdd9a71ad75?w=800']
  ),
  (
    'Lámpara LED 60cm',
    'lampara-led-60cm',
    'Lámpara LED de 60cm para acuarios. Luz blanca y azul, ideal para plantas.',
    599.00,
    NULL,
    'LED-60',
    (SELECT id FROM categories WHERE slug = 'iluminacion'),
    false,
    ARRAY['https://images.unsplash.com/photo-1518882605630-8ebf4c05a5d1?w=800']
  ),
  (
    'Alimento en Hojuelas Premium 100g',
    'alimento-hojuelas-premium-100g',
    'Alimento en hojuelas de alta calidad para peces tropicales. Rico en proteínas.',
    89.00,
    NULL,
    'ALI-HOJ100',
    (SELECT id FROM categories WHERE slug = 'alimento'),
    false,
    ARRAY['https://images.unsplash.com/photo-1585325701165-351af916a581?w=800']
  ),
  (
    'Alimento para Bettas 30g',
    'alimento-bettas-30g',
    'Alimento especial para peces betta. Gránulos flotantes.',
    65.00,
    NULL,
    'ALI-BET30',
    (SELECT id FROM categories WHERE slug = 'alimento'),
    false,
    ARRAY['https://images.unsplash.com/photo-1585325701165-351af916a581?w=800']
  ),
  (
    'Calentador 100W',
    'calentador-100w',
    'Calentador sumergible de 100W con termostato. Para acuarios de 50-100 litros.',
    299.00,
    NULL,
    'CAL-100W',
    (SELECT id FROM categories WHERE slug = 'calentadores'),
    false,
    ARRAY['https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800']
  ),
  (
    'Tronco Decorativo Natural',
    'tronco-decorativo-natural',
    'Tronco natural tratado para acuarios. Aproximadamente 20-25cm.',
    189.00,
    NULL,
    'DEC-TRON01',
    (SELECT id FROM categories WHERE slug = 'decoracion'),
    true,
    ARRAY['https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=800']
  ),
  (
    'Acondicionador de Agua 250ml',
    'acondicionador-agua-250ml',
    'Neutraliza cloro y metales pesados. Protege las branquias de los peces.',
    129.00,
    NULL,
    'MED-ACOND250',
    (SELECT id FROM categories WHERE slug = 'medicamentos'),
    false,
    ARRAY['https://images.unsplash.com/photo-1584267385494-9fdd9a71ad75?w=800']
  )
ON CONFLICT (slug) DO NOTHING;

-- Sample Animals
INSERT INTO animals (name, slug, scientific_name, description, price, sku, category_id, is_featured, images, care_level, temperament, diet, min_tank_size, temperature_min, temperature_max, ph_min, ph_max, max_size, origin, lifespan) VALUES
  (
    'Guppy Macho Surtido',
    'guppy-macho-surtido',
    'Poecilia reticulata',
    'Guppy macho de colores variados. Pez ideal para principiantes, muy activo y colorido.',
    35.00,
    'PEZ-GUP01',
    (SELECT id FROM categories WHERE slug = 'peces-tropicales'),
    true,
    ARRAY['https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=800'],
    'facil',
    'pacifico',
    'Omnívoro - acepta hojuelas y alimento vivo',
    20,
    22.0, 28.0,
    6.8, 7.8,
    5.0,
    'América del Sur',
    '2-3 años'
  ),
  (
    'Neón Cardenal',
    'neon-cardenal',
    'Paracheirodon axelrodi',
    'Hermoso pez con franja azul y roja brillante. Debe mantenerse en grupos de 6 o más.',
    25.00,
    'PEZ-NEON01',
    (SELECT id FROM categories WHERE slug = 'peces-tropicales'),
    true,
    ARRAY['https://images.unsplash.com/photo-1520302630591-fd1c66edc19d?w=800'],
    'moderado',
    'pacifico',
    'Omnívoro - micro gránulos y alimento vivo pequeño',
    40,
    24.0, 28.0,
    5.5, 7.0,
    4.0,
    'Colombia, Brasil',
    '3-5 años'
  ),
  (
    'Betta Macho Halfmoon',
    'betta-macho-halfmoon',
    'Betta splendens',
    'Betta macho con cola en forma de media luna. Colores variados.',
    150.00,
    'PEZ-BET01',
    (SELECT id FROM categories WHERE slug = 'bettas'),
    true,
    ARRAY['https://images.unsplash.com/photo-1520990149316-9d2f49d5e8e6?w=800'],
    'facil',
    'agresivo',
    'Carnívoro - alimento específico para bettas',
    10,
    24.0, 30.0,
    6.5, 7.5,
    7.0,
    'Tailandia',
    '3-5 años'
  ),
  (
    'Goldfish Oranda Rojo',
    'goldfish-oranda-rojo',
    'Carassius auratus',
    'Goldfish oranda con capucha pronunciada color rojo intenso.',
    180.00,
    'PEZ-GOLD01',
    (SELECT id FROM categories WHERE slug = 'peces-agua-fria'),
    true,
    ARRAY['https://images.unsplash.com/photo-1524704654690-b56c05c78a00?w=800'],
    'facil',
    'pacifico',
    'Omnívoro - alimento para goldfish',
    75,
    18.0, 23.0,
    6.5, 7.5,
    20.0,
    'Asia',
    '10-15 años'
  ),
  (
    'Corydora Paleatus',
    'corydora-paleatus',
    'Corydoras paleatus',
    'Pez de fondo que ayuda a limpiar el acuario. Mantener en grupos.',
    45.00,
    'PEZ-CORY01',
    (SELECT id FROM categories WHERE slug = 'peces-tropicales'),
    false,
    ARRAY['https://images.unsplash.com/photo-1571752726703-5e7d1f6a986d?w=800'],
    'facil',
    'pacifico',
    'Omnívoro - pastillas de fondo',
    40,
    20.0, 26.0,
    6.0, 7.5,
    6.0,
    'América del Sur',
    '5-8 años'
  ),
  (
    'Ángel Escalar Plateado',
    'angel-escalar-plateado',
    'Pterophyllum scalare',
    'Elegante pez ángel de color plateado con rayas negras.',
    120.00,
    'PEZ-ANG01',
    (SELECT id FROM categories WHERE slug = 'ciclidos'),
    true,
    ARRAY['https://images.unsplash.com/photo-1571752726703-5e7d1f6a986d?w=800'],
    'moderado',
    'semi-agresivo',
    'Omnívoro - hojuelas, gránulos y alimento vivo',
    100,
    24.0, 28.0,
    6.0, 7.5,
    15.0,
    'Amazonas',
    '10+ años'
  ),
  (
    'Camarón Cherry Rojo',
    'camaron-cherry-rojo',
    'Neocaridina davidi',
    'Pequeño camarón de color rojo brillante. Excelente limpiador de algas.',
    35.00,
    'INV-CAM01',
    (SELECT id FROM categories WHERE slug = 'invertebrados'),
    false,
    ARRAY['https://images.unsplash.com/photo-1571752726703-5e7d1f6a986d?w=800'],
    'facil',
    'pacifico',
    'Omnívoro - come algas y restos de comida',
    10,
    18.0, 26.0,
    6.5, 7.5,
    3.0,
    'Taiwán',
    '1-2 años'
  ),
  (
    'Pleco Común',
    'pleco-comun',
    'Hypostomus plecostomus',
    'Pez limpiador de fondo. Crece bastante, necesita acuario grande.',
    89.00,
    'PEZ-PLEC01',
    (SELECT id FROM categories WHERE slug = 'peces-tropicales'),
    false,
    ARRAY['https://images.unsplash.com/photo-1571752726703-5e7d1f6a986d?w=800'],
    'facil',
    'pacifico',
    'Herbívoro - algas, pastillas de espirulina',
    200,
    22.0, 28.0,
    6.5, 7.5,
    40.0,
    'América del Sur',
    '10-15 años'
  )
ON CONFLICT (slug) DO NOTHING;

-- Create inventory records for all products and animals
INSERT INTO inventory (product_id, quantity, low_stock_threshold)
SELECT id, 
  CASE 
    WHEN slug LIKE 'acuario%' THEN floor(random() * 10 + 3)::int
    WHEN slug LIKE 'filtro%' THEN floor(random() * 15 + 5)::int
    ELSE floor(random() * 30 + 10)::int
  END,
  5
FROM products
ON CONFLICT DO NOTHING;

INSERT INTO inventory (animal_id, quantity, low_stock_threshold)
SELECT id,
  CASE 
    WHEN slug LIKE 'betta%' THEN floor(random() * 8 + 2)::int
    WHEN slug LIKE 'goldfish%' THEN floor(random() * 10 + 3)::int
    ELSE floor(random() * 30 + 10)::int
  END,
  3
FROM animals
ON CONFLICT DO NOTHING;
