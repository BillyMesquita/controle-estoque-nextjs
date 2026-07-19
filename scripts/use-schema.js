const { copyFileSync, existsSync } = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const dbUrl = process.env.DATABASE_URL || ''

let schemaName = 'schema.sqlite.prisma'
let label = 'SQLite'

if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
  schemaName = 'schema.postgres.prisma'
  label = 'PostgreSQL'
} else if (dbUrl.startsWith('libsql://')) {
  schemaName = 'schema.turso.prisma'
  label = 'Turso (libsql)'
}

const destSchema = path.join(ROOT, 'prisma', 'schema.prisma')
const sourcePath = path.join(ROOT, 'prisma', schemaName)

if (existsSync(sourcePath)) {
  copyFileSync(sourcePath, destSchema)
  console.log(`[schema] Usando ${label} (${schemaName})`)
} else {
  console.log(`[schema] ${schemaName} não encontrado, mantendo schema.prisma atual`)
}
