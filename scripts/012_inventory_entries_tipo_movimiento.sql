-- Permite distinguir entradas de salidas dentro de inventory_entries, para
-- registrar salidas de productos (dañado, vencido, extraviado, etc.) sin
-- crear una tabla nueva. animal_mortality NO se toca: sigue siendo el
-- registro de eventos biológicos de mortalidad (RF-INV-006 a RF-INV-010),
-- con su propio valor estadístico, independiente de este movimiento de stock.

-- 1. Tipo de movimiento. DEFAULT 'entrada' para que las 3 filas existentes
--    (todas registradas hoy vía registrarEntradaInventario, ninguna es salida)
--    queden correctamente clasificadas sin backfill manual: Postgres aplica
--    el DEFAULT a las filas existentes como parte del propio ADD COLUMN.
ALTER TABLE inventory_entries
  ADD COLUMN entry_type TEXT NOT NULL DEFAULT 'entrada'
    CHECK (entry_type IN ('entrada', 'salida'));

-- 2. Motivo de la salida. NULL en entradas (no aplica). Sin CHECK de qué
--    valores puede tomar (el catálogo de motivos vive en la app, zod enum en
--    lib/inventario/schemas.ts, mismo patrón que CAUSAS_MUERTE, así que
--    cambiar/agregar un motivo no requiere otra migración) — pero sí se
--    exige que exista cuando el movimiento es una salida, para que el
--    registro tenga valor de auditoría. Seguro sobre los datos actuales:
--    las 3 filas existentes son 'entrada' por el DEFAULT del paso 1, así que
--    caen en la segunda rama del CHECK sin importar su reason (NULL hoy).
ALTER TABLE inventory_entries
  ADD COLUMN reason TEXT;

ALTER TABLE inventory_entries
  ADD CONSTRAINT inventory_entries_reason_check CHECK (
    (entry_type = 'salida' AND reason IS NOT NULL) OR
    (entry_type = 'entrada')
  );

-- 3. Índice en entry_type: NO lo agrego. Es una columna de baja cardinalidad
--    (2 valores) y la tabla es chica (3 filas hoy) — un índice simple ahí no
--    mejora nada. Si más adelante hay una consulta real del tipo "todas las
--    salidas de este producto/animal", lo que serviría es un índice
--    compuesto (product_id, entry_type) o (animal_id, entry_type), no uno
--    solo en entry_type. Se puede agregar en una migración aparte cuando
--    exista esa consulta.

-- ─── ROLLBACK ───────────────────────────────────────────────────────────────
-- Ambas columnas son aditivas (nullable la segunda, con DEFAULT la primera),
-- así que revertir es directo. Si para entonces ya hay filas con
-- entry_type='salida', esa clasificación se pierde al revertir (no hay forma
-- de recuperarla, ya no es reversible sin pérdida de datos en ese caso).
--
-- ALTER TABLE inventory_entries DROP CONSTRAINT IF EXISTS inventory_entries_reason_check;
-- ALTER TABLE inventory_entries DROP COLUMN IF EXISTS reason;
-- ALTER TABLE inventory_entries DROP COLUMN IF EXISTS entry_type;
