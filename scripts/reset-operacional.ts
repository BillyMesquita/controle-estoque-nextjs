import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('=== Reset Operacional (Parcial) ===')
  console.log('Mantendo: Usuários, Categorias, Configurações do Sistema')
  console.log('Limpando: Produtos, Movimentações, Notas, Fornecedores,\n')

  const cleanups = [
    { table: 'invoice_items', label: 'Itens de Nota Fiscal' },
    { table: 'invoices', label: 'Notas Fiscais' },
    { table: 'stock_movements', label: 'Movimentações de Estoque' },
    { table: 'event_costs', label: 'Custos de Eventos' },
    { table: 'products', label: 'Produtos' },
    { table: 'suppliers', label: 'Fornecedores' },
    { table: 'audit_logs', label: 'Logs de Auditoria' },
  ]

  for (const { table, label } of cleanups) {
    try {
      const deleted: any = await prisma.$executeRawUnsafe(`DELETE FROM ${table}`)
      console.log(`  ✓ ${label}: ${deleted} registros removidos`)
    } catch {
      console.log(`  ~ ${label}: tabela não encontrada`)
    }
  }

  console.log('\n=== Reset concluído com sucesso! ===')
}

main()
  .catch((e) => {
    console.error('Erro durante o reset:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
