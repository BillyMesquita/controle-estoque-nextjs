import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth-utils'

export async function GET(req: NextRequest) {
  const payload = getUserFromRequest(req)
  if (!payload) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const events = await prisma.event.findMany({
      orderBy: { startDate: 'desc' },
    })
    return NextResponse.json(events)
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar eventos' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const payload = getUserFromRequest(req)
  if (!payload) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const data = await req.json()
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
