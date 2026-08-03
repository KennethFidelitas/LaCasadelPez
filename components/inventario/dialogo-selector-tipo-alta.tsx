'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Fish, Package, Plus } from 'lucide-react'

import { Button } from '@/components/ui/actions/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/actions/toggle-group'
import { Label } from '@/components/ui/forms/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/overlays/dialog'

type TipoAlta = 'animal' | 'producto'

const RUTAS: Record<TipoAlta, string> = {
  animal: '/inventario/agregar-animal',
  producto: '/inventario/agregar-producto',
}

export function DialogoSelectorTipoAlta() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [tipo, setTipo] = useState<TipoAlta>('animal')

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) {
      setTipo('animal')
    }
  }

  function handleContinuar() {
    router.push(RUTAS[tipo])
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="ml-auto">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar al inventario</DialogTitle>
          <DialogDescription>Elegí qué querés registrar.</DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label>Tipo</Label>
          <ToggleGroup
            type="single"
            variant="outline"
            value={tipo}
            onValueChange={(value) => value && setTipo(value as TipoAlta)}
            className="w-full gap-3"
          >
            <ToggleGroupItem
              value="animal"
              className="h-auto flex-col gap-1 rounded-md py-3 data-[variant=outline]:border-l data-[state=on]:border-accent data-[state=on]:bg-accent/10 data-[state=on]:text-accent"
            >
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <Fish className="h-4 w-4" />
                Animal
              </span>
              <span className="text-xs font-normal text-muted-foreground">Pez, planta, invertebrado</span>
            </ToggleGroupItem>
            <ToggleGroupItem
              value="producto"
              className="h-auto flex-col gap-1 rounded-md py-3 data-[variant=outline]:border-l data-[state=on]:border-accent data-[state=on]:bg-accent/10 data-[state=on]:text-accent"
            >
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <Package className="h-4 w-4" />
                Producto
              </span>
              <span className="text-xs font-normal text-muted-foreground">Alimento, filtro, accesorio</span>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleContinuar}>Continuar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
