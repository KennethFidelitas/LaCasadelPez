-- Permitir registrar nuevos animales
CREATE POLICY "animals_insert_authenticated"
ON animals
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Permitir registrar inventario de animales
CREATE POLICY "inventory_insert_authenticated"
ON inventory
FOR INSERT
TO authenticated
WITH CHECK (true);