'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Search, Pencil, Trash2, Package, FileText } from 'lucide-react'
import { Pagination } from '@/components/pagination'

interface Product { id: string; sku: string; name: string; description: string | null; categoryId: string; categoryName: string; supplierName: string | null; unitCost: number; salePrice: number; currentStock: number; unit: string; isActive: boolean }
interface Category { id: string; name: string }

import { api } from '@/lib/api'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [exportCategoryId, setExportCategoryId] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('/api/categories', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(cats => {
        setCategories(cats)
        const cerveja600 = cats.find((c: Category) => c.name === 'Cerveja 600ml')
        if (cerveja600) setExportCategoryId(cerveja600.id)
      })
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api(`/api/products?page=${page}&pageSize=50`)
      const data = await res.json()
      setProducts(data.items)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [page])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: string) => {
    if (!confirm('Desativar este produto?')) return
    await api(`/api/products/${id}`, { method: 'DELETE' })
    load()
  }

  const handleExport = async () => {
    const params = new URLSearchParams()
    if (exportCategoryId) params.set('categoryId', exportCategoryId)
    const res = await api(`/api/products/report?${params}`)
    const html = await res.text()
    const blob = new Blob([html], { type: 'text/html' })
    window.open(URL.createObjectURL(blob), '_blank')
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Estoque</h1><p className="text-sm text-gray-500 mt-1">{total} cadastrados</p></div>
        <div className="flex items-center gap-2">
          <select className="input-field w-auto text-sm" value={exportCategoryId} onChange={e => setExportCategoryId(e.target.value)}>
            <option value="">Todas as categorias</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={handleExport} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 text-sm flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium transition-colors"><FileText className="w-4 h-4" /> Exportar Estoque</button>
          <Link href="/estoque/novo" className="btn-primary"><Plus className="w-4 h-4" /> Novo</Link>
        </div>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input className="input-field pl-10" placeholder="Buscar na página..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      {loading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      : filtered.length === 0 ? <div className="card text-center py-12 text-gray-400"><Package className="w-12 h-12 mx-auto mb-3" /><p>Nenhum produto</p></div>
      : <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-200 text-left text-gray-500 font-medium"><th className="pb-3 pr-4">SKU</th><th className="pb-3 pr-4">Nome</th><th className="pb-3 pr-4">Categoria</th><th className="pb-3 pr-4 text-right">Custo</th><th className="pb-3 pr-4 text-right">Venda</th><th className="pb-3 pr-4 text-right">Estoque</th><th className="pb-3"></th></tr></thead>
            <tbody>{filtered.map(p => (
              <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 pr-4 font-mono text-xs text-gray-500">{p.sku}</td>
                <td className="py-3 pr-4 font-medium text-gray-900">{p.name}</td>
                <td className="py-3 pr-4 text-gray-500">{p.categoryName}</td>
                <td className="py-3 pr-4 text-right">R$ {p.unitCost.toFixed(2)}</td>
                <td className="py-3 pr-4 text-right font-medium">R$ {p.salePrice.toFixed(2)}</td>
                <td className="py-3 pr-4 text-right">{p.currentStock.toFixed(2)}</td>
                <td className="py-3">
                  <div className="flex items-center gap-1">
                    <Link href={`/estoque/${p.id}`} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></Link>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
        </div>
      }
    </div>
  )
}
