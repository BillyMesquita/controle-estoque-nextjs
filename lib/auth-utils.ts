import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET environment variable is not set')
const JWT_SECRET = process.env.JWT_SECRET

export interface JwtPayload {
  userId: string
  username: string
  name: string
  role: string
  permissions?: string[] | null
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10)
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash)
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' })
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload
}

export function setTokenCookie(response: NextResponse, token: string) {
  response.cookies.set('token', token, {
    httpOnly: true, secure: true, sameSite: 'strict',
    path: '/', maxAge: 60 * 60 * 24,
  })
}

export function clearTokenCookie(response: NextResponse) {
  response.cookies.set('token', '', {
    httpOnly: true, secure: true, sameSite: 'strict',
    path: '/', maxAge: 0,
  })
}

export function getUserFromRequest(req: NextRequest): JwtPayload | null {
  const auth = req.headers.get('authorization')
  let token: string | null = null
  if (auth?.startsWith('Bearer ')) token = auth.slice(7)
  if (!token) token = req.cookies.get('token')?.value || null
  if (!token) return null
  try { return verifyToken(token) } catch { return null }
}

export async function hashPasswordAsync(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPasswordAsync(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function getUserFromRequestAsync(req: NextRequest): Promise<JwtPayload | null> {
  const payload = getUserFromRequest(req)
  if (!payload) return null
  const { prisma } = await import('@/lib/prisma')
  const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { isActive: true } })
  if (!user?.isActive) return null
  return payload
}
