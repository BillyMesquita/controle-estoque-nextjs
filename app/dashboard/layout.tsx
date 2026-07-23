'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LayoutClient from '@/components/layout-client'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    const loggedIn = localStorage.getItem('loggedIn')
    if (!loggedIn) router.push('/login')
  }, [router])

  return <LayoutClient>{children}</LayoutClient>
}
