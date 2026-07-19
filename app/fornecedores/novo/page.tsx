'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const api = (path: string, options?: RequestInit) => fetch(path, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}`, ...options?.headers } })

export default function NovoFornecedorPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', document: '', contact: '', phone: '', email: '', address: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Nome é obrigatório'); return }
    setSaving(true); setError('')
    const res = await api('/api/suppliers', { method: 'POST', body: JSON.stringify(form) })
    if (!res.ok) { setError('Erro ao salvar'); setSaving(false); return }
    router.push('/fornecedores')
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/fornecedores" className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><ArrowLeft className="w-5 h-5" /></Link>
        <div><h1 className="text-2xl font-bold text-gray-900">Novo Fornecedor</h1><p className="text-sm text-gray-500 mt-1">Cadastrar novo fornecedor no sistema</p></div>
      </div>
      <form onSubmit={handleSubmit} className="card space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center"><Building2 className="w-6 h-6 text-blue-600" /></div>
          <p className="text-sm text-gray-500">Informe os dados do fornecedor</p>
        </div>
        {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg">{error}</div>}
        <div>
          <label className="label-field">Nome *</label>
          <input name="name" className="input-field" placeholder="Nome do fornecedor" value={form.name} onChange={handleChange} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-field">CNPJ/CPF</label>
            <input name="document" className="input-field" placeholder="00.000.000/0001-00" value={form.document} onChange={handleChange} />
          </div>
          <div>
            <label className="label-field">Contato</label>
            <input name="contact" className="input-field" placeholder="Nome do contato" value={form.contact} onChange={handleChange} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-field">Telefone</label>
            <input name="phone" className="input-field" placeholder="(11) 99999-9999" value={form.phone} onChange={handleChange} />
          </div>
          <div>
            <label className="label-field">E-mail</label>
            <input name="email" type="email" className="input-field" placeholder="fornecedor@email.com" value={form.email} onChange={handleChange} />
          </div>
        </div>
        <div>
          <label className="label-field">Endereço</label>
          <textarea name="address" className="input-field" rows={2} placeholder="Rua, número, bairro, cidade" value={form.address} onChange={handleChange} />
        </div>
        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Salvando...' : 'Salvar'}</button>
          <Link href="/fornecedores" className="btn-secondary">Cancelar</Link>
        </div>
      </form>
    </div>
  )
}
