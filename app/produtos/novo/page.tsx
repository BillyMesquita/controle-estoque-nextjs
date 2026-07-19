'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'

interface Category { id: string; name: string }
interface Supplier { id: string; name: string }

export default function NewProductPage() {
  const router = useRouter()
  const [form, setForm] = useState({ sku: '', name: '', description: '', categoryId: '', supplierId: '', unitCost: '', salePrice: '', currentStock: '0', minStockLevel: '0', unit: 'UN' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('/api/categories', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setCategories)
    fetch('/api/suppliers', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setSuppliers)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.categoryId) { setError('Selecione uma categoria'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/products', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ ...form, unitCost: parseFloat(form.unitCost), salePrice: parseFloat(form.salePrice), currentStock: parseFloat(form.currentStock), minStockLevel: parseFloat(form.minStockLevel) }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error); return }
      router.push('/produtos')
    } catch { setError('Erro ao salvar') }
    finally { setSaving(false) }
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/produtos" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-gray-600" /></Link>
        <div><h1 className="text-2xl font-bold text-gray-900">Novo Produto</h1></div>
      </div>
      <form onSubmit={handleSubmit} className="card space-y-5">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">SKU *</label><input className="input-field" value={form.sku} onChange={set('sku')} required /></div>
          <div><label className="label">Unidade</label><select className="input-field" value={form.unit} onChange={set('unit')}><option value="UN">UN</option><option value="KG">KG</option><option value="LT">LT</option></select></div>
        </div>
        <div><label className="label">Nome *</label><input className="input-field" value={form.name} onChange={set('name')} required /></div>
        <div><label className="label">Descrição</label><textarea className="input-field" rows={2} value={form.description} onChange={set('description')} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Categoria *</label>
            <select className="input-field" value={form.categoryId} onChange={set('categoryId')} required>
              <option value="">Selecione...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Fornecedor</label>
            <select className="input-field" value={form.supplierId} onChange={set('supplierId')}>
              <option value="">Nenhum</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Custo Unitário (R$) *</label><input type="number" step="0.01" className="input-field" value={form.unitCost} onChange={set('unitCost')} required /></div>
          <div><label className="label">Preço de Venda (R$) *</label><input type="number" step="0.01" className="input-field" value={form.salePrice} onChange={set('salePrice')} required /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Estoque Atual</label><input type="number" step="0.01" className="input-field" value={form.currentStock} onChange={set('currentStock')} /></div>
          <div><label className="label">Nível Mínimo</label><input type="number" step="0.01" className="input-field" value={form.minStockLevel} onChange={set('minStockLevel')} /></div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Link href="/produtos" className="btn-secondary">Cancelar</Link>
          <button type="submit" disabled={saving} className="btn-primary"><Save className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </form>
    </div>
  )
}
