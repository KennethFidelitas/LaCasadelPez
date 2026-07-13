import type { Metadata } from 'next'
import { AboutPage } from '@/components/store/about-page'

export const metadata: Metadata = {
  title: 'Nosotros | La Casa del Pez',
  description: 'Conoce la historia, valores y forma de trabajo de La Casa del Pez.',
}

export default function NosotrosPage() {
  return <AboutPage />
}
