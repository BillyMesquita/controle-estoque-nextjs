import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, signToken } from '@/lib/auth-utils'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: 'Email ou senha inválidos' }, { status: 401 })
    }
    if (!user.isActive) {
      return NextResponse.json({ error: 'Usuário inativo' }, { status: 401 })
    }
    const token = signToken({ userId: user.id, email: user.email, name: user.name, role: user.role })
    return NextResponse.json({ token, name: user.name, email: user.email, role: user.role, userId: user.id })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
