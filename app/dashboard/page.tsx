'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Package, TrendingUp, Calendar, FileText, Plus, ArrowRight, Building2, Box, ShoppingCart, Users } from 'lucide-react'
import { api } from '@/lib/api'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<{ total: number; stock: number }>({ total: 0, stock: 0 })
  const [events, setEvents] = useState<{ total: number; next: any | null }>({ total: 0, next: null })
  const [movements, setMovements] = useState<{ total: number; today: number }>({ total: 0, today: 0 })

  useEffect(() => {
    Promise.all([
      api('/api/products?page=1&pageSize=1').then(r => r.json()),
      api('/api/events?page=1&pageSize=50').then(r => r.json()),
      api('/api/stock-movements?page=1&pageSize=1').then(r => r.json()),
    ]).then(([p, e, m]) => {
      setProducts({ total: p.total || 0, stock: 0 })
      setEvents({ total: e.total || 0, next: null })
      setMovements({ total: m.total || 0, today: 0 })

      if (e.items?.length) {
        const now = new Date()
        const upcoming = e.items
          .filter((ev: any) => ev.status !== 'Finalizado' && ev.status !== 'Cancelado')
          .sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
        const future = upcoming.find((ev: any) => new Date(ev.startDate) >= now)
        const nextEvent = future || upcoming[0]
        if (nextEvent) setEvents(prev => ({ ...prev, next: nextEvent }))
      }

      if (m.items?.length) {
        const todayStr = new Date().toISOString().slice(0, 10)
        const todayCount = m.items.filter((mov: any) => mov.movedAt?.startsWith(todayStr)).length
        setMovements(prev => ({ ...prev, today: todayCount }))
      }

      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const quickActions = [
    { to: '/estoque/novo', label: 'Novo Produto', icon: Package, color: 'bg-blue-500' },
    { to: '/movimentacoes', label: 'Movimentações', icon: TrendingUp, color: 'bg-emerald-500' },
    { to: '/eventos/novo', label: 'Novo Evento', icon: Calendar, color: 'bg-purple-500' },
    { to: '/notas/nova', label: 'Nova Nota', icon: FileText, color: 'bg-amber-500' },
  ]

  const statCards = [
    { to: '/estoque', label: 'Produtos', value: products.total, sub: `${products.stock} unidades`, icon: Box, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30' },
    { to: '/movimentacoes', label: 'Movimentações Hoje', value: movements.today, sub: `${movements.total} total`, icon: ShoppingCart, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
    { to: '/eventos', label: 'Eventos', value: events.total, sub: events.next ? new Date(events.next.startDate).toLocaleDateString('pt-BR') : 'Nenhum', icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/30' },
    { to: '/fornecedores', label: 'Fornecedores', value: '—', sub: 'Cadastrados', icon: Building2, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/30' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Visão geral do sistema</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => {
          const Icon = card.icon
          return (
            <Link key={card.to} href={card.to} className="card hover:shadow-md transition-shadow group">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${card.bg}`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{card.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{card.label}</p>
              {card.sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{card.sub}</p>}
            </Link>
          )
        })}
      </div>

      {events.next && (
        <div className="card bg-gradient-to-r from-purple-600 to-purple-700 text-white border-0">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-white/15 rounded-xl">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-200">Próximo Evento</p>
                <p className="text-xl font-bold mt-0.5">{events.next.name}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-purple-200">
                  <span>{new Date(events.next.startDate).toLocaleDateString('pt-BR')}</span>
                  {events.next.endDate && (
                    <span>a {new Date(events.next.endDate).toLocaleDateString('pt-BR')}</span>
                  )}
                  {events.next.location && <span>{events.next.location}</span>}
                </div>
              </div>
            </div>
            <Link href={`/eventos/${events.next.id}`} className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap">
              Ver evento <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Acesso Rápido</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map(action => {
            const Icon = action.icon
            return (
              <Link key={action.to} href={action.to} className="card hover:shadow-md transition-all hover:-translate-y-0.5 group">
                <div className={`w-10 h-10 ${action.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{action.label}</p>
                <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-400 group-hover:text-blue-500 transition-colors">
                  <Plus className="w-3 h-3" /> Criar
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
