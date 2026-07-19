import { NextResponse } from 'next/server'

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || '(not set)'
  const authToken = process.env.DATABASE_AUTH_TOKEN ? '(set)' : '(not set)'
  const nodeEnv = process.env.NODE_ENV || '(not set)'

  return NextResponse.json({
    database_url: dbUrl.startsWith('libsql') ? dbUrl.substring(0, 50) + '...' : dbUrl,
    auth_token_set: !!process.env.DATABASE_AUTH_TOKEN,
    node_env: nodeEnv,
    has_adapter_pkg: await tryRequire('@prisma/adapter-libsql'),
    has_libsql_pkg: await tryRequire('@libsql/client'),
  })
}

async function tryRequire(name: string) {
  try {
    require(name)
    return true
  } catch {
    return false
  }
}
