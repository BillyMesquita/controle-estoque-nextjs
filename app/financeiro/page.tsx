'use client'

import { useState, useEffect } from 'react'
import { BarChart3, DollarSign, Package, AlertTriangle, TrendingDown, Receipt, TrendingUp } from 'lucide-react'

export default function FinancialPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('12')

  useEffect(() => {
    setLoading(true)
    const endDate = new Date().toISOString().split('T')[0]
    const startDate = new Date(); startDate.setMonth(startDate.getMonth() - parseInt(period))
    fetch(`/api/financial/dashboard?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    }).then(r => r.json()).then(setData).finally(() => setLoading(false))
  }, [period])

  const metrics = data ? [
    { label: 'Vendas (Volume)', value: data.vendas.toFixed(2), icon: TrendingUp, color: 'text-blue-600 bg-blue-50' },
    { label: 'Valor Bruto', value: `R$ ${data.valorBruto.toFixed(2)}`, icon: DollarSign, color: 'text-green-600 bg-green-50' },
    { label: 'CPV', value: `R$ ${data.custoProdutosVendidos.toFixed(2)}`, icon: TrendingDown, color: 'text-orange-600 bg-orange-50' },
    { label: 'Avarias', value: `R$ ${data.avarias.toFixed(2)}`, icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
    { label: 'Consumo Interno', value: `R$ ${data.consumoInterno.toFixed(2)}`, icon: Package, color: 'text-purple-600 bg-purple-50' },
    { label: 'Impostos', value: `R$ ${data.impostos.toFixed(2)}`, icon: Receipt, color: 'text-yellow-600 bg-yellow-50' },
  ] : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Financeiro</h1><p className="text-sm text-gray-500 mt-1">Dashboard consolidado em tempo real</p></div>
        <select className="input-field w-auto" value={period} onChange={e => setPeriod(e.target.value)}>
          <option value="1">Último mês</option><option value="3">3 meses</option><option value="6">6 meses</option><option value="12">12 meses</option>
        </select>
      </div>

      {loading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      : !data ? <div className="card text-center py-12 text-gray-400"><BarChart3 className="w-12 h-12 mx-auto mb-3" /><p>Erro ao carregar</p></div>
      : <>
          <div className="card border-2" style={{ borderColor: data.valorLiquido >= 0 ? '#16a34a' : '#dc2626' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Valor Líquido</p>
                <p className={`text-3xl font-bold ${data.valorLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>{data.valorLiquido >= 0 ? '+' : '-'} R$ {Math.abs(data.valorLiquido).toFixed(2)}</p>
              </div>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${data.valorLiquido >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                {data.valorLiquido >= 0 ? <TrendingUp className="w-7 h-7 text-green-600" /> : <TrendingDown className="w-7 h-7 text-red-600" />}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.map((m: any) => {
              const Icon = m.icon
              return <div key={m.label} className="card"><div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-xl flex items-center justify-center ${m.color}`}><Icon className="w-5 h-5" /></div><div><p className="text-xs text-gray-500 font-medium">{m.label}</p><p className="text-lg font-bold text-gray-900">{m.value}</p></div></div></div>
            })}
          </div>

          <div className="card">
            <h3 className="font-semibold mb-4">Memória de Cálculo</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1"><span className="text-gray-500">Valor Bruto</span><span className="font-medium">R$ {data.valorBruto.toFixed(2)}</span></div>
              <div className="flex justify-between py-1"><span className="text-gray-500">- CPV</span><span className="text-orange-600">- R$ {data.custoProdutosVendidos.toFixed(2)}</span></div>
              <div className="flex justify-between py-1"><span className="text-gray-500">- Avarias</span><span className="text-red-600">- R$ {data.avarias.toFixed(2)}</span></div>
              <div className="flex justify-between py-1"><span className="text-gray-500">- Consumo Interno</span><span className="text-purple-600">- R$ {data.consumoInterno.toFixed(2)}</span></div>
              <div className="flex justify-between py-1"><span className="text-gray-500">- Impostos</span><span className="text-yellow-600">- R$ {data.impostos.toFixed(2)}</span></div>
              <div className="border-t pt-2 mt-2 flex justify-between"><span className="font-semibold">= Valor Líquido</span><span className={`font-bold text-lg ${data.valorLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>R$ {data.valorLiquido.toFixed(2)}</span></div>
            </div>
          </div>

          {data.alertasEstoque?.length > 0 && (
            <div className="card border-red-200 bg-red-50">
              <h3 className="font-semibold flex items-center gap-2 mb-3"><AlertTriangle className="w-4 h-4 text-red-500" /> Alertas ({data.alertasEstoque.length})</h3>
              {data.alertasEstoque.map((a: any) => (
                <div key={a.productId} className="flex items-center justify-between text-sm bg-white rounded-lg px-3 py-2 mb-2">
                  <span className="font-medium">{a.productName}</span>
                  <span className="text-red-600 font-medium">{a.currentStock.toFixed(2)} / min {a.minStockLevel.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      }
    </div>
  )
}
