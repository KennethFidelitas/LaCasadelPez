import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

interface RedesSociales {
  tiktok?: string
  facebook?: string
  instagram?: string
  whatsapp?: string
}

interface Mapas {
  wazeUrl?: string
  googleMapsUrl?: string
  direccion?: string
  telefono?: string
  horaCierre?: string
  horaApertura?: string
}

export interface StoreSettings {
  redes: RedesSociales
  mapas: Mapas
}

export const getStoreSettings = cache(async (): Promise<StoreSettings> => {
  const supabase = await createClient()

  const { data } = await supabase
    .from('store_settings')
    .select('redes, mapas')
    .eq('id', 'singleton')
    .single()

  return {
    redes: (data?.redes as RedesSociales) ?? {},
    mapas: (data?.mapas as Mapas) ?? {},
  }
})

export function buildSocialUrls(redes: RedesSociales, wazeUrl?: string) {
  const stripAt = (val?: string) => val?.replace(/^@/, '')

  return {
    facebook: redes.facebook ? `https://facebook.com/${redes.facebook}` : undefined,
    instagram: redes.instagram ? `https://instagram.com/${stripAt(redes.instagram)}` : undefined,
    tiktok: redes.tiktok ? `https://tiktok.com/@${stripAt(redes.tiktok)}` : undefined,
    whatsapp: redes.whatsapp ? `https://wa.me/${redes.whatsapp}` : undefined,
    waze: wazeUrl,
  }
}
