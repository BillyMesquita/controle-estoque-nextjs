import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminExists = await prisma.user.findUnique({ where: { email: 'admin@sistema.dev' } })
  if (adminExists) { console.log('Seed já executado'); return }

  await prisma.user.createMany({
    data: [
      { name: 'Admin', email: 'admin@sistema.dev', passwordHash: bcrypt.hashSync('DEV_REMOVED', 10), role: 'Administrador' },
      { name: 'Operador', email: 'operador@sistema.dev', passwordHash: bcrypt.hashSync('DEV_REMOVED', 10), role: 'Operador' },
    ],
  })

  await prisma.systemConfig.createMany({
    data: [
      { key: 'tax_rate', value: '0', description: 'Percentual de impostos sobre valor bruto' },
      { key: 'company_name', value: 'Mercado Cultural', description: 'Nome da empresa' },
    ],
  })

  console.log('Seed concluído: admin/DEV_REMOVED, operador/DEV_REMOVED')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
