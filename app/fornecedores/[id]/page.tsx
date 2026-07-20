'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Building2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

import { api } from '@/lib/api'

export default function EditarFornecedorPage() {
  const router = useRouter()
  const params = useParams()
  const [form, setForm] = useState({ name: '', document: '', contact: '', phone: '', email: '', address: '' })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api(`/api/suppliers/${params.id}`)
        if (!res.ok) { router.push('/fornecedores'); return }
        const data = await res.json()
        setForm({ name: data.name, document: data.document || '', contact: data.contact || '', phone: data.phone || '', email: data.email || '', address: data.address || '' })
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }
    load().catch(() => {})
  }, [params.id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Nome é obrigatório'); return }
    setSaving(true); setError('')
    const res = await api(`/api/suppliers/${params.id}`, { method: 'PUT', body: JSON.stringify(form) })
    if (!res.ok) { setError('Erro ao salvar'); setSaving(false); return }
    router.push('/fornecedores')
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/fornecedores" className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><ArrowLeft className="w-5 h-5" /></Link>
        <div><h1 className="text-2xl font-bold text-gray-900">Editar Fornecedor</h1><p className="text-sm text-gray-500 mt-1">Alterar dados do fornecedor</p></div>
      </div>
      <form onSubmit={handleSubmit} className="card space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center"><Building2 className="w-6 h-6 text-blue-600" /></div>
          <p className="text-sm text-gray-500">Altere os dados necessários</p>
        </div>
        {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg">{error}</div>}
        <div>
          <label className="label-field">Nome *</label>
          <input name="name" className="input-field" value={form.name} onChange={handleChange} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-field">CNPJ/CPF</label>
            <input name="document" className="input-field" value={form.document} onChange={handleChange} />
          </div>
          <div>
            <label className="label-field">Contato</label>
            <input name="contact" className="input-field" value={form.contact} onChange={handleChange} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-field">Telefone</label>
            <input name="phone" className="input-field" value={form.phone} onChange={handleChange} />
          </div>
          <div>
            <label className="label-field">E-mail</label>
            <input name="email" type="email" className="input-field" value={form.email} onChange={handleChange} />
          </div>
        </div>
        <div>
          <label className="label-field">Endereço</label>
          <textarea name="address" className="input-field" rows={2} value={form.address} onChange={handleChange} />
        </div>
        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Salvando...' : 'Salvar'}</button>
          <Link href="/fornecedores" className="btn-secondary">Cancelar</Link>
        </div>
      </form>
    </div>
  )
}
