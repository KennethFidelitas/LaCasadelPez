import Link from 'next/link'
import { ArrowRight, Fish, Droplets, Wrench, Award } from 'lucide-react'
import { Button } from '@/components/ui/actions/button'
import { createClient } from '@/lib/supabase/server'
import { FeaturedProducts } from '@/components/store/featured-products'
import { FeaturedAnimals } from '@/components/store/featured-animals'
import { CategoryGrid } from '@/components/store/category-grid'

export default async function HomePage() {
  const supabase = await createClient()

  // Fetch featured products
  const { data: products } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(8)

  // Fetch featured animals
  const { data: animals } = await supabase
    .from('animals')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(8)

  // Fetch categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .is('parent_id', null)
    .order('display_order', { ascending: true })
    .limit(6)

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-primary/5">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Tu Mundo Acuatico Comienza Aqui
              </h1>
              <p className="mt-6 text-pretty text-lg text-muted-foreground">
                Descubre nuestra amplia seleccion de peces tropicales, acuarios de alta calidad y todo lo que necesitas para crear el acuario de tus suenos. Expertos en acuarismo desde hace mas de 20 anos.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button size="lg" asChild>
                  <Link href="/tienda">
                    Explorar Tienda
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/armaTuPecera">
                    Crear Acuario a Medida
                  </Link>
                </Button>
              </div>
            </div>
            <div className="relative aspect-square lg:aspect-[4/3]">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20" />
              <div className="absolute inset-4 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30" />
              <div className="absolute inset-8 flex items-center justify-center rounded-lg bg-card shadow-lg">
                <Fish className="h-32 w-32 text-primary/50" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-y border-border bg-background py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Fish className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Peces Saludables</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Garantizamos la salud de todos nuestros ejemplares
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Droplets className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Agua de Calidad</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sistemas de filtracion y productos premium
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Wrench className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Acuarios a Medida</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Disenamos y fabricamos acuarios personalizados
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Award className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">+20 Anos de Experiencia</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Asesoria profesional para tu acuario
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Categorias
              </h2>
              <p className="mt-2 text-muted-foreground">
                Explora nuestras categorias de productos
              </p>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/tienda">
                Ver Todas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <CategoryGrid categories={categories || []} />
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="bg-muted/30 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Productos Destacados
              </h2>
              <p className="mt-2 text-muted-foreground">
                Lo mejor de nuestra tienda seleccionado para ti
              </p>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/tienda">
                Ver Todos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <FeaturedProducts products={products || []} />
        </div>
      </section>

      {/* Featured Animals Section */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Peces Tropicales
              </h2>
              <p className="mt-2 text-muted-foreground">
                Descubre nuestra coleccion de especies exoticas
              </p>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/peces">
                Ver Todos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <FeaturedAnimals animals={animals || []} />
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-primary/5 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Crea tu Acuario Ideal
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Utiliza nuestro configurador interactivo para disenar tu acuario a medida. 
              Selecciona dimensiones, tipo de vidrio, acabados y recibe una cotizacion al instante.
            </p>
            <Button size="lg" className="mt-8" asChild>
              <Link href="/configurador">
                Iniciar Configurador
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
