import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  Check,
  Droplets,
  Fish,
  HeartHandshake,
  Ruler,
  Sparkles,
  Wrench,
} from 'lucide-react'
import { Button } from '@/components/ui/actions/button'

const values = [
  {
    icon: HeartHandshake,
    title: 'Acompanamiento real',
    description: 'Te ayudamos a elegir con criterio, desde el primer pez hasta tu proyecto completo.',
  },
  {
    icon: Ruler,
    title: 'Diseno a tu medida',
    description: 'Pensamos cada acuario para que encaje con tu espacio, estilo y presupuesto.',
  },
  {
    icon: Droplets,
    title: 'Bienestar primero',
    description: 'Recomendamos soluciones que cuidan la calidad del agua y la vida de tus peces.',
  },
]

const processSteps = [
  { number: '01', title: 'Te escuchamos', text: 'Conocemos tu espacio, tus ideas y el tipo de vida acuatica que quieres crear.' },
  { number: '02', title: 'Lo hacemos posible', text: 'Definimos dimensiones, materiales y equipamiento con una propuesta clara.' },
  { number: '03', title: 'Te acompanamos', text: 'Te entregamos una solucion lista para disfrutar y el respaldo para mantenerla.' },
]

export function AboutPage() {
  return (
    <div className="overflow-hidden">
      <section className="relative border-b border-border bg-[#102b3f] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(72,190,185,0.25),transparent_36%),linear-gradient(110deg,rgba(16,43,63,0.98),rgba(16,43,63,0.82))]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-24">
          <div className="max-w-xl">
            <div className="mb-6 flex items-center gap-3 text-sm font-medium uppercase tracking-[0.18em] text-[#9de5db]">
              <span className="h-px w-10 bg-[#9de5db]" />
              Nuestra historia
            </div>
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Creamos espacios donde la vida se siente.
            </h1>
            <p className="mt-6 max-w-lg text-pretty text-lg leading-8 text-white/75">
              En La Casa del Pez convertimos la acuariofilia en una experiencia cercana, bonita y bien pensada. Unimos conocimiento, cuidado y oficio para que tu mundo acuatico empiece con confianza.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" className="bg-[#9de5db] text-[#102b3f] hover:bg-white" asChild>
                <Link href="/armaTuPecera">
                  Disena tu acuario
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white" asChild>
                <Link href="/tienda">Conoce la tienda</Link>
              </Button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:ml-auto">
            <div className="absolute -inset-3 rounded-2xl border border-[#9de5db]/30" />
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-white/10 shadow-2xl">
              <Image
                src="/pecera_grande_200.jpg"
                alt="Pecera de gran formato fabricada a medida"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#102b3f]/90 to-transparent p-6 pt-20">
                <p className="text-sm font-medium text-white/80">Diseno, fabricacion y asesoria</p>
                <p className="mt-1 text-xl font-semibold">Tu idea, hecha acuario.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-background py-16 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Nuestra manera de hacer las cosas</p>
            <h2 className="mt-4 max-w-md text-3xl font-semibold tracking-tight sm:text-4xl">
              La experiencia empieza mucho antes del agua.
            </h2>
          </div>
          <div className="max-w-2xl text-base leading-8 text-muted-foreground">
            <p>
              Creemos que un buen acuario no se trata solo de poner elementos bonitos dentro de un vidrio. Se trata de entender el espacio, conocer a sus habitantes y crear un equilibrio que puedas disfrutar durante mucho tiempo.
            </p>
            <p className="mt-5">
              Por eso combinamos productos seleccionados, asesoramiento honesto y la posibilidad de construir acuarios personalizados. Nuestra meta es que cada decisión tenga sentido para ti y para la vida que vas a cuidar.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-muted/35 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Lo que nos mueve</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Cuidamos cada detalle.</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {values.map(({ icon: Icon, title, description }) => (
              <article key={title} className="border border-border bg-background p-7 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-6 text-lg font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background py-16 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.7fr_1.3fr] lg:px-8">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#102b3f] text-[#9de5db]">
              <Sparkles className="h-5 w-5" />
            </div>
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-primary">De la idea a tu hogar</p>
            <h2 className="mt-3 max-w-md text-3xl font-semibold tracking-tight sm:text-4xl">Hacerlo sencillo también es parte del oficio.</h2>
          </div>
          <div className="divide-y divide-border border-y border-border">
            {processSteps.map((step) => (
              <div key={step.number} className="grid gap-3 py-7 sm:grid-cols-[80px_0.8fr_1.2fr] sm:items-start sm:gap-6">
                <span className="text-sm font-semibold tracking-[0.15em] text-primary">{step.number}</span>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="text-sm leading-6 text-muted-foreground">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-[#eaf7f5] py-14">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#102b3f]"><Wrench className="h-4 w-4" /> Tambien estamos para ayudarte</div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#102b3f] sm:text-3xl">Tu próximo acuario puede empezar hoy.</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#315669]">Explora nuestros productos o crea una pecera a la medida con dimensiones y presupuesto definidos por ti.</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Button className="bg-[#102b3f] text-white hover:bg-[#1d4862]" asChild><Link href="/armaTuPecera">Armar mi pecera <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            <Button variant="outline" className="border-[#102b3f]/20 bg-transparent text-[#102b3f] hover:bg-white" asChild><Link href="/peces">Ver peces</Link></Button>
          </div>
        </div>
      </section>
    </div>
  )
}
