import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    await prisma.$connect()

    const adminExists = await prisma.user.findUnique({ where: { username: 'admin' } })
    if (!adminExists) {
      await prisma.user.createMany({
        data: [
          { name: 'Admin', username: 'admin', passwordHash: bcrypt.hashSync('admin123', 10), role: 'Administrador' },
          { name: 'Operador', username: 'operador', passwordHash: bcrypt.hashSync('operador123', 10), role: 'Operador' },
        ],
      })

      await prisma.systemConfig.createMany({
        data: [
          { key: 'company_name', value: 'Mercado Cultural', description: 'Nome da empresa' },
        ],
      })
    }

    const userCount = await prisma.user.count()
    const productCount = await prisma.product.count()

    return NextResponse.json({
      status: 'ok',
      message: 'Banco configurado com sucesso!',
      stats: { usuarios: userCount, produtos: productCount },
      credenciais: {
        admin: { usuario: 'admin', senha: 'admin123' },
        operador: { usuario: 'operador', senha: 'operador123' },
      },
    })
  } catch (e: any) {
    return NextResponse.json({
      status: 'error',
      message: e.message || 'Erro ao conectar no banco de dados',
    }, { status: 500 })
  }
}
