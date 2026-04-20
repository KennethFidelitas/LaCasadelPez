'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/actions/button'

export function LogoutButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  async function handleLogout() {
    setIsLoading(true)
    localStorage.removeItem('demo-auth-email')
    localStorage.removeItem('demo-auth-name')
    await new Promise((resolve) => setTimeout(resolve, 300))
    router.replace('/auth/login')
    router.refresh()
  }

  return (
    <Button variant="outline" onClick={handleLogout} disabled={isLoading}>
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
      Cerrar sesion
    </Button>
  )
}
