import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequestAsync } from '@/lib/auth-utils'
import { createAuditLog } from '@/lib/audit'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await getUserFromRequestAsync(req)
  if (!payload) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { id } = await params

  try {
    const supplier = await prisma.supplier.findUnique({ where: { id } })
    if (!supplier) return NextResponse.json({ error: 'Fornecedor não encontrado' }, { status: 404 })

    return NextResponse.json(supplier)
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar fornecedor' }, { status: 500 })
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

  try {
    const supplier = await prisma.supplier.findUnique({ where: { id } })
    if (!supplier) return NextResponse.json({ error: 'Fornecedor não encontrado' }, { status: 404 })

    const data = await req.json()
    await prisma.supplier.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.document !== undefined && { document: data.document }),
        ...(data.contact !== undefined && { contact: data.contact }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.address !== undefined && { address: data.address }),
      },
    })

    await createAuditLog({
      userId: payload.userId, action: 'Atualizar', entity: 'Supplier',
      entityId: id, module: 'SUPPLIER',
      description: `Fornecedor ${supplier.name} atualizado`,
      newValues: JSON.stringify(data),
    })

    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar fornecedor' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await getUserFromRequestAsync(req)
  if (!payload || payload.role !== 'Administrador') return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  const { id } = await params

  const supplier = await prisma.supplier.findUnique({ where: { id } })
  if (!supplier) return NextResponse.json({ error: 'Fornecedor não encontrado' }, { status: 404 })

  await prisma.supplier.update({ where: { id }, data: { isActive: false } })

  await createAuditLog({
    userId: payload.userId, action: 'Excluir', entity: 'Supplier',
    entityId: id, module: 'SUPPLIER',
    description: `Fornecedor ${supplier.name} excluído`,
    previousValues: JSON.stringify({ name: supplier.name }),
  })

  return new NextResponse(null, { status: 204 })
}
