import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth-utils'
import { createAuditLog } from '@/lib/audit'

export async function GET(req: NextRequest) {
  const payload = getUserFromRequest(req)
  if (!payload) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const where: any = { deletedAt: null }
  if (searchParams.get('productId')) where.productId = searchParams.get('productId')
  if (searchParams.get('type')) where.type = searchParams.get('type')
  if (searchParams.get('startDate')) where.movedAt = { ...where.movedAt, gte: new Date(searchParams.get('startDate')!) }
  if (searchParams.get('endDate')) where.movedAt = { ...where.movedAt, lte: new Date(searchParams.get('endDate')!) }

  const movements = await prisma.stockMovement.findMany({
    where,
    include: { product: true, movedByUser: { select: { name: true } } },
    orderBy: { movedAt: 'desc' },
    take: 500,
  })

  return NextResponse.json(movements.map(m => ({
    id: m.id, productId: m.productId, productName: m.product.name, productSku: m.product.sku,
    type: m.type, quantity: Number(m.quantity), unitCost: Number(m.unitCost), unitPrice: Number(m.unitPrice),
    totalCost: Number(Math.abs(Number(m.quantity)) * Number(m.unitCost)), totalPrice: Number(Math.abs(Number(m.quantity)) * Number(m.unitPrice)),
    description: m.description, movedByName: m.movedByUser.name, movedAt: m.movedAt.toISOString(),
  })))
}

export async function POST(req: NextRequest) {
  const payload = getUserFromRequest(req)
  if (!payload) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const dto = await req.json()
    const product = await prisma.product.findUnique({ where: { id: dto.productId } })
    if (!product) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })

    const isEntrada = dto.type === 'Entrada' || dto.type === 'Transferencia'
    const quantity = isEntrada ? Math.abs(dto.quantity) : -Math.abs(dto.quantity)

    const movement = await prisma.stockMovement.create({
      data: {
        productId: dto.productId, type: dto.type, quantity,
        unitCost: dto.unitCost || 0, unitPrice: dto.unitPrice || 0,
        description: dto.description, movedBy: payload.userId,
      },
    })

    // Atualizar estoque
    if (dto.type === 'Entrada') {
      const totalCost = Number(product.currentStock) * Number(product.unitCost) + Math.abs(dto.quantity) * (dto.unitCost || 0)
      const totalQty = Number(product.currentStock) + Math.abs(dto.quantity)
      await prisma.product.update({
        where: { id: dto.productId },
        data: {
          currentStock: totalQty,
          unitCost: totalQty > 0 ? totalCost / totalQty : dto.unitCost || 0,
        },
      })
    } else {
      await prisma.product.update({
        where: { id: dto.productId },
        data: { currentStock: { increment: quantity } },
      })
    }

    await createAuditLog({
      userId: payload.userId, action: 'Criar', entity: 'StockMovement',
      entityId: movement.id, module: 'STOCK',
      description: `Movimentação ${dto.type}: ${Math.abs(dto.quantity)}x ${product.name}`,
    })

    return NextResponse.json({
      id: movement.id, productId: movement.productId, productName: product.name, productSku: product.sku,
      type: movement.type, quantity: Number(movement.quantity), unitCost: Number(movement.unitCost),
      unitPrice: Number(movement.unitPrice),
      totalCost: Number(Math.abs(Number(movement.quantity)) * Number(movement.unitCost)),
      totalPrice: Number(Math.abs(Number(movement.quantity)) * Number(movement.unitPrice)),
      description: movement.description, movedByName: payload.name, movedAt: movement.movedAt.toISOString(),
    }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar movimentação' }, { status: 500 })
  }
}
