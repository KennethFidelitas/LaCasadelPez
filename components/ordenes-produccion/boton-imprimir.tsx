'use client'

import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/actions/button'

export function BotonImprimir() {
  return (
    <Button size="sm" onClick={() => window.print()}>
      <Printer className="h-4 w-4" />
      Imprimir
    </Button>
  )
}
