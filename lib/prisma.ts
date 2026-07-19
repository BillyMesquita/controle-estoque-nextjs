import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  const url = process.env.DATABASE_URL || ''

  if (url.startsWith('libsql://')) {
    const libsql = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN })
    return new PrismaClient({ adapter: new PrismaLibSql(libsql) })
  }

  return new PrismaClient()
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
