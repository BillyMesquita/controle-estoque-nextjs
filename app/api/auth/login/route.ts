import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, signToken } from '@/lib/auth-utils'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()
    const user = await prisma.user.findUnique({ where: { username } })
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: 'Usuário ou senha inválidos' }, { status: 401 })
    }
    if (!user.isActive) {
      return NextResponse.json({ error: 'Usuário inativo' }, { status: 401 })
    }
    const permissions = user.permissions ? JSON.parse(user.permissions) : null
    const token = signToken({ userId: user.id, username: user.username, name: user.name, role: user.role, permissions })
    return NextResponse.json({ token, name: user.name, username: user.username, role: user.role, userId: user.id, permissions })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
