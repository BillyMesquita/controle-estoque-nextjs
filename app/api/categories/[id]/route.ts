import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth-utils'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = getUserFromRequest(req)
  if (!payload) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = await params
  const { searchParams } = new URL(req.url)
  const migrateTo = searchParams.get('migrateTo')

  try {
    if (migrateTo) {
      await prisma.product.updateMany({ where: { categoryId: id }, data: { categoryId: migrateTo } })
    }

    const count = await prisma.product.count({ where: { categoryId: id } })
    if (count > 0) {
      return NextResponse.json({ error: `Categoria possui ${count} produto(s) vinculado(s)` }, { status: 400 })
    }

    await prisma.category.update({ where: { id }, data: { isActive: false } })
    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: 'Erro ao remover categoria' }, { status: 500 })
  }
}
