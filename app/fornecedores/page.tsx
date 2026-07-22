'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Plus, Search, Pencil, Trash2, Building2 } from 'lucide-react'
import { Pagination } from '@/components/pagination'

interface Supplier { id: string; name: string; document: string | null; contact: string | null; phone: string | null; email: string | null; address: string | null; isActive: boolean }

import { api } from '@/lib/api'

export default function FornecedoresPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const isMounted = useRef(true)
  useEffect(() => { return () => { isMounted.current = false } }, [])

  const load = async () => {
    setLoading(true)
    try {
      const res = await api(`/api/suppliers?page=${page}&pageSize=50`)
      const data = await res.json()
      if (!isMounted.current) return
      setSuppliers(data.items)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch { /* ignore */ }
    finally { if (isMounted.current) setLoading(false) }
  }

  useEffect(() => { load() }, [page])

  const handleDelete = async (id: string) => {
    if (!confirm('Desativar este fornecedor?')) return
    await api(`/api/suppliers/${id}`, { method: 'DELETE' })
    load()
  }

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.document && s.document.includes(search)) ||
    (s.contact && s.contact.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Fornecedores</h1><p className="text-sm text-gray-500 mt-1">{total} cadastrados</p></div>
        <Link href="/fornecedores/novo" className="btn-primary"><Plus className="w-4 h-4" /> Novo</Link>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input className="input-field pl-10" placeholder="Buscar na página..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      {loading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      : filtered.length === 0 ? <div className="card text-center py-12 text-gray-400"><Building2 className="w-12 h-12 mx-auto mb-3" /><p>Nenhum fornecedor</p></div>
      : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(s => (
            <div key={s.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{s.name}</h3>
                    {s.document && <p className="text-xs text-gray-500">{s.document}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Link href={`/fornecedores/${s.id}`} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></Link>
                  <button onClick={() => handleDelete(s.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                {s.contact && <p>Contato: {s.contact}</p>}
                {s.phone && <p>Tel: {s.phone}</p>}
                {s.email && <p className="text-blue-600">{s.email}</p>}
                {s.address && <p className="text-xs text-gray-400">{s.address}</p>}
              </div>
            </div>
          ))}
        </div>
      }
      <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
    </div>
  )
}
