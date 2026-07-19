import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminExists = await prisma.user.findUnique({ where: { email: 'admin@sistema.com' } })
  if (adminExists) { console.log('Seed já executado'); return }

  await prisma.user.createMany({
    data: [
      { name: 'Admin', email: 'admin@sistema.com', passwordHash: bcrypt.hashSync('admin123', 10), role: 'Administrador' },
      { name: 'Operador', email: 'operador@sistema.com', passwordHash: bcrypt.hashSync('operador123', 10), role: 'Operador' },
    ],
  })

  await prisma.systemConfig.createMany({
    data: [
      { key: 'tax_rate', value: '0', description: 'Percentual de impostos sobre valor bruto' },
      { key: 'company_name', value: 'Mercado Cultural', description: 'Nome da empresa' },
    ],
  })

  console.log('Seed concluído: admin/admin123, operador/operador123')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
