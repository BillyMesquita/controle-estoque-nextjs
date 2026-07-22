import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  let url = (process.env.DATABASE_URL || '').replace(/^\ufeff/, '')
  const authToken = (process.env.DATABASE_AUTH_TOKEN || '').replace(/^\ufeff/, '')

  if (url.startsWith('libsql://')) {
    const adapter = new PrismaLibSQL({ url, authToken })
    return new PrismaClient({ adapter })
  }

  return new PrismaClient()
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()
globalForPrisma.prisma = prisma
