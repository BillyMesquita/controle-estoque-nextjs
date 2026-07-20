'use client'

import { useState, useEffect } from 'react'
import { BarChart3, DollarSign, TrendingDown, TrendingUp, Calendar, FileText } from 'lucide-react'

const api = (path: string, options?: RequestInit) => fetch(path, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}`, ...options?.headers } })

export default function FinancialPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('12')
  const [events, setEvents] = useState<any[]>([])
  const [selectedEventId, setSelectedEventId] = useState('')

  useEffect(() => {
    api('/api/events').then(async r => { if (r.ok) setEvents(await r.json()) })
  }, [])

  useEffect(() => {
    setLoading(true)
    const endDate = new Date().toISOString().split('T')[0]
    const startDate = new Date(); startDate.setMonth(startDate.getMonth() - parseInt(period))
    let url = `/api/financial/dashboard?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate}`
    if (selectedEventId) url += `&eventId=${selectedEventId}`
    api(url).then(async r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return r.json()
    }).then(setData).catch(() => setData(null)).finally(() => setLoading(false))
  }, [period, selectedEventId])

  const metrics = data ? [
    { label: 'Vendas (Volume)', value: data.vendas.toFixed(2), icon: TrendingUp, color: 'text-blue-600 bg-blue-50' },
    { label: 'Valor Bruto', value: `R$ ${data.valorBruto.toFixed(2)}`, icon: DollarSign, color: 'text-green-600 bg-green-50' },
    { label: 'Custo', value: `R$ ${data.custoProdutosVendidos.toFixed(2)}`, icon: TrendingDown, color: 'text-orange-600 bg-orange-50' },
    { label: 'Valor Líquido', value: `${data.valorLiquido >= 0 ? '+' : '-'} R$ ${Math.abs(data.valorLiquido).toFixed(2)}`, icon: TrendingUp, color: `${data.valorLiquido >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}` },
  ] : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Financeiro</h1><p className="text-sm text-gray-500 mt-1">Dashboard consolidado em tempo real</p></div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select className="input-field w-auto" value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}>
              <option value="">Todos os eventos</option>
              {events.map((ev: any) => (
                <option key={ev.id} value={ev.id}>{ev.name}</option>
              ))}
            </select>
          </div>
          <select className="input-field w-auto" value={period} onChange={e => setPeriod(e.target.value)}>
            <option value="1">Último mês</option><option value="3">3 meses</option><option value="6">6 meses</option><option value="12">12 meses</option>
          </select>
          <button onClick={() => { const end = new Date(); const start = new Date(); start.setMonth(start.getMonth() - parseInt(period)); const params = new URLSearchParams({ startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] }); if (selectedEventId) params.set('eventId', selectedEventId); window.open(`/api/financial/report?${params}`, '_blank') }} className="btn-secondary text-sm"><FileText className="w-4 h-4" /> Exportar Relatório</button>
        </div>
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
              <div className="flex justify-between py-1"><span className="text-gray-500">- Custo</span><span className="text-orange-600">- R$ {data.custoProdutosVendidos.toFixed(2)}</span></div>
              <div className="border-t pt-2 mt-2 flex justify-between"><span className="font-semibold">= Valor Líquido</span><span className={`font-bold text-lg ${data.valorLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>R$ {data.valorLiquido.toFixed(2)}</span></div>
            </div>
          </div>

        </>
      }
    </div>
  )
}
