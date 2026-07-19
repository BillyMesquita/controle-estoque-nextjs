'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Shield } from 'lucide-react'

const api = (path: string, options?: RequestInit) => fetch(path, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}`, ...options?.headers } })

const menuItems = [
  { to: '/produtos', label: 'Produtos' },
  { to: '/movimentacoes', label: 'Movimentações' },
  { to: '/notas', label: 'Notas Fiscais' },
  { to: '/fornecedores', label: 'Fornecedores' },
  { to: '/eventos', label: 'Eventos' },
  { to: '/financeiro', label: 'Financeiro' },
  { to: '/auditoria', label: 'Auditoria' },
]

export default function EditarUsuarioPage() {
  const router = useRouter()
  const params = useParams()
  const [form, setForm] = useState({ name: '', username: '', password: '', role: 'Operador', isActive: true })
  const [permissions, setPermissions] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api(`/api/users/${params.id}`).then(async r => {
      if (!r.ok) { router.push('/usuarios'); return }
      const data = await r.json()
      setForm({ name: data.name, username: data.username, password: '', role: data.role, isActive: data.isActive })
      setPermissions(data.permissions || [])
      setLoading(false)
    })
  }, [params.id, router])

  const togglePermission = (to: string) => {
    setPermissions(prev => prev.includes(to) ? prev.filter(p => p !== to) : [...prev, to])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setError('')
    const body: any = { name: form.name, username: form.username, role: form.role, permissions, isActive: form.isActive }
    if (form.password) body.password = form.password
    const res = await api(`/api/users/${params.id}`, { method: 'PUT', body: JSON.stringify(body) })
    if (!res.ok) { const d = await res.json(); setError(d.error); setSaving(false); return }
    router.push('/usuarios')
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/usuarios" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" /></Link>
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Editar Usuário</h1></div>
      </div>
      <form onSubmit={handleSubmit} className="card space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/50 flex items-center justify-center"><Shield className="w-6 h-6 text-purple-600" /></div>
          <p className="text-sm text-gray-500">Altere as credenciais e permissões do usuário</p>
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Nome *</label><input name="name" className="input-field" value={form.name} onChange={handleChange} required /></div>
          <div><label className="label">Usuário *</label><input name="username" className="input-field" value={form.username} onChange={handleChange} required /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Nova Senha (deixe vazio para manter)</label><input name="password" type="password" className="input-field" value={form.password} onChange={handleChange} /></div>
          <div><label className="label">Função</label><select name="role" className="input-field" value={form.role} onChange={handleChange}>
            <option value="Operador">Operador</option><option value="Administrador">Administrador</option>
          </select></div>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(prev => ({ ...prev, isActive: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Usuário ativo</span>
          </label>
        </div>
        <div className="pt-2">
          <label className="label mb-3">Permissões de Acesso (deixe vazio para acesso total)</label>
          <div className="grid grid-cols-2 gap-3">
            {menuItems.map(item => (
              <label key={item.to} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                <input type="checkbox" checked={permissions.includes(item.to)} onChange={() => togglePermission(item.to)} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
          <Link href="/usuarios" className="btn-secondary">Cancelar</Link>
          <button type="submit" disabled={saving} className="btn-primary"><Save className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </form>
    </div>
  )
}
