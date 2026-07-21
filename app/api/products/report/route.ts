import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequestAsync } from '@/lib/auth-utils'

export async function GET(req: NextRequest) {
  const payload = await getUserFromRequestAsync(req)
  if (!payload) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const categoryId = searchParams.get('categoryId')

  try {
    const where: any = { isActive: true }
    if (categoryId) where.categoryId = categoryId

    const products = await prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
    })

    const totalStock = products.reduce((s, p) => s + Number(p.currentStock), 0)
    const totalValue = products.reduce((s, p) => s + Number(p.currentStock) * Number(p.salePrice), 0)
    const totalCost = products.reduce((s, p) => s + Number(p.currentStock) * Number(p.unitCost), 0)
    const categoryName = products[0]?.category?.name || 'Todas as Categorias'

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Relatório de Estoque</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1a1a2e; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  .subtitle { color: #666; font-size: 14px; margin-bottom: 24px; }
  .cards { display: flex; gap: 16px; margin-bottom: 32px; }
  .card { flex: 1; border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; }
  .card .label { font-size: 12px; color: #666; margin-bottom: 4px; }
  .card .value { font-size: 20px; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; padding: 10px 12px; border-bottom: 2px solid #1a1a2e; font-size: 11px; text-transform: uppercase; color: #666; }
  td { padding: 10px 12px; border-bottom: 1px solid #eee; }
  tr:hover { background: #f8f8f8; }
  .text-right { text-align: right; }
  .text-muted { color: #888; }
  .footer { margin-top: 32px; font-size: 11px; color: #aaa; text-align: center; }
  @media print { body { padding: 20px; } .no-print { display: none; } }
</style></head>
<body>
  <h1>Relatório de Estoque</h1>
  <p class="subtitle">${categoryName} — ${new Date().toLocaleDateString('pt-BR')}</p>

  <div class="cards">
    <div class="card"><div class="label">Produtos</div><div class="value">${products.length}</div></div>
    <div class="card"><div class="label">Total em Estoque</div><div class="value">${totalStock.toFixed(2)}</div></div>
    <div class="card"><div class="label">Valor Total (Custo)</div><div class="value">R$ ${totalCost.toFixed(2)}</div></div>
    <div class="card"><div class="label">Valor Total (Venda)</div><div class="value">R$ ${totalValue.toFixed(2)}</div></div>
  </div>

  <table>
    <thead><tr><th>SKU</th><th>Produto</th><th>Categoria</th><th class="text-right">Custo</th><th class="text-right">Venda</th><th class="text-right">Estoque</th><th class="text-right">Total (Venda)</th></tr></thead>
    <tbody>${products.map(p => `
      <tr>
        <td class="text-muted">${p.sku}</td>
        <td><strong>${p.name}</strong></td>
        <td class="text-muted">${p.category.name}</td>
        <td class="text-right">R$ ${Number(p.unitCost).toFixed(2)}</td>
        <td class="text-right">R$ ${Number(p.salePrice).toFixed(2)}</td>
        <td class="text-right">${Number(p.currentStock).toFixed(2)}</td>
        <td class="text-right">R$ ${(Number(p.currentStock) * Number(p.salePrice)).toFixed(2)}</td>
      </tr>`).join('')}</tbody>
  </table>

  <div class="footer">Relatório gerado por Controle de Estoque — Mercado Cultural</div>
  <div class="footer no-print" style="margin-top:8px"><button onclick="window.print()" style="padding:8px 24px;border:1px solid #ccc;border-radius:6px;background:#fff;cursor:pointer">Imprimir</button></div>
</body></html>`

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch {
    return NextResponse.json({ error: 'Erro ao gerar relatório' }, { status: 500 })
  }
}
