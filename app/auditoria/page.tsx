'use client'

import { useState, useEffect } from 'react'
import { Shield } from 'lucide-react'

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ module: '', action: '', page: 1 })
  const [total, setTotal] = useState(0)

  const load = async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: filter.page.toString(), pageSize: '50' })
    if (filter.module) params.set('module', filter.module)
    if (filter.action) params.set('action', filter.action)
    const res = await fetch(`/api/audit-logs?${params}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
    const data = await res.json()
    setLogs(data.items)
    setTotal(data.total)
    setLoading(false)
  }

  useEffect(() => { load() }, [filter.page, filter.module, filter.action])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Auditoria</h1><p className="text-sm text-gray-500 mt-1">{total} registros</p></div>
      </div>
      <div className="flex gap-2">
        <select className="input-field w-auto text-sm" value={filter.module} onChange={e => setFilter(prev => ({ ...prev, module: e.target.value }))}>
          <option value="">Todos módulos</option><option value="STOCK">Estoque</option><option value="INVOICE">Notas</option><option value="PRODUCT">Produtos</option>
        </select>
        <select className="input-field w-auto text-sm" value={filter.action} onChange={e => setFilter(prev => ({ ...prev, action: e.target.value }))}>
          <option value="">Todas ações</option><option value="Criar">Criar</option><option value="Atualizar">Atualizar</option><option value="Excluir">Excluir</option>
        </select>
      </div>
      {loading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      : logs.length === 0 ? <div className="card text-center py-12 text-gray-400"><Shield className="w-12 h-12 mx-auto mb-3" /><p>Nenhum registro</p></div>
      : <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-200 text-left text-gray-500 font-medium"><th className="pb-3 pr-4">Data</th><th className="pb-3 pr-4">Usuário</th><th className="pb-3 pr-4">Ação</th><th className="pb-3 pr-4">Entidade</th><th className="pb-3 pr-4">Módulo</th><th className="pb-3">Descrição</th></tr></thead>
            <tbody>{logs.map((log: any) => (
              <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 pr-4 text-xs text-gray-500 whitespace-nowrap">{new Date(log.createdAt).toLocaleString('pt-BR')}</td>
                <td className="py-3 pr-4"><p className="font-medium text-gray-900">{log.userName}</p><p className="text-xs text-gray-400">{log.userUsername || log.userEmail}</p></td>
                <td className="py-3 pr-4"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${log.action === 'Criar' ? 'bg-green-50 text-green-600' : log.action === 'Atualizar' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>{log.action}</span></td>
                <td className="py-3 pr-4 text-gray-700">{log.entity}</td>
                <td className="py-3 pr-4"><span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{log.module}</span></td>
                <td className="py-3 text-gray-500 text-xs max-w-xs truncate">{log.description}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      }
      {total > 50 && <div className="flex justify-center gap-2 items-center">
        <button disabled={filter.page <= 1} onClick={() => setFilter(prev => ({ ...prev, page: prev.page - 1 }))} className="btn-secondary text-xs">Anterior</button>
        <span className="text-sm text-gray-500">Página {filter.page}</span>
        <button disabled={filter.page * 50 >= total} onClick={() => setFilter(prev => ({ ...prev, page: prev.page + 1 }))} className="btn-secondary text-xs">Próxima</button>
      </div>}
    </div>
  )
}
