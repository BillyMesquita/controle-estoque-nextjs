import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequestAsync } from '@/lib/auth-utils'
import { createAuditLog } from '@/lib/audit'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await getUserFromRequestAsync(req)
  if (!payload || payload.role !== 'Administrador') return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  const { id } = await params

  const invoice = await prisma.invoice.findUnique({ where: { id } })
  if (!invoice) return NextResponse.json({ error: 'Nota não encontrada' }, { status: 404 })

  const dto = await req.json()
  const previous = invoice.paymentStatus

  const updated = await prisma.invoice.update({
    where: { id },
    data: {
      paymentStatus: dto.paymentStatus,
      paidAt: dto.paymentStatus === 'Pago' ? new Date() : invoice.paidAt,
    },
  })

  await createAuditLog({
    userId: payload.userId, action: 'Atualizar', entity: 'Invoice',
    entityId: id, module: 'INVOICE',
    description: `Status de pagamento alterado: ${previous} -> ${dto.paymentStatus}`,
    previousValues: JSON.stringify({ paymentStatus: previous }),
    newValues: JSON.stringify({ paymentStatus: dto.paymentStatus }),
  })

  return NextResponse.json({ paymentStatus: updated.paymentStatus, paidAt: updated.paidAt })
}
