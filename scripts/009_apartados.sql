-- ============================================================
-- Módulo de Apartados
-- Acuario La Casa del Pez — RF-VEN-010 a RF-VEN-016
-- Base: script original del compañero, con 2 fixes y la tabla
-- apartado_payments (RF-VEN-012, abonos parciales) agregada.
-- ============================================================

-- ============================================================
-- SECUENCIA PARA NÚMERO DE APARTADO
-- Evita problemas cuando varios usuarios crean apartados
-- simultáneamente.
-- ============================================================

CREATE SEQUENCE IF NOT EXISTS apartado_sequence
START 1
INCREMENT 1;

-- ============================================================
-- TABLA APARTADOS
-- ============================================================

CREATE TABLE IF NOT EXISTS apartados (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    apartado_number TEXT UNIQUE,

    user_id UUID
        REFERENCES profiles(id)
        ON DELETE SET NULL,

    customer_name TEXT NOT NULL,

    customer_email TEXT,

    customer_phone TEXT NOT NULL,

    item_type TEXT NOT NULL
        CHECK (
            item_type IN (
                'product',
                'animal',
                'pecera_prediseno',
                'pecera_personalizada'
            )
        ),

    quantity INTEGER NOT NULL
        DEFAULT 1
        CHECK (quantity > 0),

    product_id UUID
        REFERENCES products(id)
        ON DELETE SET NULL,

    animal_id UUID
        REFERENCES animals(id)
        ON DELETE SET NULL,

    aquarium_config JSONB
        DEFAULT '{}',

    total_price DECIMAL(10,2)
        NOT NULL
        CHECK (total_price > 0),

    deposit_amount DECIMAL(10,2)
        NOT NULL
        CHECK (deposit_amount > 0),

    balance DECIMAL(10,2)
        GENERATED ALWAYS AS
        (
            total_price - deposit_amount
        ) STORED,

    status TEXT NOT NULL
        DEFAULT 'activo'
        CHECK (
            status IN
            (
                'activo',
                'pagado',
                'cancelado',
                'vencido'
            )
        ),

    expires_at TIMESTAMPTZ
        NOT NULL
        DEFAULT (
            NOW() + INTERVAL '7 days'
        ),

    created_by UUID
        REFERENCES profiles(id)
        ON DELETE SET NULL,

    cancelled_by UUID
        REFERENCES profiles(id)
        ON DELETE SET NULL,

    cancelled_at TIMESTAMPTZ,

    cancellation_reason TEXT,

    production_order_id UUID
        REFERENCES production_orders(id)
        ON DELETE SET NULL,

    notes TEXT,

    created_at TIMESTAMPTZ
        DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        DEFAULT NOW(),

    -- FIX: se quitó "AND production_order_id IS NULL" de las 3 ramas.
    -- Con la condición original, el trigger que asigna production_order_id
    -- al pasar a 'pagado' (más abajo) hacía que este CHECK fallara y
    -- abortara el UPDATE en cualquier apartado de pecera.
    CONSTRAINT chk_apartado_item
    CHECK (

        (

            item_type='product'

            AND product_id IS NOT NULL

            AND animal_id IS NULL

        )

        OR

        (

            item_type='animal'

            AND animal_id IS NOT NULL

            AND product_id IS NULL

        )

        OR

        (

            item_type IN
            (
                'pecera_prediseno',
                'pecera_personalizada'
            )

            AND product_id IS NULL

            AND animal_id IS NULL

        )

    ),

    CONSTRAINT chk_deposit_le_total
    CHECK (
        deposit_amount <= total_price
    )

);

-- ============================================================
-- TABLA PAGOS PARCIALES (RF-VEN-012)
-- Ledger de abonos al apartado; deposit_amount en `apartados`
-- se actualiza desde la app cada vez que se inserta un pago.
-- ============================================================

CREATE TABLE IF NOT EXISTS apartado_payments (

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    apartado_id UUID NOT NULL
        REFERENCES apartados(id)
        ON DELETE CASCADE,

    amount DECIMAL(10,2)
        NOT NULL
        CHECK (amount > 0),

    payment_method TEXT NOT NULL
        CHECK (
            payment_method IN (
                'efectivo',
                'tarjeta',
                'credito',
                'mixto'
            )
        ),

    received_by UUID
        REFERENCES profiles(id)
        ON DELETE SET NULL,

    notes TEXT,

    created_at TIMESTAMPTZ
        DEFAULT NOW()

);

-- ============================================================
-- TABLA ALERTAS
-- ============================================================

