'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react'

export default function NewInvoicePage() {
  const router = useRouter()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ invoiceNumber: '', invoiceType: 'Fiscal', supplierId: '', customerName: '', customerDocument: '', taxAmount: '0', issuedDate: new Date().toISOString().split('T')[0], dueDate: '', notes: '' })
  const [items, setItems] = useState([{ productId: '', quantity: '1', unitCost: '0' }])

  useEffect(() => { fetch('/api/products', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }).then(r => r.json()).then(setProducts) }, [])

  const addItem = () => setItems(prev => [...prev, { productId: '', quantity: '1', unitCost: '0' }])
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx))
  const updateItem = (idx: number, field: string, value: string) => setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(prev => ({ ...prev, [field]: e.target.value }))
  const totalInvoice = items.reduce((sum, item) => sum + parseFloat(item.quantity || '0') * parseFloat(item.unitCost || '0'), 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ ...form, taxAmount: parseFloat(form.taxAmount), items: items.map(i => ({ productId: i.productId, quantity: parseFloat(i.quantity), unitCost: parseFloat(i.unitCost) })) }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error); return }
      router.push('/notas')
    } catch { setError('Erro ao salvar') }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/notas" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-gray-600" /></Link>
        <div><h1 className="text-2xl font-bold text-gray-900">Nova Nota</h1></div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card space-y-4">
          <h3 className="font-semibold">Dados da Nota</h3>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Número *</label><input className="input-field" value={form.invoiceNumber} onChange={set('invoiceNumber')} required /></div>
            <div><label className="label">Tipo</label><select className="input-field" value={form.invoiceType} onChange={set('invoiceType')}><option value="Fiscal">Fiscal</option><option value="Avulsa">Avulsa</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Fornecedor ID</label><input className="input-field" value={form.supplierId} onChange={set('supplierId')} /></div>
            <div><label className="label">Data Emissão *</label><input type="date" className="input-field" value={form.issuedDate} onChange={set('issuedDate')} required /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Data Vencimento</label><input type="date" className="input-field" value={form.dueDate} onChange={set('dueDate')} /></div>
            <div><label className="label">Impostos (R$)</label><input type="number" step="0.01" className="input-field" value={form.taxAmount} onChange={set('taxAmount')} /></div>
          </div>
        </div>
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Itens</h3>
            <button type="button" onClick={addItem} className="btn-secondary text-xs"><Plus className="w-3 h-3" /> Item</button>
          </div>
          {items.map((item, idx) => (
            <div key={idx} className="flex items-end gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-1"><label className="label">Produto</label><select className="input-field" value={item.productId} onChange={(e) => updateItem(idx, 'productId', e.target.value)} required><option value="">Selecione</option>{products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
              <div className="w-24"><label className="label">Qtd</label><input type="number" step="0.01" className="input-field" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} required /></div>
              <div className="w-32"><label className="label">Custo Unit.</label><input type="number" step="0.01" className="input-field" value={item.unitCost} onChange={(e) => updateItem(idx, 'unitCost', e.target.value)} required /></div>
              <div className="text-right pb-1"><p className="text-sm font-medium">R$ {(parseFloat(item.quantity) * parseFloat(item.unitCost)).toFixed(2)}</p></div>
              {items.length > 1 && <button type="button" onClick={() => removeItem(idx)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>}
            </div>
          ))}
          <div className="flex justify-end pt-3 border-t border-gray-100"><p className="text-lg font-bold text-gray-900">Total: R$ {totalInvoice.toFixed(2)}</p></div>
        </div>
        <div className="flex justify-end gap-3">
          <Link href="/notas" className="btn-secondary">Cancelar</Link>
          <button type="submit" disabled={loading} className="btn-primary"><Save className="w-4 h-4" /> {loading ? 'Salvando...' : 'Registrar'}</button>
        </div>
      </form>
    </div>
  )
}
