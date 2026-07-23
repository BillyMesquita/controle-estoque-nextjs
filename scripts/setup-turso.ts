import { createClient } from '@libsql/client'
import { fileURLToPath } from 'url'
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
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
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

  const catCount = await turso.execute('SELECT COUNT(*) as c FROM categories')
  if (Number(catCount.rows[0].c) === 0) {
    const cats = ['Bebidas', 'Alimentos', 'Limpeza', 'Padaria', 'Hortifrúti', 'Laticínios']
    for (const name of cats) {
      await turso.execute({
        sql: "INSERT INTO categories (id, name, description, is_active, created_at, updated_at) VALUES (?, ?, ?, 1, datetime('now'), datetime('now'))",
        args: [crypto.randomUUID(), name, ''],
      })
    }
    console.log('✓ Categorias criadas')
  }

  const adminPass = process.env.DEFAULT_ADMIN_PASS || 'REMOVIDO'
  const adminHash = bcrypt.hashSync(adminPass, 12)

  const existing = await turso.execute("SELECT id FROM users WHERE username = 'adminbilly'")
  if (existing.rows.length === 0) {
    await turso.execute({
      sql: "INSERT INTO users (id, name, username, password_hash, role, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))",
      args: [crypto.randomUUID(), 'Administrador', 'adminbilly', adminHash, 'Administrador'],
    })
    console.log('✓ Usuário adminbilly criado')
  } else {
    await turso.execute({
      sql: "UPDATE users SET password_hash = ?, role = 'Administrador', is_active = 1 WHERE username = 'adminbilly'",
      args: [adminHash],
    })
    console.log('✓ Usuário adminbilly atualizado')
  }

  const configCount = await turso.execute("SELECT COUNT(*) as c FROM system_configs WHERE key = 'company_name'")
  if (Number(configCount.rows[0].c) === 0) {
    await turso.execute({
      sql: "INSERT INTO system_configs (id, key, value, description, updated_at) VALUES (?, ?, ?, ?, datetime('now'))",
      args: [crypto.randomUUID(), 'company_name', 'Mercado Cultural', 'Nome da empresa'],
    })
    console.log('✓ Configurações criadas')
  }

  const count = await turso.execute('SELECT COUNT(*) as c FROM users')
  console.log(`\nUsuários no banco: ${count.rows[0].c}`)
  console.log(`\nBanco Turso configurado com sucesso!`)
}

main().catch((e) => { console.error('Erro:', e); process.exit(1) })
