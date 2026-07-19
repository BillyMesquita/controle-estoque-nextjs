'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Pencil, Trash2, AlertTriangle, Package } from 'lucide-react'

interface Product { id: string; sku: string; name: string; description: string | null; categoryId: string; categoryName: string; supplierName: string | null; unitCost: number; salePrice: number; currentStock: number; minStockLevel: number; unit: string; isActive: boolean }

const api = (path: string, options?: RequestInit) => fetch(path, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}`, ...options?.headers } })

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)

  const load = async () => {
    setLoading(true)
    const res = await api(`/api/products?lowStock=${lowStockOnly}`)
    setProducts(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [lowStockOnly])

  const handleDelete = async (id: string) => {
    if (!confirm('Desativar este produto?')) return
    await api(`/api/products/${id}`, { method: 'DELETE' })
    load()
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Produtos</h1><p className="text-sm text-gray-500 mt-1">{products.length} cadastrados</p></div>
        <Link href="/produtos/novo" className="btn-primary"><Plus className="w-4 h-4" /> Novo</Link>
      </div>
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input-field pl-10" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={lowStockOnly} onChange={e => setLowStockOnly(e.target.checked)} className="rounded border-gray-300 text-blue-600" />
          Estoque baixo
        </label>
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
                <td className="py-3 pr-4 text-right"><span className={`${p.currentStock <= p.minStockLevel ? 'text-red-600 font-semibold' : ''}`}>{p.currentStock.toFixed(2)}</span></td>
                <td className="py-3">
                  <div className="flex items-center gap-1">
                    <Link href={`/produtos/${p.id}`} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></Link>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      }
    </div>
  )
}
