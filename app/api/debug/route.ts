import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const dbUrl = (process.env.DATABASE_URL || '(not set)').replace(/^\ufeff/, '')
  const nodeEnv = process.env.NODE_ENV || '(not set)'

  let dbStatus = 'unknown'
  try {
    await prisma.$connect()
    const count = await prisma.user.count()
    dbStatus = `ok (${count} users)`
  } catch (e: any) {
    dbStatus = e.message?.substring(0, 300) || 'unknown error'
  }

  return NextResponse.json({
    database_url: dbUrl.length > 60 ? dbUrl.substring(0, 60) + '...' : dbUrl,
    auth_token_set: !!process.env.DATABASE_AUTH_TOKEN,
    node_env: nodeEnv,
    db_status: dbStatus,
    first_byte: dbUrl.length > 0 ? dbUrl.charCodeAt(0) : -1,
  })
}
