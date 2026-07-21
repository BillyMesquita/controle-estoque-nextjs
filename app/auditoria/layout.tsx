'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LayoutClient from '@/components/layout-client'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    if (!token) { router.push('/login'); return }
    if (user) {
      const parsed = JSON.parse(user)
      if (parsed.role !== 'Administrador') router.push('/estoque')
    }
  }, [router])

  return <LayoutClient>{children}</LayoutClient>
}
