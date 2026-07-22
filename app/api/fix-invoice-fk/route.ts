import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth-utils'

export async function POST(req: NextRequest) {
  const payload = getUserFromRequest(req)
  if (!payload || payload.role !== 'Administrador') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  try {
    const result: any = {}

    const fkInfo: any = await prisma.$queryRawUnsafe('PRAGMA foreign_key_list(invoices)')
    result.currentFK = fkInfo

    const tables: any = await prisma.$queryRawUnsafe("SELECT name FROM sqlite_master WHERE type='table' AND name='users_old'")
    result.hasUsersOld = tables.length > 0

    if (tables.length > 0) {
      await prisma.$executeRawUnsafe(`
        INSERT OR IGNORE INTO users_old (id, name, username, password_hash, role, permissions, is_active, created_at, updated_at)
        SELECT id, name, username, password_hash, role, permissions, is_active, created_at, updated_at FROM users
      `)
      result.synced = true
    }

    const verifyFK: any = await prisma.$queryRawUnsafe('PRAGMA foreign_key_list(invoices)')
    result.afterFK = verifyFK

    return NextResponse.json(result)
  } catch (e: any) {
    console.error('Erro ao fix FK:', e)
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 })
  }
}
