'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, FileText, Trash2, DollarSign } from 'lucide-react'
import { Pagination } from '@/components/pagination'

const paymentColors: Record<string, string> = { Pago: 'text-green-600 bg-green-50', Pendente: 'text-yellow-600 bg-yellow-50', Atrasado: 'text-red-600 bg-red-50', Cancelado: 'text-gray-400 bg-gray-100' }
import { api } from '@/lib/api'

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus) params.set('paymentStatus', filterStatus)
      params.set('page', page.toString())
      params.set('pageSize', '50')
      const res = await api(`/api/invoices?${params}`)
      const data = await res.json()
      setInvoices(data.items)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filterStatus, page])

  const handleDelete = async (id: string) => { if (!confirm('Cancelar nota?')) return; await api(`/api/invoices/${id}`, { method: 'DELETE' }); load() }
  const handlePay = async (id: string) => { if (!confirm('Marcar como paga?')) return; await api(`/api/invoices/${id}/payment-status`, { method: 'PATCH', body: JSON.stringify({ paymentStatus: 'Pago' }) }); load() }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Notas Fiscais</h1><p className="text-sm text-gray-500 mt-1">{total} notas</p></div>
        <Link href="/notas/nova" className="btn-primary"><Plus className="w-4 h-4" /> Nova Nota</Link>
      </div>
      <div className="flex gap-2 flex-wrap">
        {['', 'Pendente', 'Pago', 'Atrasado', 'Cancelado'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 text-xs font-medium rounded-full ${filterStatus === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{s || 'Todas'}</button>
        ))}
      </div>
      {loading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      : invoices.length === 0 ? <div className="card text-center py-12 text-gray-400"><FileText className="w-12 h-12 mx-auto mb-3" /><p>Nenhuma nota</p></div>
      : <div className="grid gap-4">{invoices.map((inv: any) => (
          <div key={inv.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center"><FileText className="w-5 h-5 text-blue-600" /></div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{inv.invoiceNumber}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${inv.invoiceType === 'Fiscal' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>{inv.invoiceType}</span>
                  </div>
                  <p className="text-sm text-gray-500">{inv.supplierName || inv.customerName || 'Sem identificação'}</p>
                  <p className="text-xs text-gray-400 mt-1">Emissão: {new Date(inv.issuedDate).toLocaleDateString('pt-BR')}{inv.dueDate ? ` | Venc: ${new Date(inv.dueDate).toLocaleDateString('pt-BR')}` : ''}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">R$ {inv.totalAmount.toFixed(2)}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${paymentColors[inv.paymentStatus]}`}>{inv.paymentStatus}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
              {inv.paymentStatus !== 'Pago' && inv.paymentStatus !== 'Cancelado' && (
                <button onClick={() => handlePay(inv.id)} className="btn-primary text-xs px-3 py-1.5"><DollarSign className="w-3 h-3" /> Pagar</button>
              )}
              <button onClick={() => handleDelete(inv.id)} className="btn-secondary text-xs px-3 py-1.5 text-red-600 border-red-200"><Trash2 className="w-3 h-3" /> Cancelar</button>
            </div>
          </div>
        ))}
        <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
      </div>
      }
    </div>
  )
}
