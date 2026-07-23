import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequestAsync } from '@/lib/auth-utils'
import { createAuditLog } from '@/lib/audit'
import { stripHtml } from '@/lib/sanitize'

export async function GET(req: NextRequest) {
  const payload = await getUserFromRequestAsync(req)
  if (!payload) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '50')))

    const where = { isActive: true }
    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({ where, orderBy: { name: 'asc' }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.supplier.count({ where }),
    ])
    return NextResponse.json({ items: suppliers, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar fornecedores' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const payload = await getUserFromRequestAsync(req)
  if (!payload) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const data = await req.json()
    data.name = stripHtml(data.name)
    data.contact = stripHtml(data.contact)
    data.document = stripHtml(data.document)
    data.phone = stripHtml(data.phone)
    data.email = stripHtml(data.email)
    data.address = stripHtml(data.address)
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      return NextResponse.json({ error: 'Nome do fornecedor é obrigatório' }, { status: 400 })
    }
    const supplier = await prisma.supplier.create({
      data: {
        name: data.name.trim(),
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
