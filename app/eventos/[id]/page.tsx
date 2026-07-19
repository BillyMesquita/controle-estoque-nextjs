'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Calendar, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const api = (path: string, options?: RequestInit) => fetch(path, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}`, ...options?.headers } })

export default function EditarEventoPage() {
  const router = useRouter()
  const params = useParams()
  const [form, setForm] = useState({ name: '', description: '', startDate: '', endDate: '', location: '', status: 'Planejado' })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      const res = await api(`/api/events/${params.id}`)
      if (!res.ok) { router.push('/eventos'); return }
      const data = await res.json()
      setForm({
        name: data.name,
        description: data.description || '',
        startDate: data.startDate ? data.startDate.split('T')[0] : '',
        endDate: data.endDate ? data.endDate.split('T')[0] : '',
        location: data.location || '',
        status: data.status,
      })
      setLoading(false)
    }
    load()
  }, [params.id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.startDate) { setError('Nome e data são obrigatórios'); return }
    setSaving(true); setError('')
    const res = await api(`/api/events/${params.id}`, { method: 'PUT', body: JSON.stringify(form) })
    if (!res.ok) { setError('Erro ao salvar'); setSaving(false); return }
    router.push('/eventos')
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/eventos" className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><ArrowLeft className="w-5 h-5" /></Link>
        <div><h1 className="text-2xl font-bold text-gray-900">Editar Evento</h1><p className="text-sm text-gray-500 mt-1">Alterar dados do evento</p></div>
      </div>
      <form onSubmit={handleSubmit} className="card space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center"><Calendar className="w-6 h-6 text-purple-600" /></div>
          <p className="text-sm text-gray-500">Altere os dados necessários</p>
        </div>
        {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg">{error}</div>}
        <div>
          <label className="label-field">Nome *</label>
          <input name="name" className="input-field" value={form.name} onChange={handleChange} />
        </div>
        <div>
          <label className="label-field">Descrição</label>
          <textarea name="description" className="input-field" rows={2} value={form.description} onChange={handleChange} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-field">Data de Início *</label>
            <input name="startDate" type="date" className="input-field" value={form.startDate} onChange={handleChange} />
          </div>
          <div>
            <label className="label-field">Data de Término</label>
            <input name="endDate" type="date" className="input-field" value={form.endDate} onChange={handleChange} />
          </div>
        </div>
        <div>
          <label className="label-field">Local</label>
          <input name="location" className="input-field" value={form.location} onChange={handleChange} />
        </div>
        <div>
          <label className="label-field">Status</label>
          <select name="status" className="input-field" value={form.status} onChange={handleChange}>
            <option value="Planejado">Planejado</option>
            <option value="Ativo">Ativo</option>
            <option value="Finalizado">Finalizado</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        </div>
        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Salvando...' : 'Salvar'}</button>
          <Link href="/eventos" className="btn-secondary">Cancelar</Link>
        </div>
      </form>
    </div>
  )
}
