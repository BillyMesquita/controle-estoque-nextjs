import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth-utils'
import { getFinancialDashboard } from '@/lib/financial'

export async function GET(req: NextRequest) {
  const payload = getUserFromRequest(req)
  if (!payload || payload.role !== 'Administrador') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined
    const eventId = searchParams.get('eventId') || undefined

    const dashboard = await getFinancialDashboard(startDate, endDate, eventId)
    return NextResponse.json(dashboard)
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar dashboard financeiro' }, { status: 500 })
  }
}
