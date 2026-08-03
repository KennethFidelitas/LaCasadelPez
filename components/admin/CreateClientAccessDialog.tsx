'use client'

// components/admin/CreateClientAccessDialog.tsx
// RF-CL-002: El admin crea credenciales de acceso para un cliente

import { useState } from 'react'
import { CheckCircle, Loader2, UserPlus, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/actions/button'
import { Input } from '@/components/ui/forms/input'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/overlays/dialog'
import { createClientAccess } from '@/lib/customers/create-access'

interface Props {
  // Pre-llenar con datos del cliente si viene desde la lista de clientes
  defaultEmail?: string
  defaultFirstName?: string
  defaultLastName?: string
  defaultPhone?: string
  onSuccess?: (userId: string) => void
}

export function CreateClientAccessDialog({
  defaultEmail = '',
  defaultFirstName = '',
  defaultLastName = '',
  defaultPhone = '',
  onSuccess,
}: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState(defaultEmail)
  const [firstName, setFirstName] = useState(defaultFirstName)
  const [lastName, setLastName] = useState(defaultLastName)
  const [phone, setPhone] = useState(defaultPhone)
  const [result, setResult] = useState<{
    type: 'success' | 'duplicate' | 'email_error' | 'error'
    message: string
  } | null>(null)

  function resetForm() {
    setEmail(defaultEmail)
    setFirstName(defaultFirstName)
    setLastName(defaultLastName)
    setPhone(defaultPhone)
    setResult(null)
  }

  function handleOpenChange(val: boolean) {
    setOpen(val)
    if (!val) resetForm()
  }

  async function handleSubmit() {
    if (!email.trim() || !firstName.trim()) {
      setResult({ type: 'error', message: 'El nombre y el correo son obligatorios.' })
      return
    }

    setLoading(true)
    setResult(null)

    const res = await createClientAccess({
      email: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim() || undefined,
      phone: phone.trim() || undefined,
    })

    setLoading(false)

    if (!res.ok) {
      const type = res.code === 'DUPLICATE' ? 'duplicate'
        : res.code === 'EMAIL_ERROR' ? 'email_error'
        : 'error'
      setResult({ type, message: res.message })
      return
    }

    // Caso 1: éxito
    setResult({ type: 'success', message: res.message })
    onSuccess?.(res.userId)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Crear acceso
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear acceso para cliente</DialogTitle>
          <DialogDescription>
            Se enviará un correo automático con el enlace de activación. El cliente elegirá su propia contraseña.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Nombre *</label>
              <Input
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="Carlos"
                disabled={loading}
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Apellido</label>
              <Input
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Araya"
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium">Correo electrónico *</label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="cliente@email.com"
              disabled={loading}
            />
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium">Teléfono</label>
            <Input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="8888-8888"
              disabled={loading}
            />
          </div>

          {/* Resultado */}
          {result && (
            <div className={`flex items-start gap-3 rounded-lg p-3 text-sm ${
              result.type === 'success'
                ? 'bg-green-50 text-green-800'
                : result.type === 'duplicate'
                  ? 'bg-amber-50 text-amber-800'
                  : result.type === 'email_error'
                    ? 'bg-blue-50 text-blue-800'
                    : 'bg-destructive/10 text-destructive'
            }`}>
              {result.type === 'success'
                ? <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                : <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
              }
              <p>{result.message}</p>
            </div>
          )}

          {/* Info sobre el proceso */}
          {!result && (
            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              Supabase enviará automáticamente el correo de activación. El enlace tiene una validez de 24 horas.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            {result?.type === 'success' ? 'Cerrar' : 'Cancelar'}
          </Button>
          {result?.type !== 'success' && (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creando acceso...</>
                : <><UserPlus className="mr-2 h-4 w-4" />Crear acceso</>
              }
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
