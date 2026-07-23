import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@libsql/client'
import bcrypt from 'bcryptjs'
import { getUserFromRequestAsync } from '@/lib/auth-utils'

export async function POST(req: NextRequest) {
  const payload = await getUserFromRequestAsync(req)
  if (!payload || payload.role !== 'Administrador') return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  try {
    const t = createClient({ url: process.env.DATABASE_URL || '', authToken: process.env.DATABASE_AUTH_TOKEN || '' })
    await t.execute(`CREATE TABLE IF NOT EXISTS event_costs (id TEXT NOT NULL PRIMARY KEY, event_id TEXT NOT NULL, type TEXT NOT NULL, amount REAL NOT NULL DEFAULT 0, FOREIGN KEY (event_id) REFERENCES events(id))`)
  } catch {} // tabela ja existe
  try {
    await prisma.$connect()

    if (!process.env.DEFAULT_ADMIN_PASS) {
      return NextResponse.json({ error: 'DEFAULT_ADMIN_PASS não configurada' }, { status: 500 })
    }

    const adminExists = await prisma.user.findUnique({ where: { username: 'adminbilly' } })
    if (!adminExists) {
      await prisma.user.create({
        data: {
          name: 'Administrador', username: 'adminbilly',
          passwordHash: bcrypt.hashSync(process.env.DEFAULT_ADMIN_PASS, 12),
          role: 'Administrador',
        },
      })
    }

    const userCount = await prisma.user.count()
    const productCount = await prisma.product.count()

    return NextResponse.json({
      status: 'ok', message: 'Banco configurado com sucesso!',
      stats: { usuarios: userCount, produtos: productCount },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Erro ao conectar no banco de dados' }, { status: 500 })
  }
}
