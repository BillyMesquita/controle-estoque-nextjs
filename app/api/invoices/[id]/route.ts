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
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { supplier: true, registeredByUser: { select: { name: true } }, items: { include: { product: true } } },
    })
    if (!invoice) return NextResponse.json({ error: 'Nota não encontrada' }, { status: 404 })
    if (payload.role === 'Operador' && invoice.registeredBy !== payload.userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    return NextResponse.json({
      id: invoice.id, invoiceNumber: invoice.invoiceNumber, invoiceType: invoice.invoiceType,
      supplierId: null, supplierName: invoice.supplierName || invoice.supplier?.name || null,
      customerName: invoice.customerName, totalAmount: Number(invoice.totalAmount),
      taxAmount: Number(invoice.taxAmount), paymentStatus: invoice.paymentStatus,
      status: invoice.status, issuedDate: invoice.issuedDate.toISOString().split('T')[0],
      dueDate: invoice.dueDate?.toISOString().split('T')[0] || null,
      paidAt: invoice.paidAt?.toISOString() || null, registeredByName: invoice.registeredByUser?.name || '',
      items: invoice.items.map(ii => ({
        id: ii.id, productId: ii.productId, productName: ii.product.name,
        productSku: ii.product.sku, quantity: Number(ii.quantity),
        unitCost: Number(ii.unitCost), totalCost: Number(ii.quantity) * Number(ii.unitCost),
      })),
    })
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar nota' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await getUserFromRequestAsync(req)
  if (!payload || payload.role === 'Operador') return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  const { id } = await params

  try {
    const invoice = await prisma.invoice.findUnique({ where: { id } })
    if (!invoice) return NextResponse.json({ error: 'Nota não encontrada' }, { status: 404 })

    await prisma.invoice.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'Cancelada' },
    })

    await createAuditLog({
      userId: payload.userId, action: 'Excluir', entity: 'Invoice',
      entityId: id, module: 'INVOICE',
      description: `Nota #${invoice.invoiceNumber} cancelada`,
      previousValues: JSON.stringify({ invoiceNumber: invoice.invoiceNumber, totalAmount: Number(invoice.totalAmount) }),
    })

    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: 'Erro ao cancelar nota' }, { status: 500 })
  }
}
