import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@libsql/client'
import { getUserFromRequestAsync } from '@/lib/auth-utils'
import { createAuditLog } from '@/lib/audit'

export async function GET(req: NextRequest) {
  const payload = await getUserFromRequestAsync(req)
  if (!payload) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const filterPaymentStatus = searchParams.get('paymentStatus')
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '50')))

  const where: any = {}
  if (payload.role !== 'Administrador') where.registeredBy = payload.userId
  if (filterPaymentStatus === 'Cancelado') {
    where.deletedAt = { not: null }
  } else {
    where.deletedAt = null
  }
  if (searchParams.get('status')) where.status = searchParams.get('status')
  if (filterPaymentStatus && filterPaymentStatus !== 'Atrasado' && filterPaymentStatus !== 'Cancelado') where.paymentStatus = filterPaymentStatus

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: { supplier: true, registeredByUser: { select: { name: true } }, items: { include: { product: true } } },
      orderBy: { issuedDate: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.invoice.count({ where }),
  ])

  let items = invoices.map(mapInvoice)
  if (filterPaymentStatus === 'Atrasado') items = items.filter(i => i.paymentStatus === 'Atrasado')

  return NextResponse.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
}

export async function POST(req: NextRequest) {
  const payload = await getUserFromRequestAsync(req)
  if (!payload) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const dto = await req.json()
    if (!dto.invoiceNumber || typeof dto.invoiceNumber !== 'string') {
      return NextResponse.json({ error: 'Número da nota é obrigatório' }, { status: 400 })
    }
    if (!dto.invoiceType || !['Fiscal', 'Avulsa'].includes(dto.invoiceType)) {
      return NextResponse.json({ error: 'Tipo de nota inválido' }, { status: 400 })
    }
    if (!dto.issuedDate || isNaN(Date.parse(dto.issuedDate))) {
      return NextResponse.json({ error: 'Data de emissão inválida' }, { status: 400 })
    }
    const totalAmount = dto.items?.length ? dto.items.reduce((s: number, i: any) => s + i.quantity * i.unitCost, 0) : 0

    const t0 = Date.now()

    const ts = new URL(process.env.DATABASE_URL || '').searchParams
    const turso = createClient({
      url: (process.env.DATABASE_URL || '').replace(/^\ufeff/, ''),
      authToken: (process.env.DATABASE_AUTH_TOKEN || '').replace(/^\ufeff/, ''),
    })

    const id = crypto.randomUUID()
    const { rows } = await turso.execute({
      sql: `INSERT INTO invoices (id, invoice_number, invoice_type, supplier_id, customer_name, customer_document, total_amount, tax_amount, payment_status, status, issued_date, due_date, notes, registered_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pendente', 'Registrada', ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      args: [id, dto.invoiceNumber, dto.invoiceType, dto.supplierId || null, dto.customerName || null, dto.customerDocument || null, totalAmount, 0, new Date(dto.issuedDate).toISOString(), dto.dueDate ? new Date(dto.dueDate).toISOString() : null, dto.notes || null, payload.userId],
    })

    console.log('DEBUG libsql INSERT rows', rows)

    const invoice = await prisma.invoice.findUniqueOrThrow({ where: { id } })

    console.log('DEBUG step1 invoice created in transaction', Date.now() - t0, 'ms')

    if (dto.items?.length) {
      for (const item of dto.items) {
        await prisma.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            productId: item.productId,
            quantity: item.quantity,
            unitCost: item.unitCost,
          },
        })
      }
    }

    console.log('DEBUG step2 items created', Date.now() - t0, 'ms')

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

    console.log('DEBUG step3 movements created', Date.now() - t0, 'ms')

    await createAuditLog({
      userId: payload.userId, action: 'Criar', entity: 'Invoice',
      entityId: invoice.id, module: 'INVOICE',
      description: `Nota ${dto.invoiceType} #${dto.invoiceNumber} criada`,
      newValues: JSON.stringify({ invoiceNumber: dto.invoiceNumber, type: dto.invoiceType, totalAmount }),
    })

    console.log('DEBUG step4 audit log created', Date.now() - t0, 'ms')

    const full = await prisma.invoice.findUnique({
      where: { id: invoice.id },
      include: {
        supplier: true,
        registeredByUser: { select: { name: true } },
        items: { include: { product: true } },
      },
    })
    if (!full) throw new Error('Invoice not found after create')

    return NextResponse.json(mapInvoice(full), { status: 201 })
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: 'Já existe uma nota com este número' }, { status: 409 })
    }
    console.error('Erro ao criar nota:', e)
    return NextResponse.json({ error: 'Erro ao criar nota' }, { status: 500 })
  }
}

function mapInvoice(i: any) {
  let paymentStatus = i.paymentStatus
  if (i.status === 'Cancelada') paymentStatus = 'Cancelado'
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
