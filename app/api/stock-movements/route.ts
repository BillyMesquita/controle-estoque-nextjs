import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequestAsync } from '@/lib/auth-utils'
import { createAuditLog } from '@/lib/audit'

export async function GET(req: NextRequest) {
  const payload = await getUserFromRequestAsync(req)
  if (!payload) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const where: any = { deletedAt: null }
    if (searchParams.get('productId')) where.productId = searchParams.get('productId')
    if (searchParams.get('type')) where.type = searchParams.get('type')
    if (searchParams.get('startDate')) where.movedAt = { ...where.movedAt, gte: new Date(searchParams.get('startDate')!) }
    if (searchParams.get('endDate')) where.movedAt = { ...where.movedAt, lte: new Date(searchParams.get('endDate')!) }
    if (searchParams.get('eventId')) where.eventId = searchParams.get('eventId')

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '50')))

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        include: { product: true, movedByUser: { select: { name: true } }, event: { select: { name: true } } },
        orderBy: { movedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.stockMovement.count({ where }),
    ])

    return NextResponse.json({
      items: movements.map(m => ({
        id: m.id, productId: m.productId, productName: m.product.name, productSku: m.product.sku,
        type: m.type, quantity: Number(m.quantity), unitCost: Number(m.unitCost), unitPrice: Number(m.unitPrice),
        totalCost: Number(Math.abs(Number(m.quantity)) * Number(m.unitCost)), totalPrice: Number(Math.abs(Number(m.quantity)) * Number(m.unitPrice)),
        description: m.description, destino: m.destino || null, movedByName: m.movedByUser.name, movedAt: m.movedAt.toISOString(),
        eventId: m.eventId, eventName: m.event?.name || null,
      })),
      total, page, pageSize, totalPages: Math.ceil(total / pageSize),
    })
  } catch {
    return NextResponse.json({ error: 'Erro ao listar movimentações' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const payload = await getUserFromRequestAsync(req)
  if (!payload) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const dto = await req.json()
    if (!dto.productId || !dto.type || dto.quantity === undefined) {
      return NextResponse.json({ error: 'Produto, tipo e quantidade são obrigatórios' }, { status: 400 })
    }
    if (!['Entrada', 'Venda', 'Avaria', 'ConsumoInterno', 'Saida'].includes(dto.type)) {
      return NextResponse.json({ error: 'Tipo de movimentação inválido' }, { status: 400 })
    }
    const qtyNum = Math.abs(Number(dto.quantity))
    if (isNaN(qtyNum) || qtyNum <= 0) {
      return NextResponse.json({ error: 'Quantidade deve ser um número positivo' }, { status: 400 })
    }
    if (dto.type !== 'Entrada' && !dto.eventId) {
      return NextResponse.json({ error: 'Evento é obrigatório para este tipo de movimentação' }, { status: 400 })
    }
    if (dto.type === 'Saida' && !dto.destino) {
      return NextResponse.json({ error: 'Destino é obrigatório para Saída' }, { status: 400 })
    }

    const product = await prisma.product.findUnique({ where: { id: dto.productId } })
    if (!product) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })

    const isEntrada = dto.type === 'Entrada'
    const quantity = isEntrada ? qtyNum : -qtyNum

    if (!isEntrada && Number(product.currentStock) < qtyNum) {
      return NextResponse.json({ error: `Estoque insuficiente. Disponível: ${Number(product.currentStock)}` }, { status: 400 })
    }

    const unitCostEntrada = isEntrada ? (Number(dto.unitCost) || Number(product.unitCost)) : (dto.type === 'Avaria' || dto.type === 'ConsumoInterno' ? 0 : Number(product.unitCost))
    const unitPriceFinal = isEntrada ? (Number(dto.unitPrice) || Number(product.salePrice)) : (dto.type === 'Avaria' || dto.type === 'ConsumoInterno' ? 0 : Number(product.salePrice))

    const movement = await prisma.stockMovement.create({
      data: {
        productId: dto.productId, type: dto.type, quantity,
        unitCost: unitCostEntrada, unitPrice: unitPriceFinal,
        description: dto.description, destino: dto.destino || undefined,
        movedBy: payload.userId,
        eventId: dto.eventId || undefined,
      },
    })

    // Atualizar estoque
    if (isEntrada) {
      const totalCost = Number(product.currentStock) * Number(product.unitCost) + Math.abs(qtyNum) * unitCostEntrada
      const totalQty = Number(product.currentStock) + Math.abs(qtyNum)
      await prisma.product.update({
        where: { id: dto.productId },
        data: {
          currentStock: totalQty,
          unitCost: totalQty > 0 ? totalCost / totalQty : unitCostEntrada,
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
      description: `Movimentação ${dto.type}: ${Math.abs(qtyNum)}x ${product.name}`,
    })

    return NextResponse.json({
      id: movement.id, productId: movement.productId, productName: product.name, productSku: product.sku,
      type: movement.type, quantity: Number(movement.quantity), unitCost: Number(movement.unitCost),
      unitPrice: Number(movement.unitPrice),
      totalCost: Number(Math.abs(Number(movement.quantity)) * Number(movement.unitCost)),
      totalPrice: Number(Math.abs(Number(movement.quantity)) * Number(movement.unitPrice)),
      description: movement.description, destino: movement.destino || null, movedByName: payload.name, movedAt: movement.movedAt.toISOString(),
      eventId: movement.eventId, eventName: null,
    }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar movimentação' }, { status: 500 })
  }
}
