import Link from 'next/link'
import { Fish, MapPin, Phone, Mail, Clock, Map, Navigation } from 'lucide-react'
import { SocialLinks } from '@/components/store/social-links'
import { getStoreSettings, buildSocialUrls } from '@/lib/store-settings'

const footerLinks = {
  tienda: [
    { name: 'Todos los Productos', href: '/tienda' },
    { name: 'Peces Tropicales', href: '/peces' },
    { name: 'Acuarios', href: '/tienda?categoria=acuarios' },
    { name: 'Accesorios', href: '/tienda?categoria=accesorios' },
    { name: 'Alimentos', href: '/tienda?categoria=alimentos' },
  ],
  servicios: [
    { name: 'Acuarios a Medida', href: '/configurador' },
    { name: 'Mantenimiento', href: '/servicios/mantenimiento' },
    { name: 'Instalacion', href: '/servicios/instalacion' },
    { name: 'Asesoria', href: '/servicios/asesoria' },
  ],
  empresa: [
    { name: 'Nosotros', href: '/nosotros' },
    { name: 'Contacto', href: '/contacto' },
    { name: 'Blog', href: '/blog' },
    { name: 'Preguntas Frecuentes', href: '/faq' },
  ],
  legal: [
    { name: 'Terminos y Condiciones', href: '/terminos' },
    { name: 'Politica de Privacidad', href: '/privacidad' },
    { name: 'Politica de Envios', href: '/envios' },
    { name: 'Devoluciones', href: '/devoluciones' },
  ],
}

export async function StoreFooter() {
  const settings = await getStoreSettings()
  const socialUrls = buildSocialUrls(settings.redes, settings.mapas.wazeUrl)

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-6">
          {/* Brand and Contact */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Fish className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">La Casa del Pez</p>
                <p className="text-xs text-muted-foreground">Acuarios y Peces Tropicales</p>
              </div>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              Tu tienda de confianza para todo lo relacionado con el mundo acuatico.
              Expertos en acuarismo desde hace mas de 20 anos.
            </p>
            <div className="mt-6 space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p>{settings.mapas.direccion}</p>
                  <div className="mt-1 flex gap-3">
                    {settings.mapas.googleMapsUrl && (
                      <a
                        href={settings.mapas.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs hover:text-primary hover:underline"
                      >
                        <Map className="h-3 w-3" />
                        Google Maps
                      </a>
                    )}
                    {settings.mapas.wazeUrl && (
                      <a
                        href={settings.mapas.wazeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs hover:text-primary hover:underline"
                      >
                        <Navigation className="h-3 w-3" />
                        Waze
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" />
                <span>{settings.mapas.telefono ?? '+00 000 000'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                <span>info@lacasadelpez.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0" />
                <span>{settings.mapas.horaApertura} - {settings.mapas.horaCierre}</span>
              </div>
            </div>
            <div className="mt-4 border-t border-border pt-4">
              <p className="mb-3 text-sm text-muted-foreground">Síguenos</p>
              <SocialLinks
                facebook={socialUrls.facebook}
                instagram={socialUrls.instagram}
                tiktok={socialUrls.tiktok}
                whatsapp={socialUrls.whatsapp}
                waze={socialUrls.waze}
              />
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">Tienda</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.tienda.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Servicios</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.servicios.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Empresa</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.empresa.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Legal</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Acuario La Casa del Pez. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
