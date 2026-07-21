import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequestAsync } from '@/lib/auth-utils'

export async function GET(req: NextRequest) {
  const payload = await getUserFromRequestAsync(req)
  if (!payload) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const eventId = searchParams.get('eventId')
    if (!eventId) return new NextResponse('<h1>Selecione um evento</h1>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    const end = endDate ? new Date(endDate + 'T23:59:59.999Z') : new Date()

    const where: any = { deletedAt: null, movedAt: { gte: start, lte: end } }
    if (eventId) where.eventId = eventId

    const [event, movements, products, eventCosts] = await Promise.all([
      eventId ? prisma.event.findUnique({ where: { id: eventId } }) : null,
      prisma.stockMovement.findMany({ where, include: { product: true, movedByUser: { select: { name: true } } }, orderBy: { movedAt: 'desc' } }),
      prisma.product.findMany(),
      eventId ? prisma.eventCost.findMany({ where: { eventId } }) : [],
    ])

    const movs = movements.map(m => ({
      data: m.movedAt.toISOString().split('T')[0],
      hora: m.movedAt.toISOString().split('T')[1].slice(0, 5),
      tipo: m.type,
      produto: m.product.name,
      qtd: Math.abs(Number(m.quantity)),
      custoUnit: Number(m.unitCost),
      precoUnit: Number(m.unitPrice),
      totalCusto: Math.abs(Number(m.quantity)) * Number(m.unitCost),
      totalPreco: Math.abs(Number(m.quantity)) * Number(m.unitPrice),
      responsavel: m.movedByUser.name,
    }))

    const vendas = movements.filter(m => m.type === 'Venda')
    const qtdVendas = vendas.reduce((s, m) => s + Math.abs(Number(m.quantity)), 0)
    const valorBruto = vendas.reduce((s, m) => s + Math.abs(Number(m.quantity)) * Number(m.unitPrice), 0)
    const custoTotal = vendas.reduce((s, m) => s + Math.abs(Number(m.quantity)) * Number(m.unitCost), 0)
    const custosAdicionais = eventCosts.reduce((sum, c) => sum + Number(c.amount), 0)
    const custosDetalhado = eventCosts.reduce((acc: Record<string, number>, c) => { acc[c.type] = (acc[c.type] || 0) + Number(c.amount); return acc }, {})
    const valorLiquido = valorBruto - custoTotal - custosAdicionais
    const costRows = Object.entries(custosDetalhado).map(([t, v]) => `<tr><td style="padding-left:24px">${t}</td><td class="text-right text-orange-600">- R$ ${v.toFixed(2)}</td></tr>`).join('')

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${event ? `Relatório - ${event.name}` : 'Relatório Financeiro'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; padding: 40px; font-size: 13px; }
    .header { text-align: center; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #2563eb; }
    .header h1 { font-size: 22px; color: #2563eb; margin-bottom: 4px; }
    .header p { color: #666; font-size: 14px; }
    .periodo { text-align: center; color: #888; font-size: 12px; margin-bottom: 24px; }
    .resumo { display: flex; gap: 16px; justify-content: center; margin-bottom: 32px; flex-wrap: wrap; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 24px; text-align: center; min-width: 140px; }
    .card .label { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
    .card .value { font-size: 20px; font-weight: 700; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th { background: #f1f5f9; text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; }
    td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
    tr:hover td { background: #fafafa; }
    .text-right { text-align: right; }
    .tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; }
    .tag-entrada { background: #dcfce7; color: #166534; }
    .tag-venda { background: #dbeafe; color: #1e40af; }
    .tag-avaria { background: #fee2e2; color: #991b1b; }
    .tag-consumo { background: #ffedd5; color: #9a3412; }
    .footer { text-align: center; color: #94a3b8; font-size: 11px; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
    @media print { body { padding: 20px; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="no-print" style="text-align:center;margin-bottom:24px"><button onclick="window.print()" style="padding:10px 24px;background:#2563eb;color:#fff;border:none;border-radius:6px;font-size:14px;cursor:pointer">Imprimir / Salvar PDF</button></div>
  <div class="header">
    <h1>${event ? `Relatório: ${event.name}` : 'Relatório Financeiro'}</h1>
    <p>${event && event.description ? event.description : ''}</p>
  </div>
  <div class="periodo">Período: ${start.toLocaleDateString('pt-BR')} a ${end.toLocaleDateString('pt-BR')} | Gerado em ${new Date().toLocaleString('pt-BR')}</div>
  <div class="resumo">
    <div class="card"><div class="label">Vendas</div><div class="value">${qtdVendas.toFixed(2)}</div></div>
    <div class="card"><div class="label">Valor Bruto</div><div class="value" style="color:#16a34a">R$ ${valorBruto.toFixed(2)}</div></div>
    <div class="card"><div class="label">Custo Produtos</div><div class="value" style="color:#ea580c">R$ ${custoTotal.toFixed(2)}</div></div>
    ${eventCosts.length > 0 ? `<div class="card"><div class="label">Custos Adicionais</div><div class="value" style="color:#dc2626">R$ ${custosAdicionais.toFixed(2)}</div></div>` : ''}
    <div class="card"><div class="label">Valor Líquido</div><div class="value" style="color:${valorLiquido >= 0 ? '#16a34a' : '#dc2626'}">${valorLiquido >= 0 ? '+' : '-'} R$ ${Math.abs(valorLiquido).toFixed(2)}</div></div>
    <div class="card"><div class="label">Movimentações</div><div class="value">${movements.length}</div></div>
    <div class="card"><div class="label">Produtos</div><div class="value">${products.length}</div></div>
  </div>
  ${eventCosts.length > 0 ? `<h2 style="font-size:16px;margin-bottom:8px">Custos Adicionais</h2><table><thead><tr><th>Tipo</th><th class="text-right">Valor</th></tr></thead><tbody>${costRows}</tbody></table>` : ''}
  <h2 style="font-size:16px;margin:24px 0 8px">Movimentações</h2>
  <table>
    <thead><tr><th>Data</th><th>Tipo</th><th>Produto</th><th class="text-right">Qtd</th><th class="text-right">Custo Unit.</th><th class="text-right">Preço Unit.</th><th class="text-right">Total</th><th>Responsável</th></tr></thead>
    <tbody>${movs.map(m => `<tr><td>${m.data}</td><td><span class="tag tag-${m.tipo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}">${m.tipo}</span></td><td>${m.produto}</td><td class="text-right">${m.qtd.toFixed(2)}</td><td class="text-right">R$ ${m.custoUnit.toFixed(2)}</td><td class="text-right">R$ ${m.precoUnit.toFixed(2)}</td><td class="text-right">R$ ${(m.tipo === 'Venda' ? m.totalPreco : m.tipo === 'Entrada' ? m.totalCusto : 0).toFixed(2)}</td><td>${m.responsavel}</td></tr>`).join('')}</tbody>
  </table>
  <div class="footer">Relatório gerado automaticamente pelo Sistema de Controle de Estoque</div>
</body>
</html>`

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch {
    return NextResponse.json({ error: 'Erro ao gerar relatório' }, { status: 500 })
  }
}
