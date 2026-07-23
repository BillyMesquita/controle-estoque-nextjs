import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequestAsync } from '@/lib/auth-utils'
import { stripHtml } from '@/lib/sanitize'

export async function GET(req: NextRequest) {
  const payload = await getUserFromRequestAsync(req)
  if (!payload) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '50')))

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        orderBy: { startDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.event.count(),
    ])
    return NextResponse.json({ items: events, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar eventos' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const payload = await getUserFromRequestAsync(req)
  if (!payload) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (payload.role === 'Operador') return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  try {
    const data = await req.json()
    data.name = stripHtml(data.name)
    if (data.description) data.description = stripHtml(data.description)
    if (data.location) data.location = stripHtml(data.location)
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      return NextResponse.json({ error: 'Nome do evento é obrigatório' }, { status: 400 })
    }
    if (!data.startDate || isNaN(Date.parse(data.startDate))) {
      return NextResponse.json({ error: 'Data de início inválida' }, { status: 400 })
    }
    if (data.status && !['Planejado', 'Ativo', 'Finalizado', 'Cancelado'].includes(data.status)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
    }
    const event = await prisma.event.create({
      data: {
        name: data.name.trim(),
        description: data.description || null,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        location: data.location || null,
        status: data.status || 'Planejado',
      },
    })
    return NextResponse.json(event, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar evento' }, { status: 500 })
  }
}
