'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2, LogIn, Mail, UserPlus } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/display/alert'
import { Button } from '@/components/ui/actions/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/display/card'
import { Input } from '@/components/ui/forms/input'
import { Label } from '@/components/ui/forms/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/navigation/tabs'
import { createClient } from '@/lib/supabase/client'
import { notifySelfRegistration } from '@/lib/customers/self-register'
import { requestPasswordReset } from '@/lib/auth/password-reset'

type AuthMode = 'login' | 'register'

type AuthMessage = {
  type: 'success' | 'error'
  title: string
  description: string
}

export function AuthForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/cuenta'
  const supabase = createClient()

  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isResetLoading, setIsResetLoading] = useState(false)
  const [message, setMessage] = useState<AuthMessage | null>(null)

  useEffect(() => {
    const error = searchParams.get('error')

    if (error === 'reset_link_expired') {
      setMessage({
        type: 'error',
        title: 'Enlace vencido',
        description: 'El enlace para restablecer la contraseña ya expiró o no es válido. Solicitá uno nuevo.',
      })
    }

    if (error === 'auth_callback') {
      setMessage({
        type: 'error',
        title: 'No se pudo validar el acceso',
        description: 'Intentá iniciar sesión nuevamente.',
      })
    }
  }, [searchParams])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setMessage(null)

    if (mode === 'register' && password.length < 6) {
      setMessage({
        type: 'error',
        title: 'Contrasena muy corta',
        description: 'Usa al menos 6 caracteres para crear la cuenta.',
      })
      setIsLoading(false)
      return
    }

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          setMessage({
            type: 'error',
            title: 'No se pudo iniciar sesión',
            description: error.message,
          })
          return
        }

        router.replace(redirectTo)
        router.refresh()
        return
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      })

      if (error) {
        setMessage({
          type: 'error',
          title: 'No se pudo crear la cuenta',
          description: error.message,
        })
        return
      }

      // Enviar el correo de bienvenida al registro autogestionado. No bloqueamos
      // ni revertimos el signUp si el correo falla: la cuenta ya quedó creada en
      // Supabase Auth, solo se registra el error para revisión.
      notifySelfRegistration({ email, firstName }).then((emailResult) => {
        if (!emailResult.ok) {
          console.error('[AuthForm] notifySelfRegistration failed:', emailResult.message)
        }
      })

      setMessage({
        type: 'success',
        title: 'Cuenta creada',
        description:
          'Tu cuenta fue creada. Si tu proyecto requiere confirmación por correo, revisa tu bandeja de entrada antes de iniciar sesión.',
      })
      setMode('login')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleForgotPassword() {
    setMessage(null)

    if (!email.trim()) {
      setMessage({
        type: 'error',
        title: 'Correo requerido',
        description: 'Ingresá tu correo para enviarte el enlace de recuperación.',
      })
      return
    }

    setIsResetLoading(true)

    try {
      const result = await requestPasswordReset({ email })

      if (!result.ok) {
        setMessage({
          type: 'error',
          title: 'No se pudo enviar el correo',
          description: result.message,
        })
        return
      }

      setMessage({
        type: 'success',
        title: 'Revisa tu correo',
        description: result.message,
      })
    } finally {
      setIsResetLoading(false)
    }
  }

  return (
    <Tabs value={mode} onValueChange={(value) => setMode(value as AuthMode)} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login">Iniciar sesion</TabsTrigger>
        <TabsTrigger value="register">Crear cuenta</TabsTrigger>
      </TabsList>

      <Card className="mt-4 rounded-lg">
        <CardHeader>
          <CardTitle>{mode === 'login' ? 'Bienvenido de vuelta' : 'Crea tu cuenta'}</CardTitle>
          <CardDescription>
            {mode === 'login'
              ? 'Inicia sesión con tu cuenta.'
              : 'Crea una cuenta real para clientes o equipo con permisos.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
         

          {message && (
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className="mb-5">
              <AlertTitle>{message.title}</AlertTitle>
              <AlertDescription>{message.description}</AlertDescription>
            </Alert>
          )}

          <TabsContent value="login" forceMount hidden={mode !== 'login'}>
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-2">
                <Label htmlFor="login-email">Correo</Label>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="correo@ejemplo.com"
                  required
                />
              </div>
              <PasswordField
                id="login-password"
                value={password}
                showPassword={showPassword}
                onChange={setPassword}
                onToggle={() => setShowPassword((current) => !current)}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                Entrar
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={handleForgotPassword}
                disabled={isLoading || isResetLoading}
              >
                {isResetLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                Olvidé mi contraseña
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" forceMount hidden={mode !== 'register'}>
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="first-name">Nombre</Label>
                  <Input
                    id="first-name"
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    placeholder="Adrian"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="last-name">Apellido</Label>
                  <Input
                    id="last-name"
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    placeholder="Mora"
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="register-email">Correo</Label>
                <Input
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="correo@ejemplo.com"
                  required
                />
              </div>
              <PasswordField
                id="register-password"
                value={password}
                showPassword={showPassword}
                onChange={setPassword}
                onToggle={() => setShowPassword((current) => !current)}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Crear cuenta
              </Button>
            </form>
          </TabsContent>
        </CardContent>
      </Card>
    </Tabs>
  )
}

function PasswordField({
  id,
  value,
  showPassword,
  onChange,
  onToggle,
}: {
  id: string
  value: string
  showPassword: boolean
  onChange: (value: string) => void
  onToggle: () => void
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>Contrasena</Label>
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? 'text' : 'password'}
          autoComplete={id.includes('register') ? 'new-password' : 'current-password'}
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
          <span className="sr-only">{showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}</span>
        </Button>
      </div>
    </div>
  )
}
