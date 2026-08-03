-- Permite registrar entradas de stock (inventory_entries) tanto para animales
-- como para productos, igual que ya soporta la tabla `inventory` (001_core_schema.sql).

-- 1. Agregar product_id (nullable). Regla ON DELETE RESTRICT: política del
--    proyecto es soft-delete (products/animals nunca se borran de verdad,
--    solo cambian is_active a false), así que un DELETE real sobre products
--    no debería ocurrir nunca. Si alguien lo intenta igual y hay movimientos
--    de inventario asociados, la base debe bloquear el DELETE en vez de
--    arrastrar el historial de inventory_entries con un CASCADE silencioso.
--    Pendiente de confirmar: la regla ON DELETE actual del FK de animal_id
--    en inventory_entries (no está en ningún script trackeado). Si resulta
--    ser CASCADE, decidir aparte si conviene migrarlo también a RESTRICT
--    por la misma razón — no se incluye ese cambio en esta migración.
ALTER TABLE inventory_entries
  ADD COLUMN product_id UUID REFERENCES products(id) ON DELETE RESTRICT;

-- 2. animal_id pasa a ser nullable (antes NOT NULL).
ALTER TABLE inventory_entries
  ALTER COLUMN animal_id DROP NOT NULL;

-- 3. Exactamente uno de los dos debe estar poblado.
--    Mismo patrón que inventory_item_check en 001_core_schema.sql.
--    Es seguro de aplicar sobre datos existentes: hoy TODAS las filas tienen
--    animal_id NOT NULL y product_id será NULL para todas ellas apenas se
--    agregue la columna, así que ya cumplen la rama
--    "(product_id IS NULL AND animal_id IS NOT NULL)" sin necesidad de backfill.
ALTER TABLE inventory_entries
  ADD CONSTRAINT inventory_entries_item_check CHECK (
    (product_id IS NOT NULL AND animal_id IS NULL) OR
    (product_id IS NULL AND animal_id IS NOT NULL)
  );

-- 4. Índice para lookups por producto, igual que idx_inventory_entries ya
--    tiene (implícito) uno por animal_id vía la FK original.
CREATE INDEX IF NOT EXISTS idx_inventory_entries_product ON inventory_entries(product_id);

-- NOTA sobre RLS (no incluido en esta migración):
-- No se encontraron políticas de inventory_entries en ningún script trackeado
-- (la tabla completa tiene drift respecto al control de versiones). No es seguro
-- escribir aquí DROP POLICY / CREATE POLICY a ciegas sobre políticas que no se
-- pueden verificar — podría reemplazar algo distinto a lo que asumo que existe.
-- Todo el código actual que escribe en inventory_entries usa createAdminClient()
-- (service role, bypassea RLS), así que funcionalmente esto no bloquea nada hoy.
-- Antes de aplicar esta migración, correr en Supabase Studio:
--   SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'inventory_entries';
-- y revisar manualmente si alguna política filtra explícitamente por animal_id
-- de una forma que excluya filas con animal_id NULL.

-- ─── ROLLBACK ───────────────────────────────────────────────────────────────
-- Revertir en este orden. El paso de restaurar NOT NULL en animal_id fallará
-- si para ese momento ya existen filas con animal_id NULL (entradas de
-- producto registradas después de aplicar esta migración) — en ese caso hay
-- que decidir primero qué hacer con esas filas (borrarlas o no revertir).
--
-- DROP INDEX IF EXISTS idx_inventory_entries_product;
-- ALTER TABLE inventory_entries DROP CONSTRAINT IF EXISTS inventory_entries_item_check;
-- ALTER TABLE inventory_entries DROP COLUMN IF EXISTS product_id;
-- ALTER TABLE inventory_entries ALTER COLUMN animal_id SET NOT NULL;
