const { copyFileSync, existsSync } = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const dbUrl = process.env.DATABASE_URL || ''

const isPostgres = dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')
const sourceSchema = isPostgres ? 'schema.postgres.prisma' : 'schema.sqlite.prisma'
const destSchema = path.join(ROOT, 'prisma', 'schema.prisma')
const sourcePath = path.join(ROOT, 'prisma', sourceSchema)

if (existsSync(sourcePath)) {
  copyFileSync(sourcePath, destSchema)
  console.log(`[schema] Usando ${isPostgres ? 'PostgreSQL' : 'SQLite'} (${sourceSchema})`)
} else {
  console.log(`[schema] ${sourceSchema} não encontrado, mantendo schema.prisma atual`)
}
