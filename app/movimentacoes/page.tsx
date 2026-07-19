'use client'

import { useState, useEffect } from 'react'
import { Plus, TrendingUp, ArrowDownRight, ArrowUpRight } from 'lucide-react'

const typeColors: Record<string, string> = { Entrada: 'text-green-600 bg-green-50', Venda: 'text-blue-600 bg-blue-50', Avaria: 'text-red-600 bg-red-50', ConsumoInterno: 'text-orange-600 bg-orange-50', Ajuste: 'text-purple-600 bg-purple-50', Transferencia: 'text-cyan-600 bg-cyan-50' }

const api = (path: string, options?: RequestInit) => fetch(path, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}`, ...options?.headers } })

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('')
  const [form, setForm] = useState({ productId: '', type: 'Entrada', quantity: '1', unitCost: '0', unitPrice: '0', description: '' })

  const load = async () => {
    setLoading(true)
    const [movRes, prodRes] = await Promise.all([api(`/api/stock-movements${filter ? `?type=${filter}` : ''}`), api('/api/products')])
    setMovements(await movRes.json())
    setProducts(await prodRes.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [filter])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await api('/api/stock-movements', {
      method: 'POST',
      body: JSON.stringify({ ...form, quantity: parseFloat(form.quantity), unitCost: parseFloat(form.unitCost), unitPrice: parseFloat(form.unitPrice) }),
    })
    setShowForm(false)
    setForm({ productId: '', type: 'Entrada', quantity: '1', unitCost: '0', unitPrice: '0', description: '' })
    load()
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Movimentações</h1><p className="text-sm text-gray-500 mt-1">{movements.length} registros</p></div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary"><Plus className="w-4 h-4" /> Nova</button>
      </div>
      {showForm && (
        <form onSubmit={handleSubmit} className="card space-y-4">
          <h3 className="font-semibold">Registrar Movimentação</h3>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="label">Produto</label><select className="input-field" value={form.productId} onChange={set('productId')} required><option value="">Selecione</option>{products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div><label className="label">Tipo</label><select className="input-field" value={form.type} onChange={set('type')}>{Object.keys(typeColors).map(t => <option key={t} value={t}>{t}</option>)}</select></div>
            <div><label className="label">Quantidade</label><input type="number" step="0.01" className="input-field" value={form.quantity} onChange={set('quantity')} required /></div>
            <div><label className="label">Custo Unit.</label><input type="number" step="0.01" className="input-field" value={form.unitCost} onChange={set('unitCost')} /></div>
            <div><label className="label">Preço Unit.</label><input type="number" step="0.01" className="input-field" value={form.unitPrice} onChange={set('unitPrice')} /></div>
            <div><label className="label">Descrição</label><input className="input-field" value={form.description} onChange={set('description')} /></div>
          </div>
          <div className="flex justify-end gap-3"><button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button><button type="submit" className="btn-primary">Registrar</button></div>
        </form>
      )}
      <div className="flex gap-2 flex-wrap">
        {['', ...Object.keys(typeColors)].map(t => (
          <button key={t} onClick={() => setFilter(t)} className={`px-3 py-1.5 text-xs font-medium rounded-full ${filter === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{t || 'Todas'}</button>
        ))}
      </div>
      {loading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      : <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-200 text-left text-gray-500 font-medium"><th className="pb-3 pr-4">Data</th><th className="pb-3 pr-4">Tipo</th><th className="pb-3 pr-4">Produto</th><th className="pb-3 pr-4 text-right">Qtd</th><th className="pb-3 pr-4 text-right">Total</th></tr></thead>
            <tbody>{movements.map((m: any) => (
              <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 pr-4 text-xs text-gray-500">{new Date(m.movedAt).toLocaleString('pt-BR')}</td>
                <td className="py-3 pr-4"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[m.type]}`}>{m.quantity > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}{m.type}</span></td>
                <td className="py-3 pr-4 font-medium text-gray-900">{m.productName}</td>
                <td className="py-3 pr-4 text-right font-mono">{m.quantity.toFixed(2)}</td>
                <td className="py-3 pr-4 text-right font-medium">R$ {m.totalCost.toFixed(2)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      }
    </div>
  )
}
