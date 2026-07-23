import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('=== Reset para Produção ===')
  console.log('Mantendo: Categorias, Configurações do Sistema')
  console.log('Limpando: Produtos, Movimentações, Notas, Eventos, Fornecedores, Auditoria')
  console.log('Recriando: Apenas adminbilly (Administrador)')

  const cleanups = [
    { table: 'audit_logs', label: 'Logs de Auditoria' },
    { table: 'invoice_items', label: 'Itens de Nota Fiscal' },
    { table: 'invoices', label: 'Notas Fiscais' },
    { table: 'stock_movements', label: 'Movimentações de Estoque' },
    { table: 'event_costs', label: 'Custos de Eventos' },
    { table: 'events', label: 'Eventos' },
    { table: 'products', label: 'Produtos' },
    { table: 'suppliers', label: 'Fornecedores' },
    { table: 'users_old', label: 'Usuários (old)' },
  ]

  for (const { table, label } of cleanups) {
    try {
      const deleted: any = await prisma.$executeRawUnsafe(`DELETE FROM ${table}`)
      console.log(`  ✓ ${label}: ${deleted} registros removidos`)
    } catch {
      console.log(`  ~ ${label}: tabela não encontrada`)
    }
  }

  const adminPass = process.env.DEFAULT_ADMIN_PASS || 'REMOVIDO'
  const hash = await bcrypt.hash(adminPass, 12)

  await prisma.$executeRawUnsafe(`DELETE FROM users WHERE username != 'adminbilly'`)
  await prisma.user.upsert({
    where: { username: 'adminbilly' },
    update: { passwordHash: hash, role: 'Administrador', isActive: true },
    create: { name: 'Administrador', username: 'adminbilly', passwordHash: hash, role: 'Administrador' },
  })
  console.log('  ✓ Usuário adminbilly criado/atualizado')

  console.log('\n=== Reset concluído! ===')
  console.log('Credenciais: adminbilly / REMOVIDO')
}

main()
  .catch((e) => { console.error('Erro:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