CREATE TABLE IF NOT EXISTS apartado_alerts (

    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    apartado_id UUID NOT NULL
        REFERENCES apartados(id)
        ON DELETE CASCADE,

    alert_type TEXT NOT NULL
        CHECK (

            alert_type IN (

                'vencimiento_3dias',

                'vencimiento_1dia',

                'vencido',

                'cancelado'

            )

        ),

    resolved BOOLEAN
        NOT NULL
        DEFAULT FALSE,

    resolved_by UUID
        REFERENCES profiles(id)
        ON DELETE SET NULL,

    resolved_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ
        DEFAULT NOW()

);

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_apartados_status
ON apartados(status);

CREATE INDEX IF NOT EXISTS idx_apartados_expires
ON apartados(expires_at);

CREATE INDEX IF NOT EXISTS idx_apartados_user
ON apartados(user_id);

CREATE INDEX IF NOT EXISTS idx_apartados_created
ON apartados(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_apartados_product
ON apartados(product_id);

CREATE INDEX IF NOT EXISTS idx_apartados_animal
ON apartados(animal_id);

CREATE INDEX IF NOT EXISTS idx_apartados_production
ON apartados(production_order_id);

CREATE INDEX IF NOT EXISTS idx_alert_resolved
ON apartado_alerts(resolved);

CREATE INDEX IF NOT EXISTS idx_alert_apartado
ON apartado_alerts(apartado_id);

CREATE INDEX IF NOT EXISTS idx_apartado_payments_apartado
ON apartado_payments(apartado_id);

-- ============================================================
-- FUNCIONES BASE Y TRIGGERS
-- ============================================================

-- ============================================================
-- GENERAR NÚMERO DE APARTADO
-- ============================================================

CREATE OR REPLACE FUNCTION set_apartado_number()
RETURNS TRIGGER AS
$$
BEGIN

    IF NEW.apartado_number IS NULL THEN

        NEW.apartado_number :=
            'APT'
            || TO_CHAR(CURRENT_DATE,'YY')
            || LPAD(nextval('apartado_sequence')::TEXT,6,'0');

    END IF;

    RETURN NEW;

END;
$$
LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_apartado_number
ON apartados;

CREATE TRIGGER trigger_set_apartado_number
BEFORE INSERT
ON apartados
FOR EACH ROW
EXECUTE FUNCTION set_apartado_number();

-- ============================================================
-- ACTUALIZAR updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_apartado_updated_at()
RETURNS TRIGGER AS
$$
BEGIN

    NEW.updated_at := NOW();

    RETURN NEW;

END;
$$
LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_apartado
ON apartados;

CREATE TRIGGER trigger_update_apartado
BEFORE UPDATE
ON apartados
FOR EACH ROW
EXECUTE FUNCTION update_apartado_updated_at();

-- ============================================================
-- DESCONTAR INVENTARIO AL CREAR APARTADO
-- ============================================================

CREATE OR REPLACE FUNCTION reserve_inventory_for_apartado()
RETURNS TRIGGER AS
$$

DECLARE

    current_stock INTEGER;

BEGIN

    ----------------------------------------------------
    -- PRODUCTOS
    ----------------------------------------------------

    IF NEW.product_id IS NOT NULL THEN

        SELECT quantity
        INTO current_stock
        FROM inventory
        WHERE product_id = NEW.product_id
        FOR UPDATE;

        IF current_stock IS NULL THEN

            RAISE EXCEPTION
            'No existe inventario para el producto.';

        END IF;

        IF current_stock < NEW.quantity THEN

            RAISE EXCEPTION
            'Inventario insuficiente. Disponible %, solicitado %.',
            current_stock,
            NEW.quantity;

        END IF;

        UPDATE inventory

        SET quantity = quantity - NEW.quantity,

            updated_at = NOW()

        WHERE product_id = NEW.product_id;

    END IF;

    ----------------------------------------------------
    -- ANIMALES
    ----------------------------------------------------

    IF NEW.animal_id IS NOT NULL THEN

        SELECT quantity
        INTO current_stock
        FROM inventory
        WHERE animal_id = NEW.animal_id
        FOR UPDATE;

        IF current_stock IS NULL THEN

            RAISE EXCEPTION
            'No existe inventario para el animal.';

        END IF;

        IF current_stock < NEW.quantity THEN

            RAISE EXCEPTION
            'Inventario insuficiente. Disponible %, solicitado %.',
            current_stock,
            NEW.quantity;

        END IF;

        UPDATE inventory

        SET quantity = quantity - NEW.quantity,

            updated_at = NOW()

        WHERE animal_id = NEW.animal_id;

    END IF;

    RETURN NEW;

END;

$$
LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_reserve_inventory
ON apartados;

CREATE TRIGGER trigger_reserve_inventory
AFTER INSERT
ON apartados
FOR EACH ROW
EXECUTE FUNCTION reserve_inventory_for_apartado();

-- ============================================================
-- DEVOLVER INVENTARIO AL CANCELAR O VENCER
-- ============================================================

CREATE OR REPLACE FUNCTION handle_apartado_cancellation()
RETURNS TRIGGER AS
$$
BEGIN

    ---------------------------------------------------------
    -- Solo actuar cuando cambia a cancelado o vencido
    ---------------------------------------------------------

    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    IF NEW.status IN ('cancelado','vencido') THEN

        -----------------------------------------------------
        -- DEVOLVER PRODUCTOS
        -----------------------------------------------------

        IF NEW.product_id IS NOT NULL THEN

            UPDATE inventory

            SET quantity = quantity + NEW.quantity,

                updated_at = NOW()

            WHERE product_id = NEW.product_id;

        END IF;

        -----------------------------------------------------
        -- DEVOLVER ANIMALES
        -----------------------------------------------------

        IF NEW.animal_id IS NOT NULL THEN

            UPDATE inventory

            SET quantity = quantity + NEW.quantity,

                updated_at = NOW()

            WHERE animal_id = NEW.animal_id;

        END IF;

        -----------------------------------------------------
        -- CREAR ALERTA
        -- FIX: usar NEW.status en vez de 'cancelado' fijo, para
        -- no etiquetar un vencimiento automático como cancelación.
        -----------------------------------------------------

        INSERT INTO apartado_alerts
        (
            apartado_id,
            alert_type
        )
        VALUES
        (
            NEW.id,
            NEW.status
        )
        ON CONFLICT DO NOTHING;

    END IF;

    RETURN NEW;

END;
$$
LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_apartado_cancellation
ON apartados;

CREATE TRIGGER trigger_apartado_cancellation
AFTER UPDATE
ON apartados
FOR EACH ROW
EXECUTE FUNCTION handle_apartado_cancellation();

-- ============================================================
-- CREAR ORDEN DE PRODUCCIÓN
-- ============================================================

CREATE OR REPLACE FUNCTION create_production_order_from_apartado()
RETURNS TRIGGER AS
$$

DECLARE

    new_order_id UUID;

BEGIN

    ---------------------------------------------------------
    -- Solo crear una vez
    ---------------------------------------------------------

    IF

        OLD.status='activo'

        AND NEW.status='pagado'

        AND NEW.production_order_id IS NULL

        AND NEW.item_type IN
        (
            'pecera_prediseno',
            'pecera_personalizada'
        )

    THEN

        INSERT INTO production_orders
        (

            user_id,

            status,

            payment_status,

            config,

            width,

            height,

            depth,

            glass_type,

            glass_thickness,

            accessories,

            materials_cost,

            labor_cost,

            accessories_cost,

            subtotal,

            discount,

            total,

            deposit_paid,

            estimated_days,

            customer_name,

            customer_email,

            customer_phone,

            notes

        )

        VALUES

        (

            NEW.user_id,

            'confirmado',

            'anticipo',

            NEW.aquarium_config,

            NULLIF(
                NEW.aquarium_config->>'width',
                ''
            )::DECIMAL,

            NULLIF(
                NEW.aquarium_config->>'height',
                ''
            )::DECIMAL,

            NULLIF(
                NEW.aquarium_config->>'depth',
                ''
            )::DECIMAL,

            NEW.aquarium_config->>'glass_type',

            NULLIF(
                NEW.aquarium_config->>'glass_thickness',
                ''
            )::DECIMAL,

            COALESCE(
                NEW.aquarium_config->'accessories',
                '[]'::jsonb
            ),

            0,

            0,

            0,

            NEW.total_price,

            0,

            NEW.total_price,

            NEW.deposit_amount,

            30,

            NEW.customer_name,

            NEW.customer_email,

            NEW.customer_phone,

            'Generada automáticamente desde apartado '
            || NEW.apartado_number

        )

        RETURNING id

        INTO new_order_id;

        NEW.production_order_id := new_order_id;

    END IF;

    RETURN NEW;

END;
$$
LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_production_from_apartado
ON apartados;

CREATE TRIGGER trigger_create_production_from_apartado
BEFORE UPDATE
ON apartados
FOR EACH ROW
EXECUTE FUNCTION create_production_order_from_apartado();

-- ============================================================
-- GENERAR ALERTAS (RF-VEN-015, se llama "al vuelo" desde la app)
-- ============================================================

CREATE OR REPLACE FUNCTION generate_apartado_alerts()
RETURNS INTEGER
AS
$$

DECLARE

    alerts_created INTEGER := 0;
    rows_affected INTEGER;

BEGIN

    ------------------------------------------------------------
    -- ALERTA 3 DÍAS
    ------------------------------------------------------------

    INSERT INTO apartado_alerts
    (
        apartado_id,
        alert_type
    )

    SELECT

        a.id,

        'vencimiento_3dias'

    FROM apartados a

    WHERE

        a.status='activo'

        AND a.expires_at >

            NOW() + INTERVAL '1 day'

        AND a.expires_at <=

            NOW() + INTERVAL '3 days'

        AND NOT EXISTS
        (

            SELECT 1

            FROM apartado_alerts aa

            WHERE

                aa.apartado_id=a.id

                AND aa.alert_type='vencimiento_3dias'

        );

    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    alerts_created := alerts_created + rows_affected;

    ------------------------------------------------------------
    -- ALERTA 1 DÍA
    ------------------------------------------------------------

    INSERT INTO apartado_alerts
    (
        apartado_id,
        alert_type
    )

    SELECT

        a.id,

        'vencimiento_1dia'

    FROM apartados a

    WHERE

        a.status='activo'

        AND a.expires_at >

            NOW()

        AND a.expires_at <=

            NOW() + INTERVAL '1 day'

        AND NOT EXISTS
        (

            SELECT 1

            FROM apartado_alerts aa

            WHERE

                aa.apartado_id=a.id

                AND aa.alert_type='vencimiento_1dia'

        );

    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    alerts_created := alerts_created + rows_affected;

    ------------------------------------------------------------
    -- MARCAR COMO VENCIDOS
    -- (el trigger de cancelación devuelve el inventario y
    -- registra la alerta 'vencido' automáticamente)
    ------------------------------------------------------------

    UPDATE apartados

    SET

        status='vencido',

        updated_at=NOW()

    WHERE

        status='activo'

        AND expires_at < NOW();

    RETURN alerts_created;

END;

$$
LANGUAGE plpgsql;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE apartados
ENABLE ROW LEVEL SECURITY;

ALTER TABLE apartado_alerts
ENABLE ROW LEVEL SECURITY;

ALTER TABLE apartado_payments
ENABLE ROW LEVEL SECURITY;

---------------------------------------------------------------
-- CLIENTES
---------------------------------------------------------------

DROP POLICY IF EXISTS apartados_select_own
ON apartados;

CREATE POLICY apartados_select_own

ON apartados

FOR SELECT

USING
(
    auth.uid() = user_id
);

---------------------------------------------------------------
-- EMPLEADOS Y ADMIN
---------------------------------------------------------------

DROP POLICY IF EXISTS apartados_staff_all
ON apartados;

CREATE POLICY apartados_staff_all

ON apartados

FOR ALL

USING
(

    EXISTS
    (

        SELECT 1

        FROM profiles

        WHERE

            id=auth.uid()

            AND role IN
            (

                'admin',

                'employee'

            )

    )

)

WITH CHECK
(

    EXISTS
    (

        SELECT 1

        FROM profiles

        WHERE

            id=auth.uid()

            AND role IN
            (

                'admin',

                'employee'

            )

    )

);

---------------------------------------------------------------
-- ALERTAS
---------------------------------------------------------------

DROP POLICY IF EXISTS apartado_alerts_staff_all
ON apartado_alerts;

CREATE POLICY apartado_alerts_staff_all

ON apartado_alerts

FOR ALL

USING
(

    EXISTS
    (

        SELECT 1

        FROM profiles

        WHERE

            id=auth.uid()

            AND role IN
            (

                'admin',

                'employee'

            )

    )

)

WITH CHECK
(

    EXISTS
    (

        SELECT 1

        FROM profiles

        WHERE

            id=auth.uid()

            AND role IN
            (

                'admin',

                'employee'

            )

    )

);

---------------------------------------------------------------
-- PAGOS PARCIALES
---------------------------------------------------------------

DROP POLICY IF EXISTS apartado_payments_staff_all
ON apartado_payments;

CREATE POLICY apartado_payments_staff_all

ON apartado_payments

FOR ALL

USING
(

    EXISTS
    (

        SELECT 1

        FROM profiles

        WHERE

            id=auth.uid()

            AND role IN
            (

                'admin',

                'employee'

            )

    )

)

WITH CHECK
(

    EXISTS
    (

        SELECT 1

        FROM profiles

        WHERE

            id=auth.uid()

            AND role IN
            (

                'admin',

                'employee'

            )

    )

);

-- ============================================================
-- FIN DEL MÓDULO
-- ============================================================
