'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Trash2, Shield, Users } from 'lucide-react'

import { api } from '@/lib/api'

export default function UsuariosPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api('/api/users')
      setUsers(await res.json())
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load().catch(() => {}) }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Desativar este usuário?')) return
    await api(`/api/users/${id}`, { method: 'DELETE' })
    load()
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Usuários</h1><p className="text-sm text-gray-500 mt-1">{users.length} usuários</p></div>
        <Link href="/usuarios/novo" className="btn-primary"><Plus className="w-4 h-4" /> Novo Usuário</Link>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead><tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 font-medium text-sm">
            <th className="pb-3 pr-4">Nome</th><th className="pb-3 pr-4">Usuário</th><th className="pb-3 pr-4">Função</th><th className="pb-3 pr-4">Status</th><th className="pb-3 pr-4">Ações</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {users.map(u => (
              <tr key={u.id} className="text-sm">
                <td className="py-3 pr-4 font-medium text-gray-900 dark:text-gray-100">{u.name}</td>
                <td className="py-3 pr-4 text-gray-500">{u.username}</td>
                <td className="py-3 pr-4">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${u.role === 'Administrador' ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' : u.role === 'Financeiro' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'}`}>
                    <Shield className="w-3 h-3" /> {u.role}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.isActive ? 'bg-green-50 text-green-700 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-900/50 dark:text-red-300'}`}>
                    {u.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <Link href={`/usuarios/${u.id}`} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><Pencil className="w-4 h-4 text-gray-500" /></Link>
                    <button onClick={() => handleDelete(u.id)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
