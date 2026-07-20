import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth-utils'
import { createAuditLog } from '@/lib/audit'

export async function GET(req: NextRequest) {
  const payload = getUserFromRequest(req)
  if (!payload) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const suppliers = await prisma.supplier.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(suppliers)
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar fornecedores' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const payload = getUserFromRequest(req)
  if (!payload) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const data = await req.json()
    const supplier = await prisma.supplier.create({
      data: {
        name: data.name,
        document: data.document || null,
        contact: data.contact || null,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
      },
    })
    await createAuditLog({
      userId: payload.userId, action: 'Criar', entity: 'Supplier',
      entityId: supplier.id, module: 'SUPPLIER',
      description: `Fornecedor ${supplier.name} criado`,
      newValues: JSON.stringify({ name: supplier.name }),
    })
    return NextResponse.json(supplier, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar fornecedor' }, { status: 500 })
  }
}
