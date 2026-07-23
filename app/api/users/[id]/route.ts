import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequestAsync } from '@/lib/auth-utils'
import { hashPasswordAsync } from '@/lib/auth-utils'
import { stripHtml } from '@/lib/sanitize'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await getUserFromRequestAsync(req)
  if (!payload || payload.role !== 'Administrador') return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  const { id } = await params

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, username: true, role: true, permissions: true, isActive: true },
    })
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    return NextResponse.json({ ...user, permissions: user.permissions ? JSON.parse(user.permissions) : [] })
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar usuário' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await getUserFromRequestAsync(req)
  if (!payload || payload.role !== 'Administrador') return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  try {
    const { id } = await params
    const data = await req.json()

    const updateData: any = {}
    if (data.name) updateData.name = stripHtml(data.name as string)
    if (data.username) updateData.username = stripHtml(data.username as string)
    if (data.role) updateData.role = data.role
    if (data.password) updateData.passwordHash = await hashPasswordAsync(data.password)
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
  const payload = await getUserFromRequestAsync(req)
  if (!payload || payload.role !== 'Administrador') return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  try {
    const { id } = await params
    await prisma.user.update({ where: { id }, data: { isActive: false } })
    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: 'Erro ao desativar usuário' }, { status: 500 })
  }
}
