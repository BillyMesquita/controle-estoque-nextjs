import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth-utils'
import { hashPassword } from '@/lib/auth-utils'

export async function GET(req: NextRequest) {
  const payload = getUserFromRequest(req)
  if (!payload || payload.role !== 'Administrador') return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  try {
    const users = await prisma.user.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, username: true, role: true, permissions: true, isActive: true, createdAt: true },
    })
    return NextResponse.json(users)
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const payload = getUserFromRequest(req)
  if (!payload || payload.role !== 'Administrador') return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  try {
    const data = await req.json()
    if (!data.name || !data.username || !data.password) {
      return NextResponse.json({ error: 'Nome, usuário e senha são obrigatórios' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { username: data.username } })
    if (existing) return NextResponse.json({ error: 'Usuário já cadastrado' }, { status: 409 })

    const permissions = data.permissions?.length ? JSON.stringify(data.permissions) : null

    const user = await prisma.user.create({
      data: {
        name: data.name,
        username: data.username,
        passwordHash: hashPassword(data.password),
        role: data.role || 'Operador',
        permissions,
      },
      select: { id: true, name: true, username: true, role: true, permissions: true, isActive: true },
    })

    return NextResponse.json(user, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 })
  }
}
