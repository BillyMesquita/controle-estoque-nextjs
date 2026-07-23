'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'

import { api } from '@/lib/api'

export default function NewInvoicePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ invoiceType: 'Fiscal', supplierName: '', customerName: '', customerDocument: '', issuedDate: new Date().toISOString().split('T')[0], dueDate: new Date().toISOString().split('T')[0], notes: '' })

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api('/api/invoices', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error); return }
      router.push('/notas')
    } catch { setError('Erro ao salvar') }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/notas" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-gray-600" /></Link>
        <div><h1 className="text-2xl font-bold text-gray-900">Nova Nota</h1></div>
      </div>
      <form onSubmit={handleSubmit} className="card space-y-4">
        <h3 className="font-semibold">Dados da Nota</h3>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="label">Fornecedor *</label><input className="input-field" value={form.supplierName} onChange={set('supplierName')} placeholder="Nome do fornecedor" required /></div>
          <div><label className="label">Tipo</label><select className="input-field" value={form.invoiceType} onChange={set('invoiceType')}><option value="Fiscal">Fiscal</option><option value="Avulsa">Avulsa</option></select></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="label">Data Emissão *</label><input type="date" className="input-field" value={form.issuedDate} onChange={set('issuedDate')} required /></div>
          <div><label className="label">Data Vencimento *</label><input type="date" className="input-field" value={form.dueDate} onChange={set('dueDate')} required /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="label">Cliente *</label><input className="input-field" value={form.customerName} onChange={set('customerName')} placeholder="Nome do cliente" required /></div>
          <div><label className="label">CPF/CNPJ</label><input className="input-field" value={form.customerDocument} onChange={set('customerDocument')} placeholder="Documento" /></div>
        </div>
        <div>
          <label className="label">Observações</label>
          <textarea className="input-field" rows={2} value={form.notes} onChange={set('notes')} />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Link href="/notas" className="btn-secondary">Cancelar</Link>
          <button type="submit" disabled={loading} className="btn-primary"><Save className="w-4 h-4" /> {loading ? 'Salvando...' : 'Registrar'}</button>
        </div>
      </form>
    </div>
  )
}
