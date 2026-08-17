'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, LockKeyhole } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/display/alert'
import { Button } from '@/components/ui/actions/button'
import { Input } from '@/components/ui/forms/input'
import { Label } from '@/components/ui/forms/label'
import { resetPasswordWithToken } from '@/lib/auth/reset-password-action'

type FormMessage = {
  type: 'success' | 'error'
  title: string
  description: string
}

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<FormMessage | null>(null)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)

    startTransition(async () => {
      const result = await resetPasswordWithToken({
        token,
        password,
        confirmPassword,
      })

      if (!result.ok) {
        setMessage({
          type: 'error',
          title: 'No se pudo actualizar la contraseña',
          description: result.message,
        })
        return
      }

      setMessage({
        type: 'success',
        title: 'Contraseña actualizada',
        description: result.message,
      })

      setTimeout(() => {
        router.replace('/auth/login')
      }, 1200)
    })
  }

  return (
    <>
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
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
          Guardar contraseña
        </Button>
      </form>
    </>
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
