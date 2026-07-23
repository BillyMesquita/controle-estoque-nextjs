import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequestAsync, signToken, setTokenCookie } from '@/lib/auth-utils'

export async function POST(req: NextRequest) {
  try {
    const payload = await getUserFromRequestAsync(req)
    if (!payload) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const token = signToken({ userId: payload.userId, username: payload.username, name: payload.name, role: payload.role, permissions: payload.permissions })
    const response = NextResponse.json({ ok: true })
    setTokenCookie(response, token)
    return response
  } catch {
    return NextResponse.json({ error: 'Erro ao renovar token' }, { status: 500 })
  }
}
