import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth-utils'

const COST_TYPES = ['Diaristas', 'Func. Mensal', 'Embalagem', 'Gelo', 'Banda', 'Segurança']

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = getUserFromRequest(req)
  if (!payload) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { id } = await params

  const costs = await prisma.eventCost.findMany({ where: { eventId: id } })
  return NextResponse.json(costs)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = getUserFromRequest(req)
  if (!payload || payload.role !== 'Administrador') return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  const { id } = await params

  const event = await prisma.event.findUnique({ where: { id } })
  if (!event) return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 })

  try {
    const data = await req.json()
    const costs: { type: string; amount: number }[] = data.costs || []

    await prisma.eventCost.deleteMany({ where: { eventId: id } })
    if (costs.length > 0) {
      await prisma.eventCost.createMany({
        data: costs.map(c => ({
          eventId: id,
          type: c.type,
          amount: c.amount || 0,
        })),
      })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro ao salvar custos' }, { status: 500 })
  }
}
