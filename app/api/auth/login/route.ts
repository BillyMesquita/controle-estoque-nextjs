import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, signToken } from '@/lib/auth-utils'

const rateLimit = new Map<string, { count: number; resetAt: number }>()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 60_000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimit.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }
  if (entry.count >= MAX_ATTEMPTS) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Muitas tentativas. Tente novamente em 1 minuto.' }, { status: 429 })
    }

    const body = await req.json()
    if (!body.username || !body.password || typeof body.username !== 'string' || typeof body.password !== 'string') {
      return NextResponse.json({ error: 'Usuário e senha são obrigatórios' }, { status: 400 })
    }
    const username = body.username.trim()
    const password = body.password

    const user = await prisma.user.findUnique({ where: { username } })
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: 'Usuário ou senha inválidos' }, { status: 401 })
    }
    if (!user.isActive) {
      return NextResponse.json({ error: 'Usuário inativo' }, { status: 401 })
    }
    const permissions = user.permissions ? JSON.parse(user.permissions) : null
    const token = signToken({ userId: user.id, username: user.username, name: user.name, role: user.role, permissions })
    return NextResponse.json({ token, name: user.name, username: user.username, role: user.role, userId: user.id, permissions })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
