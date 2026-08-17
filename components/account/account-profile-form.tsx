'use client'

import type { FormEvent } from 'react'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/actions/button'
import { Input } from '@/components/ui/forms/input'
import { Label } from '@/components/ui/forms/label'
import { updateAccountProfile } from '@/lib/account/actions'

type AccountProfileFormProps = {
  firstName: string
  lastName: string
  email: string
  phone: string
}

export function AccountProfileForm({
  firstName,
  lastName,
  email,
  phone,
}: AccountProfileFormProps) {
  const router = useRouter()
  const [form, setForm] = useState({
    firstName,
    lastName,
    phone,
  })
  const [isPending, startTransition] = useTransition()

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    startTransition(async () => {
      const result = await updateAccountProfile(form)

      if (!result.ok) {
        toast.error(result.message)
        return
      }

      toast.success(result.message)
      router.refresh()
    })
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="account-first-name">Nombre</Label>
          <Input
            id="account-first-name"
            value={form.firstName}
            onChange={(event) => updateField('firstName', event.target.value)}
            autoComplete="given-name"
            placeholder="Nombre"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="account-last-name">Apellido</Label>
          <Input
            id="account-last-name"
            value={form.lastName}
            onChange={(event) => updateField('lastName', event.target.value)}
            autoComplete="family-name"
            placeholder="Apellido"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="account-email">Correo</Label>
        <Input id="account-email" value={email} disabled />
        <p className="text-xs text-muted-foreground">
          El correo se usa para iniciar sesión. Si necesitás cambiarlo, contactá al administrador.
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="account-phone">Teléfono</Label>
        <Input
          id="account-phone"
          value={form.phone}
          onChange={(event) => updateField('phone', event.target.value)}
          autoComplete="tel"
          placeholder="Ej: +506 8888-8888"
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Guardar cambios
      </Button>
    </form>
  )
}
