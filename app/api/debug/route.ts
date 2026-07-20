import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const payload = getUserFromRequest(req)
  if (!payload || payload.role !== 'Administrador') return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  let dbStatus = 'unknown'
  try {
    await prisma.$connect()
    const count = await prisma.user.count()
    dbStatus = `ok (${count} users)`
  } catch (e: any) {
    dbStatus = e.message?.substring(0, 300) || 'unknown error'
  }

  return NextResponse.json({
    node_env: process.env.NODE_ENV || '(not set)',
    db_status: dbStatus,
  })
}
