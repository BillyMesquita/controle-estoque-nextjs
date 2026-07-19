import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || '(not set)'
  const nodeEnv = process.env.NODE_ENV || '(not set)'

  let prismaStatus = 'ok'
  try {
    const p = new PrismaClient()
    await p.$connect()
    await p.$disconnect()
  } catch (e: any) {
    prismaStatus = e.message?.substring(0, 200) || 'unknown'
  }

  return NextResponse.json({
    database_url: dbUrl.length > 60 ? dbUrl.substring(0, 60) + '...' : dbUrl,
    auth_token_set: !!process.env.DATABASE_AUTH_TOKEN,
    node_env: nodeEnv,
    prisma_connect: prismaStatus,
    first_byte: dbUrl.length > 0 ? dbUrl.charCodeAt(0) : -1,
  })
}
