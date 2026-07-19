'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package, TrendingUp, FileText, BarChart3, Shield, LogOut, Menu, X, Box } from 'lucide-react'

const navItems = [
  { to: '/produtos', label: 'Produtos', icon: Package, roles: ['Operador', 'Administrador'] },
  { to: '/movimentacoes', label: 'Movimentações', icon: TrendingUp, roles: ['Operador', 'Administrador'] },
  { to: '/notas', label: 'Notas Fiscais', icon: FileText, roles: ['Operador', 'Administrador'] },
  { to: '/financeiro', label: 'Financeiro', icon: BarChart3, roles: ['Administrador'] },
  { to: '/auditoria', label: 'Auditoria', icon: Shield, roles: ['Administrador'] },
]

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) setUser(JSON.parse(stored))
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  const isAdmin = user?.role === 'Administrador'
  const filteredNav = navItems.filter(item => item.roles.includes(user?.role || 'Operador'))

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col`}>
        <div className="h-16 flex items-center gap-3 px-6 border-b border-gray-200">
          <Box className="w-8 h-8 text-blue-600" />
          <div><h1 className="font-bold text-sm text-gray-900">Mercado Cultural</h1><p className="text-xs text-gray-500">Controle de Estoque</p></div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {filteredNav.map(item => {
            const Icon = item.icon
            const active = pathname.startsWith(item.to)
            return (
              <Link key={item.to} href={item.to} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                <Icon className="w-5 h-5" /> {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-xs font-bold text-blue-600">{user?.name?.charAt(0)?.toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 lg:px-6">
          <button className="lg:hidden p-2 hover:bg-gray-100 rounded-lg" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
