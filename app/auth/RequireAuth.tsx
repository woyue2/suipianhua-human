'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider'

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const redirectTo = pathname || '/'

  useEffect(() => {
    if (loading) return
    const isPublic = pathname.startsWith('/login')
    if (!user && !isPublic) {
      router.replace(`/login?redirect=${encodeURIComponent(redirectTo)}`)
    }
  }, [loading, user, pathname, router, redirectTo])

  if (loading) return null
  if (pathname.startsWith('/login')) return <>{children}</>
  if (!user) return null
  return <>{children}</>
}
