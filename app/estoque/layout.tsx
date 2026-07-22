'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LayoutClient from '@/components/layout-client'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/login'); return }
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (user.role !== 'Administrador') router.push('/dashboard')
  }, [router])

  return <LayoutClient>{children}</LayoutClient>
}
