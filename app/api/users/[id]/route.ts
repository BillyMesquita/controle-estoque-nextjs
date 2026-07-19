import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth-utils'
import { hashPassword } from '@/lib/auth-utils'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = getUserFromRequest(req)
  if (!payload || payload.role !== 'Administrador') return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, username: true, role: true, permissions: true, isActive: true },
  })
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  return NextResponse.json({ ...user, permissions: user.permissions ? JSON.parse(user.permissions) : [] })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = getUserFromRequest(req)
  if (!payload || payload.role !== 'Administrador') return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  try {
    const { id } = await params
    const data = await req.json()

    const updateData: any = {}
    if (data.name) updateData.name = data.name
    if (data.username) updateData.username = data.username
    if (data.role) updateData.role = data.role
    if (data.password) updateData.passwordHash = hashPassword(data.password)
    if (data.permissions !== undefined) updateData.permissions = data.permissions?.length ? JSON.stringify(data.permissions) : null
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, username: true, role: true, permissions: true, isActive: true },
    })

    return NextResponse.json({ ...user, permissions: user.permissions ? JSON.parse(user.permissions) : [] })
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = getUserFromRequest(req)
  if (!payload || payload.role !== 'Administrador') return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  try {
    const { id } = await params
    await prisma.user.update({ where: { id }, data: { isActive: false } })
    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: 'Erro ao desativar usuário' }, { status: 500 })
  }
}
