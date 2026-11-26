'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ImageOff } from 'lucide-react'

export function CatalogImage({ src, alt, sizes }: { src?: string; alt: string; sizes: string }) {
  const [failedSrc, setFailedSrc] = useState<string>()

  if (!src || src === failedSrc || !/^(?:\/(?!\/)|https?:\/\/)/i.test(src)) {
    return (
      <div className="flex h-full w-full items-center justify-center" role="img" aria-label="Imagen no disponible">
        <ImageOff className="h-10 w-10 text-muted-foreground/50" />
      </div>
    )
  }

  return <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" onError={() => setFailedSrc(src)} />
}
