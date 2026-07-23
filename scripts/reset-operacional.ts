import { createClient } from '@libsql/client'
import { randomUUID } from 'crypto'
import * as bcrypt from 'bcryptjs'

async function main() {
  const url = process.env.DATABASE_URL
  const authToken = process.env.DATABASE_AUTH_TOKEN
  const adminPass = process.env.DEFAULT_ADMIN_PASS

  if (!url || !authToken || !adminPass) {
    console.error('Defina DATABASE_URL, DATABASE_AUTH_TOKEN e DEFAULT_ADMIN_PASS')
    process.exit(1)
  }

  const db = createClient({ url, authToken })

  console.log('=== Reset para Produção (Turso) ===')
  console.log('Mantendo: Categorias, Configurações do Sistema')

  const cleanups = [
    'audit_logs', 'invoice_items', 'invoices', 'stock_movements',
    'event_costs', 'events', 'products', 'suppliers',
  ]

  for (const table of cleanups) {
    try {
      const r = await db.execute(`DELETE FROM ${table}`)
      console.log(`  ✓ ${table}: ${r.rowsAffected} registros removidos`)
    } catch {
      console.log(`  ~ ${table}: tabela não encontrada`)
    }
  }

  try {
    await db.execute("DELETE FROM users WHERE username != 'adminbilly'")
    console.log('  ✓ Usuários antigos removidos')
  } catch {
    console.log('  ~ users: tabela não encontrada')
  }

  const hash = bcrypt.hashSync(adminPass, 12)
  const existing = await db.execute("SELECT id FROM users WHERE username = 'adminbilly'")
  if (existing.rows.length === 0) {
    await db.execute({
      sql: "INSERT INTO users (id, name, username, password_hash, role, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))",
      args: [randomUUID(), 'Administrador', 'adminbilly', hash, 'Administrador'],
    })
    console.log('  ✓ Usuário adminbilly criado')
  } else {
    await db.execute({
      sql: "UPDATE users SET password_hash = ?, is_active = 1 WHERE username = 'adminbilly'",
      args: [hash],
    })
    console.log('  ✓ Senha do adminbilly atualizada')
  }

  console.log('\n=== Reset concluído! ===')
}

main().catch((e) => { console.error('Erro:', e); process.exit(1) })
