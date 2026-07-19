import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-dev-secret-key-change-in-production'

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
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' })
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload
}

export function getUserFromRequest(req: NextRequest): JwtPayload | null {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  try { return verifyToken(auth.slice(7)) } catch { return null }
}

export function isAdmin(req: NextRequest): boolean {
  return getUserFromRequest(req)?.role === 'Administrador'
}
