import { execSync } from 'child_process'
import { copyFileSync, existsSync, writeFileSync } from 'fs'
import * as path from 'path'

const ROOT = path.resolve(__dirname, '..')
const isPostgres = process.env.DATABASE_URL?.startsWith('postgres')

async function main() {
  console.log('╔══════════════════════════════════════════╗')
  console.log('║  Setup do Banco de Dados                ║')
  console.log('╚══════════════════════════════════════════╝')
  console.log()

  // Usar schema correto
  const schemaFile = isPostgres ? 'schema.prisma' : 'schema.sqlite.prisma'
  console.log(`▸ Usando schema: ${schemaFile}`)
  console.log(`▸ Provider: ${isPostgres ? 'PostgreSQL' : 'SQLite'}`)

  // Criar .env se não existir
  const envPath = path.join(ROOT, '.env')
  if (!existsSync(envPath)) {
    const dbUrl = isPostgres
      ? process.env.DATABASE_URL!
      : `file:${path.join(ROOT, 'prisma/dev.db')}`
    writeFileSync(envPath, `DATABASE_URL="${dbUrl}"\nJWT_SECRET="setup-secret-key-change-in-production"\n`)
    console.log('▸ Arquivo .env criado')
  }

  // Push schema
  console.log('▸ Executando prisma db push...')
  execSync(`npx prisma db push --schema=prisma/${schemaFile} --accept-data-loss`, {
    cwd: ROOT, stdio: 'inherit',
  })

  // Seed
  console.log('▸ Executando seed...')
  execSync('npx tsx prisma/seed.ts', { cwd: ROOT, stdio: 'inherit' })

  console.log()
  console.log('✓ Setup concluído com sucesso!')
  console.log()
  console.log('Credenciais:')
  console.log('  Admin:    admin@sistema.com / admin123')
  console.log('  Operador: operador@sistema.com / operador123')
}

main().catch((e) => {
  console.error('Erro:', e)
  process.exit(1)
})
