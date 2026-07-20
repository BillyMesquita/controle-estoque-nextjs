'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Pencil, Trash2, Calendar, MapPin, CheckCircle, Clock, XCircle } from 'lucide-react'

interface Event { id: string; name: string; description: string | null; startDate: string; endDate: string | null; location: string | null; status: string; isActive: boolean }

import { api } from '@/lib/api'

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  Planejado: { label: 'Planejado', color: 'text-blue-600 bg-blue-50', icon: Clock },
  Ativo: { label: 'Ativo', color: 'text-green-600 bg-green-50', icon: CheckCircle },
  Finalizado: { label: 'Finalizado', color: 'text-gray-600 bg-gray-100', icon: CheckCircle },
  Cancelado: { label: 'Cancelado', color: 'text-red-600 bg-red-50', icon: XCircle },
}

export default function EventosPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await api('/api/events')
      setEvents(await res.json())
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load().catch(() => {}) }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Desativar este evento?')) return
    await api(`/api/events/${id}`, { method: 'DELETE' })
    load()
  }

  const filtered = events.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.location && e.location.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Eventos</h1><p className="text-sm text-gray-500 mt-1">{events.length} cadastrados</p></div>
        <Link href="/eventos/novo" className="btn-primary"><Plus className="w-4 h-4" /> Novo</Link>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input className="input-field pl-10" placeholder="Buscar evento..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      {loading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      : filtered.length === 0 ? <div className="card text-center py-12 text-gray-400"><Calendar className="w-12 h-12 mx-auto mb-3" /><p>Nenhum evento</p></div>
      : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(e => {
            const sc = statusConfig[e.status] || statusConfig.Planejado
            const Icon = sc.icon
            return (
              <div key={e.id} className="card">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{e.name}</h3>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${sc.color}`}>
                        <Icon className="w-3 h-3" /> {sc.label}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link href={`/eventos/${e.id}`} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></Link>
                    <button onClick={() => handleDelete(e.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  {e.description && <p className="text-gray-500">{e.description}</p>}
                  <p className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(e.startDate).toLocaleDateString('pt-BR')}{e.endDate ? ` a ${new Date(e.endDate).toLocaleDateString('pt-BR')}` : ''}</p>
                  {e.location && <p className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {e.location}</p>}
                </div>
              </div>
            )
          })}
        </div>
      }
    </div>
  )
}
