'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, LockKeyhole } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/display/alert'
import { Button } from '@/components/ui/actions/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/display/card'
import { Input } from '@/components/ui/forms/input'
import { Label } from '@/components/ui/forms/label'
import { createClient } from '@/lib/supabase/client'

type FormMessage = {
  type: 'success' | 'error'
  title: string
  description: string
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<FormMessage | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)

    if (password.length < 6) {
      setMessage({
        type: 'error',
        title: 'Contraseña muy corta',
        description: 'Usá al menos 6 caracteres.',
      })
      return
    }

    if (password !== confirmPassword) {
      setMessage({
        type: 'error',
        title: 'Las contraseñas no coinciden',
        description: 'Revisá la confirmación e intentá de nuevo.',
      })
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        setMessage({
          type: 'error',
          title: 'No se pudo actualizar la contraseña',
          description: error.message,
        })
        return
      }

      setMessage({
        type: 'success',
        title: 'Contraseña actualizada',
        description: 'Ya podés iniciar sesión con tu nueva contraseña.',
      })

      setTimeout(async () => {
        await supabase.auth.signOut()
        router.replace('/auth/login')
      }, 1200)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-muted/20">
      <section className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-xl items-center px-4 py-10 sm:px-6">
        <Card className="w-full rounded-lg">
          <CardHeader>
            <CardTitle>Crear nueva contraseña</CardTitle>
            <CardDescription>
              Ingresá una nueva contraseña para recuperar el acceso a tu cuenta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {message && (
              <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className="mb-5">
                <AlertTitle>{message.title}</AlertTitle>
                <AlertDescription>{message.description}</AlertDescription>
              </Alert>
            )}

            <form className="grid gap-4" onSubmit={handleSubmit}>
              <PasswordInput
                id="new-password"
                label="Nueva contraseña"
                value={password}
                showPassword={showPassword}
                onChange={setPassword}
                onToggle={() => setShowPassword((current) => !current)}
              />
              <PasswordInput
                id="confirm-password"
                label="Confirmar contraseña"
                value={confirmPassword}
                showPassword={showPassword}
                onChange={setConfirmPassword}
                onToggle={() => setShowPassword((current) => !current)}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
                Guardar contraseña
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function PasswordInput({
  id,
  label,
  value,
  showPassword,
  onChange,
  onToggle,
}: {
  id: string
  label: string
  value: string
  showPassword: boolean
  onChange: (value: string) => void
  onToggle: () => void
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="pr-10"
          required
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute right-1 top-1/2 -translate-y-1/2"
          onClick={onToggle}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          <span className="sr-only">{showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}</span>
        </Button>
      </div>
    </div>
  )
}
