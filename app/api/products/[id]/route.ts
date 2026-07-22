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
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true, supplier: true },
    })
    if (!product) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })

    return NextResponse.json({
      id: product.id, sku: product.sku, name: product.name, description: product.description,
      categoryId: product.categoryId, categoryName: product.category.name,
      supplierId: product.supplierId, supplierName: product.supplier?.name || null,
      unitCost: Number(product.unitCost), salePrice: Number(product.salePrice),
      currentStock: Number(product.currentStock),
      unit: product.unit, isActive: product.isActive, updatedAt: product.updatedAt.toISOString(),
    })
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar produto' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await getUserFromRequestAsync(req)
  if (!payload) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { id } = await params

  try {
    const product = await prisma.product.findUnique({ where: { id } })
    if (!product) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })

    const previous = { name: product.name, unitCost: Number(product.unitCost), salePrice: Number(product.salePrice) }
    const data = await req.json()

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.categoryId && { categoryId: data.categoryId }),
        ...(data.supplierId ? { supplierId: data.supplierId } : { supplierId: null }),
        ...(data.unitCost !== undefined && { unitCost: Number(data.unitCost) }),
        ...(data.salePrice !== undefined && { salePrice: Number(data.salePrice) }),
        ...(data.unit && { unit: data.unit }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    })

    await createAuditLog({
      userId: payload.userId, action: 'Atualizar', entity: 'Product',
      entityId: updated.id, module: 'PRODUCT',
      description: `Produto ${updated.name} atualizado`,
      previousValues: JSON.stringify(previous),
      newValues: JSON.stringify({ name: updated.name, unitCost: Number(updated.unitCost), salePrice: Number(updated.salePrice) }),
    })

    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: 'Erro ao excluir produto' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await getUserFromRequestAsync(req)
  if (!payload || payload.role !== 'Administrador') return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  const { id } = await params

  try {
    const product = await prisma.product.findUnique({ where: { id } })
    if (!product) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })

    await prisma.product.update({ where: { id }, data: { isActive: false } })

    await createAuditLog({
      userId: payload.userId, action: 'Excluir', entity: 'Product',
      entityId: product.id, module: 'PRODUCT',
      description: `Produto ${product.name} desativado`,
    })

    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: 'Erro ao excluir produto' }, { status: 500 })
  }
}
