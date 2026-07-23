import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const DEFAULT_ADMIN_PASS = process.env.DEFAULT_ADMIN_PASS || 'REMOVIDO'

async function main() {
  const userCount = await prisma.user.count()

  if (userCount === 0) {
    const hash = await bcrypt.hash(DEFAULT_ADMIN_PASS, 12)
    await prisma.user.create({
      data: { name: 'Administrador', username: 'adminbilly', passwordHash: hash, role: 'Administrador' },
    })
    console.log('✓ Usuário adminbilly criado')
  }

  const catCount = await prisma.category.count()
  if (catCount === 0) {
    await prisma.category.createMany({
      data: [
        { name: 'Cerveja 600ml', description: 'Cervejas em garrafa 600ml' },
        { name: 'Cervejas Long Neck', description: 'Cervejas long neck' },
        { name: 'Energéticos', description: 'Bebidas energéticas' },
        { name: 'Bebidas sem Álcool', description: 'Refrigerantes, sucos, água' },
        { name: 'Limpeza', description: 'Produtos de limpeza e higiene' },
        { name: 'Padaria', description: 'Pães, bolos, salgados' },
        { name: 'Hortifrúti', description: 'Frutas, verduras e legumes' },
        { name: 'Laticínios', description: 'Leite, queijo, iogurte' },
      ],
    })
    console.log('✓ Categorias criadas')
  }

  const configCount = await prisma.systemConfig.count()
  if (configCount === 0) {
    await prisma.systemConfig.createMany({
      data: [

        { key: 'company_name', value: 'Mercado Cultural', description: 'Nome da empresa' },
      ],
    })
    console.log('✓ Configurações criadas')
  }

  const finalUsers = await prisma.user.count()
  const finalCats = await prisma.category.count()
  console.log(`\nSeed concluído: ${finalUsers} usuários, ${finalCats} categorias`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
