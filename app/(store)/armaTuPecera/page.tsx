import type { Metadata } from 'next'
import { ArmaTuPeceraBuilder } from '@/components/armaTuPecera/ArmaTuPeceraBuilder'

export const metadata: Metadata = {
  title: 'Arma tu Pecera | La Casa del Pez',
  description:
    'Configura tu acuario a medida: elige pecera, filtro y peces compatibles paso a paso.',
}

export default function ArmaTuPeceraPage() {
  return <ArmaTuPeceraBuilder />
}
