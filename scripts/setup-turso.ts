import { createClient } from '@libsql/client'
import * as fs from 'fs'
import * as path from 'path'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

const url = process.env.DATABASE_URL
const authToken = process.env.DATABASE_AUTH_TOKEN

if (!url || !authToken) {
  console.error('Defina DATABASE_URL e DATABASE_AUTH_TOKEN')
  process.exit(1)
}

const turso = createClient({ url, authToken })

async function main() {
  const sqlPath = path.resolve(__dirname, '..', 'prisma', 'setup-turso.sql')
  const sql = fs.readFileSync(sqlPath, 'utf-8')

  const statements = sql
    .split(';')
    .map(s => s.trim().replace(/\r?\n|\r/g, ' '))
    .filter(s => s.length > 0 && !s.startsWith('--'))

  console.log(`▸ Executando ${statements.length} comandos SQL...`)
  for (const stmt of statements) {
    try {
      await turso.execute(stmt)
    } catch (e: any) {
      if (!e.message?.includes('already exists')) throw e
    }
  }
  console.log('✓ Tabelas criadas')

  const existing = await turso.execute("SELECT id FROM users WHERE email = 'admin@sistema.com'")
  if (existing.rows.length === 0) {
    const adminHash = bcrypt.hashSync('admin123', 10)
    const operHash = bcrypt.hashSync('operador123', 10)

    await turso.execute({
      sql: "INSERT INTO users (id, name, email, password_hash, role, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))",
      args: [crypto.randomUUID(), 'Admin', 'admin@sistema.com', adminHash, 'Administrador'],
    })
    await turso.execute({
      sql: "INSERT INTO users (id, name, email, password_hash, role, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))",
      args: [crypto.randomUUID(), 'Operador', 'operador@sistema.com', operHash, 'Operador'],
    })
    await turso.execute({
      sql: "INSERT INTO system_configs (id, key, value, description, updated_at) VALUES (?, ?, ?, ?, datetime('now'))",
      args: [crypto.randomUUID(), 'tax_rate', '0', 'Percentual de impostos'],
    })
    await turso.execute({
      sql: "INSERT INTO system_configs (id, key, value, description, updated_at) VALUES (?, ?, ?, ?, datetime('now'))",
      args: [crypto.randomUUID(), 'company_name', 'Mercado Cultural', 'Nome da empresa'],
    })
    console.log('✓ Seed concluído')
  } else {
    console.log('✓ Seed já executado anteriormente')
  }

  const count = await turso.execute('SELECT COUNT(*) as c FROM users')
  console.log(`\nUsuários no banco: ${count.rows[0].c}`)
  console.log('\nCredenciais:')
  console.log('  Admin:    admin@sistema.com / admin123')
  console.log('  Operador: operador@sistema.com / operador123')
  console.log(`\nBanco Turso configurado com sucesso!`)
}

main().catch((e) => { console.error('Erro:', e); process.exit(1) })
