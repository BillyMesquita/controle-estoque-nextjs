import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth-utils'
import { createAuditLog } from '@/lib/audit'

export async function GET(req: NextRequest) {
  const payload = getUserFromRequest(req)
  if (!payload) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const filterPaymentStatus = searchParams.get('paymentStatus')

  const where: any = { deletedAt: null }
  if (searchParams.get('status')) where.status = searchParams.get('status')
  if (filterPaymentStatus && filterPaymentStatus !== 'Atrasado') where.paymentStatus = filterPaymentStatus

  const invoices = await prisma.invoice.findMany({
    where,
    include: { supplier: true, registeredByUser: { select: { name: true } }, items: { include: { product: true } } },
    orderBy: { issuedDate: 'desc' },
  })

  let result = invoices.map(mapInvoice)
  if (filterPaymentStatus === 'Atrasado') result = result.filter(i => i.paymentStatus === 'Atrasado')

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const payload = getUserFromRequest(req)
  if (!payload) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const dto = await req.json()
    const totalAmount = dto.items?.length ? dto.items.reduce((s: number, i: any) => s + i.quantity * i.unitCost, 0) : 0

    let supplierId = dto.supplierId || null
    if (!supplierId && dto.supplierName?.trim()) {
      const existing = await prisma.supplier.findFirst({ where: { name: dto.supplierName.trim() } })
      if (existing) {
        supplierId = existing.id
      } else {
        const created = await prisma.supplier.create({ data: { name: dto.supplierName.trim() } })
        supplierId = created.id
      }
    }

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: dto.invoiceNumber,
        invoiceType: dto.invoiceType,
        supplierId,
        customerName: dto.customerName || null,
        customerDocument: dto.customerDocument || null,
        totalAmount,
        taxAmount: 0,
        issuedDate: new Date(dto.issuedDate),
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        notes: dto.notes || null,
        registeredBy: payload.userId,
        ...(dto.items?.length ? {
          items: {
            create: dto.items.map((i: any) => ({
              productId: i.productId, quantity: i.quantity, unitCost: i.unitCost,
            })),
          },
        } : {}),
      },
      include: { supplier: true, registeredByUser: { select: { name: true } }, items: { include: { product: true } } },
    })

    if (dto.invoiceType === 'Fiscal' && dto.items?.length) {
      for (const item of dto.items) {
        const product = await prisma.product.findUnique({ where: { id: item.productId } })
        if (!product) continue
        const totalCost = Number(product.currentStock) * Number(product.unitCost) + item.quantity * item.unitCost
        const totalQty = Number(product.currentStock) + item.quantity
        await prisma.product.update({
          where: { id: item.productId },
          data: { currentStock: totalQty, unitCost: totalQty > 0 ? totalCost / totalQty : item.unitCost },
        })
        await prisma.stockMovement.create({
          data: {
            productId: item.productId, type: 'Entrada', quantity: item.quantity,
            unitCost: item.unitCost, unitPrice: 0,
            description: `Entrada automática - NF ${dto.invoiceNumber}`,
            referenceId: invoice.id, referenceType: 'INVOICE', movedBy: payload.userId,
          },
        })
      }
    }

    await createAuditLog({
      userId: payload.userId, action: 'Criar', entity: 'Invoice',
      entityId: invoice.id, module: 'INVOICE',
      description: `Nota ${dto.invoiceType} #${dto.invoiceNumber} criada`,
      newValues: JSON.stringify({ invoiceNumber: dto.invoiceNumber, type: dto.invoiceType, totalAmount }),
    })

    return NextResponse.json(mapInvoice(invoice), { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar nota' }, { status: 500 })
  }
}

function mapInvoice(i: any) {
  let paymentStatus = i.paymentStatus
  if (paymentStatus === 'Pendente' && i.dueDate) {
    const hoje = new Date().toISOString().split('T')[0]
    if (new Date(i.dueDate).toISOString().split('T')[0] < hoje) paymentStatus = 'Atrasado'
  }
  return {
    id: i.id, invoiceNumber: i.invoiceNumber, invoiceType: i.invoiceType,
    supplierId: i.supplierId, supplierName: i.supplier?.name || null,
    customerName: i.customerName, totalAmount: Number(i.totalAmount),
    taxAmount: Number(i.taxAmount), paymentStatus,
    status: i.status, issuedDate: i.issuedDate.toISOString().split('T')[0],
    dueDate: i.dueDate?.toISOString().split('T')[0] || null,
    paidAt: i.paidAt?.toISOString() || null, registeredByName: i.registeredByUser?.name || '',
    items: i.items?.map((ii: any) => ({
      id: ii.id, productId: ii.productId, productName: ii.product?.name || '',
      productSku: ii.product?.sku || '', quantity: Number(ii.quantity),
      unitCost: Number(ii.unitCost), totalCost: Number(ii.quantity) * Number(ii.unitCost),
    })) || [],
  }
}
