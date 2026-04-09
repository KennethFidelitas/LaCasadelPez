# Casa Pez

Aplicacion web construida con Next.js para la tienda del proyecto.

## Stack principal

- Next.js 16
- React 19
- TypeScript
- Supabase
- Stripe
- Tailwind CSS

## Requisitos

- Node.js 20 o superior
- pnpm instalado globalmente

Si no tienes `pnpm`:

```bash
npm install -g pnpm
```

## Instalacion

Clona el repositorio y entra al proyecto:

```bash
git clone <repo-url>
cd casa-pez
```

Instala dependencias:

```bash
pnpm install
```

## Variables de entorno

Crea un archivo `.env.local` a partir de `.env.example`:

```bash
cp .env.example .env.local
```

Completa los valores correspondientes:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `STRIPE_SECRET_KEY`

## Levantar el proyecto en local

```bash
pnpm dev
```

La app corre por defecto en [http://localhost:3000](http://localhost:3000).

## Scripts utiles

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
```

## Estructura general

```text
app/              Rutas y layouts de Next.js
components/       Componentes compartidos y componentes de tienda
hooks/            Hooks de React
lib/              Clientes, utilidades e integraciones
public/           Archivos estaticos
styles/           Estilos adicionales
```

## Flujo de ramas

El flujo del equipo va a trabajar con estas ramas:

- `master`: base estable para iniciar nuevas funcionalidades.
- `test`: rama de integracion para pruebas internas.
- `main`: rama final para produccion.

### Regla general

Cada nueva funcionalidad sale desde `master`, se desarrolla en una rama propia, luego pasa a `test` para validacion y finalmente llega a `main` mediante Pull Request aprobado por todo el equipo.

### Convencion de nombres

Usar nombres descriptivos para las ramas de trabajo. Ejemplos:

- `feature-categorias`
- `feature-carrito`
- `feature-filtros-busqueda`
- `fix-login`

## Flujo recomendado paso a paso

### 1. Actualizar `master`

```bash
git checkout master
git pull origin master
```

### 2. Crear una rama nueva desde `master`

```bash
git checkout -b feature-categorias
```

### 3. Desarrollar la funcionalidad

Haz los cambios, prueba localmente y sube la rama:

```bash
git add .
git commit -m "feat: agrega modulo de categorias"
git push origin feature-categorias
```

### 4. Integrar en `test`

Cuando la funcionalidad este lista, se abre PR hacia `test` para pruebas funcionales e integracion con el resto del trabajo.

Objetivo de `test`:

- validar que no se rompa el proyecto
- revisar comportamiento en conjunto
- hacer QA antes de produccion

### 5. Pasar a `main`

Cuando la funcionalidad ya fue validada en `test`, se abre un PR desde `test` hacia `main`.

Ese PR debe:

- ser revisado por el equipo
- tener aprobacion de todos los participantes definidos
- llegar limpio y probado

## Resumen del flujo

```text
master -> feature-nombre -> test -> main
```

## Buenas practicas para el equipo

- Siempre crear la rama nueva desde `master`.
- No trabajar directamente sobre `test`.
- No trabajar directamente sobre `main`.
- Mantener los PR pequenos y faciles de revisar.
- Escribir mensajes de commit claros.
- Probar localmente antes de abrir PR.
- Pedir revision antes de pasar cambios a `main`.

## Ejemplo completo

```bash
git checkout master
git pull origin master
git checkout -b feature-categorias

# desarrollar cambios

git add .
git commit -m "feat: agrega categorias a la tienda"
git push origin feature-categorias
```

Despues:

1. Crear PR de `feature-categorias` hacia `test`.
2. Hacer pruebas en `test`.
3. Crear PR de `test` hacia `main`.
4. Esperar aprobacion del equipo antes de mergear a `main`.

## Notas

- Si se renombra la carpeta local del proyecto y Next.js empieza a fallar, limpia cache con `rm -rf .next tsconfig.tsbuildinfo` y vuelve a correr `pnpm dev`.
- Si faltan variables de entorno, Supabase y Stripe pueden fallar al iniciar.
