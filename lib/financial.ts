import { prisma } from './prisma'

export async function getFinancialDashboard(startDate?: string, endDate?: string, eventId?: string) {
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
  const end = endDate ? new Date(endDate + 'T23:59:59.999Z') : new Date()

  const where: any = { movedAt: { gte: start, lte: end }, deletedAt: null }
  if (eventId) where.eventId = eventId

  const movements = await prisma.stockMovement.findMany({
    where,
    include: { product: true },
  })

  const q = (m: any) => Math.abs(Number(m.quantity))
  const cost = (m: any) => q(m) * Number(m.unitCost)
  const price = (m: any) => q(m) * Number(m.unitPrice)

  const vendasMov = movements.filter(m => m.type === 'Venda')
  const vendas = vendasMov.reduce((sum, m) => sum + q(m), 0)
  const valorBruto = vendasMov.reduce((sum, m) => sum + price(m), 0)
  const cpv = vendasMov.reduce((sum, m) => sum + cost(m), 0)

  const taxConfig = await prisma.systemConfig.findUnique({ where: { key: 'tax_rate' } })
  const taxRate = taxConfig ? Number(taxConfig.value) / 100 : 0
  const impostos = valorBruto * taxRate
  const valorLiquido = valorBruto - cpv - impostos

  const mensal = Object.entries(
    vendasMov.reduce((acc: Record<string, { valorBruto: number; valorLiquido: number }>, m) => {
      const key = `${m.movedAt.getFullYear()}-${String(m.movedAt.getMonth() + 1).padStart(2, '0')}`
      if (!acc[key]) acc[key] = { valorBruto: 0, valorLiquido: 0 }
      acc[key].valorBruto += price(m)
      acc[key].valorLiquido += price(m) - cost(m)
      return acc
    }, {})
  ).map(([k, v]) => ({
    ano: parseInt(k.split('-')[0]),
    mes: parseInt(k.split('-')[1]),
    ...v,
  })).sort((a, b) => a.ano - b.ano || a.mes - b.mes)

  return {
    vendas, valorBruto,
    custoProdutosVendidos: cpv, impostos, valorLiquido,
    totalMovimentacoes: movements.length,
    calculadoEm: new Date().toISOString(),
    mensal: mensal.length > 0 ? mensal : null,
  }
}
