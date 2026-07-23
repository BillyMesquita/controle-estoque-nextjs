import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequestAsync } from '@/lib/auth-utils'
import { hashPasswordAsync } from '@/lib/auth-utils'
import { stripHtml } from '@/lib/sanitize'

export async function GET(req: NextRequest) {
  const payload = await getUserFromRequestAsync(req)
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
  const payload = await getUserFromRequestAsync(req)
  if (!payload || payload.role !== 'Administrador') return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  try {
    const data = await req.json()
    data.name = stripHtml(data.name)
    data.username = stripHtml(data.username)
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }
    if (!data.username || typeof data.username !== 'string' || data.username.trim().length < 3) {
      return NextResponse.json({ error: 'Usuário deve ter ao menos 3 caracteres' }, { status: 400 })
    }
    if (!data.password || typeof data.password !== 'string' || data.password.length < 6) {
      return NextResponse.json({ error: 'Senha deve ter ao menos 6 caracteres' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { username: data.username.trim() } })
    if (existing) return NextResponse.json({ error: 'Usuário já cadastrado' }, { status: 409 })

    const permissions = data.permissions?.length ? JSON.stringify(data.permissions) : null

    const user = await prisma.user.create({
      data: {
        name: data.name,
        username: data.username,
        passwordHash: await hashPasswordAsync(data.password),
        role: data.role || 'Operador',
        permissions,
      },
      select: { id: true, name: true, username: true, role: true, permissions: true, isActive: true },
    })

    try {
      await prisma.$executeRaw`
        INSERT OR IGNORE INTO users_old (id, name, username, password_hash, role, permissions, is_active, created_at, updated_at)
        SELECT id, name, username, password_hash, role, permissions, is_active, created_at, updated_at FROM users WHERE id = ${user.id}
      `
    } catch { /* users_old may not exist */ }

    return NextResponse.json(user, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 })
  }
}
