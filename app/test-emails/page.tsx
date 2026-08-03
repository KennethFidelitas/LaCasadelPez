// app/(store)/admin/test-emails/page.tsx
// Página de prueba para verificar que todos los tipos de email funcionan.
// SOLO disponible en desarrollo — en producción redirige al inicio.

import { redirect } from 'next/navigation'
import { TestEmailsClient } from './client'

export default function TestEmailsPage() {
  if (process.env.NODE_ENV === 'production') {
    redirect('/')
  }

  return <TestEmailsClient />
}
