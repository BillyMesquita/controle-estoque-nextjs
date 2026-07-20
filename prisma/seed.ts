import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const DEFAULT_ADMIN_PASS = process.env.DEFAULT_ADMIN_PASS || 'MudarSenha123!'
const DEFAULT_OPER_PASS = process.env.DEFAULT_OPER_PASS || 'MudarSenha456!'

async function main() {
  const userCount = await prisma.user.count()

  if (userCount === 0) {
    await prisma.user.createMany({
      data: [
        { name: 'Admin', username: 'admin', passwordHash: bcrypt.hashSync(DEFAULT_ADMIN_PASS, 10), role: 'Administrador' },
        { name: 'Operador', username: 'operador', passwordHash: bcrypt.hashSync(DEFAULT_OPER_PASS, 10), role: 'Operador' },
      ],
    })
    console.log('✓ Usuários criados')
  }

  const catCount = await prisma.category.count()
  if (catCount === 0) {
    await prisma.category.createMany({
      data: [
        { name: 'Bebidas', description: 'Refrigerantes, sucos, água, cervejas' },
        { name: 'Alimentos', description: 'Salgadinhos, biscoitos, doces' },
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
