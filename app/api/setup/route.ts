import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    // Testar conexão
    await prisma.$connect()
    
    // Criar usuários se não existirem
    const adminExists = await prisma.user.findUnique({ where: { email: 'admin@sistema.dev' } })
    if (!adminExists) {
      await prisma.user.createMany({
        data: [
          { name: 'Admin', email: 'admin@sistema.dev', passwordHash: bcrypt.hashSync('DEV_REMOVED', 10), role: 'Administrador' },
          { name: 'Operador', email: 'operador@sistema.dev', passwordHash: bcrypt.hashSync('DEV_REMOVED', 10), role: 'Operador' },
        ],
      })

      await prisma.systemConfig.createMany({
        data: [
          { key: 'tax_rate', value: '0', description: 'Percentual de impostos' },
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
        admin: { email: 'admin@sistema.dev', senha: 'DEV_REMOVED' },
        operador: { email: 'operador@sistema.dev', senha: 'DEV_REMOVED' },
      },
    })
  } catch (e: any) {
    return NextResponse.json({
      status: 'error',
      message: e.message || 'Erro ao conectar no banco de dados',
      hint: 'Configure DATABASE_URL nas variáveis de ambiente do Vercel com uma string de conexão PostgreSQL.',
      providers: [
        { name: 'Neon (grátis)', url: 'https://neon.tech', instructions: 'Crie conta > Create database > Copie connection string' },
        { name: 'Supabase (grátis)', url: 'https://supabase.com', instructions: 'Crie conta > New project > Go to settings > Database > Connection string' },
        { name: 'Railway (grátis)', url: 'https://railway.app', instructions: 'Crie conta > New Project > Provision PostgreSQL > Copy DATABASE_URL' },
      ],
    }, 500)
  }
}
