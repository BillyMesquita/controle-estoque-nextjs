import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth-utils'
import { createAuditLog } from '@/lib/audit'

export async function GET(req: NextRequest) {
  const payload = getUserFromRequest(req)
  if (!payload) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const categoryId = searchParams.get('categoryId')

  const where: any = { isActive: true }
  if (categoryId) where.categoryId = categoryId

  const products = await prisma.product.findMany({
    where,
    include: { category: true, supplier: true },
    orderBy: { name: 'asc' },
  })

  const result = products.map(p => ({
    id: p.id, sku: p.sku, name: p.name, description: p.description,
    categoryId: p.categoryId, categoryName: p.category.name,
    supplierId: p.supplierId, supplierName: p.supplier?.name || null,
    unitCost: Number(p.unitCost), salePrice: Number(p.salePrice),
    currentStock: Number(p.currentStock),
    unit: p.unit, isActive: p.isActive, updatedAt: p.updatedAt.toISOString(),
  }))

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const payload = getUserFromRequest(req)
  if (!payload) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const data = await req.json()
    const sku = data.sku || `PRD-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    const product = await prisma.product.create({
      data: {
        sku, name: data.name, description: data.description,
        categoryId: data.categoryId, supplierId: data.supplierId,
        unitCost: data.unitCost, salePrice: data.salePrice,
        currentStock: data.currentStock || 0, minStockLevel: 0,
        unit: data.unit || 'UN',
      },
      include: { category: true, supplier: true },
    })

    await createAuditLog({
      userId: payload.userId, action: 'Criar', entity: 'Product',
      entityId: product.id, module: 'PRODUCT',
      description: `Produto ${product.name} criado`,
      newValues: JSON.stringify({ sku, name: data.name }),
    })

    return NextResponse.json({
      id: product.id, sku: product.sku, name: product.name, description: product.description,
      categoryId: product.categoryId, categoryName: product.category.name,
      supplierId: product.supplierId, supplierName: product.supplier?.name || null,
      unitCost: Number(product.unitCost), salePrice: Number(product.salePrice),
      currentStock: Number(product.currentStock),
      unit: product.unit, isActive: product.isActive, updatedAt: product.updatedAt.toISOString(),
    }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar produto' }, { status: 500 })
  }
}
