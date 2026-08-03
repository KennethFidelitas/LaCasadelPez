-- Agrega la marca del producto como columna de primera clase, en vez de
-- guardarla en meta (precedente en scripts/insert_sample_products.sql, que
-- mete "brand" dentro del JSONB) — más simple de leer/validar desde el
-- formulario de alta de producto, consistente con el resto de columnas
-- explícitas de products (description, price, sku, etc.).

-- Nullable, texto libre: no todos los productos necesariamente tienen marca
-- (ej. accesorios genéricos), y no hay catálogo cerrado de marcas que
-- justifique un CHECK o una tabla aparte.
ALTER TABLE products
  ADD COLUMN brand TEXT;

-- Sin índice: no hay ningún filtro/búsqueda por marca previsto todavía. Si
-- más adelante se necesita filtrar el catálogo por marca, agregar
-- CREATE INDEX idx_products_brand ON products(brand) en una migración aparte.

-- ─── ROLLBACK ───────────────────────────────────────────────────────────────
-- Aditiva y nullable — revertir es directo, sin condiciones especiales.
--
-- ALTER TABLE products DROP COLUMN IF EXISTS brand;
