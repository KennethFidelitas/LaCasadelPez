'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/actions/button'
import { createClient } from '@/lib/supabase/client'

export function LogoutButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  async function handleLogout() {
    setIsLoading(true)
    try {
      await supabase.auth.signOut()
      router.replace('/auth/login')
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleLogout} disabled={isLoading}>
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
      Cerrar sesion
    </Button>
  )
}
