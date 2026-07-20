import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth-utils'

export async function GET(req: NextRequest) {
  const payload = getUserFromRequest(req)
  if (!payload) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  try {
    const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { id: true, name: true, username: true, role: true, isActive: true, createdAt: true } })
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    return NextResponse.json(user)
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar usuário' }, { status: 500 })
  }
}
