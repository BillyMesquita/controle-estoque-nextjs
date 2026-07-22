import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequestAsync } from '@/lib/auth-utils'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await getUserFromRequestAsync(req)
  if (!payload) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { id } = await params

  try {
    const event = await prisma.event.findUnique({ where: { id } })
    if (!event) return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 })

    return NextResponse.json(event)
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar evento' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await getUserFromRequestAsync(req)
  if (!payload) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (payload.role === 'Operador') return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  const { id } = await params

  const event = await prisma.event.findUnique({ where: { id } })
  if (!event) return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 })

  const data = await req.json()
  await prisma.event.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.startDate && { startDate: new Date(data.startDate) }),
      ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
      ...(data.location !== undefined && { location: data.location }),
      ...(data.status && { status: data.status }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  })

  return new NextResponse(null, { status: 204 })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await getUserFromRequestAsync(req)
  if (!payload) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (payload.role === 'Operador') return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  const { id } = await params

  try {
    const event = await prisma.event.findUnique({ where: { id } })
    if (!event) return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 })

    await prisma.event.update({ where: { id }, data: { status: 'Cancelado' } })

    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: 'Erro ao cancelar evento' }, { status: 500 })
  }
}
