import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth-utils'

export async function GET(req: NextRequest) {
  const payload = getUserFromRequest(req)
  if (!payload || payload.role !== 'Administrador') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '50')
  const where: any = {}

  if (searchParams.get('module')) where.module = searchParams.get('module')
  if (searchParams.get('action')) where.action = searchParams.get('action')
  if (searchParams.get('entity')) where.entity = searchParams.get('entity')
  if (searchParams.get('userId')) where.userId = searchParams.get('userId')
  if (searchParams.get('startDate')) where.createdAt = { ...where.createdAt, gte: new Date(searchParams.get('startDate')!) }
  if (searchParams.get('endDate')) where.createdAt = { ...where.createdAt, lte: new Date(searchParams.get('endDate')!) }

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ])

  return NextResponse.json({
    items: items.map(log => ({
      id: log.id, userName: log.user.name, userEmail: log.user.email,
      action: log.action, entity: log.entity, entityId: log.entityId,
      module: log.module, description: log.description,
      previousValues: log.previousValues, newValues: log.newValues,
      ipAddress: log.ipAddress, createdAt: log.createdAt.toISOString(),
    })),
    total, page, pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
}
