'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider'

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (loading) return
    const isPublic = pathname.startsWith('/login') || pathname.startsWith('/access')
    if (!user && !isPublic) {
      router.replace('/login')
    }
  }, [loading, user, pathname, router])

  return <>{children}</>
}
