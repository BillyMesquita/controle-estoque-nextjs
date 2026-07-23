import { NextResponse } from 'next/server'
import { clearTokenCookie } from '@/lib/auth-utils'

export async function POST() {
  try {
    const response = NextResponse.json({ ok: true })
    clearTokenCookie(response)
    return response
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
