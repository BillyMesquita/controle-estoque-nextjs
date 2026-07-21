'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package, TrendingUp, FileText, BarChart3, Shield, LogOut, Menu, X, Box, Building2, Calendar, Users, Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: BarChart3, roles: ['Operador', 'Administrador'] },
  { to: '/estoque', label: 'Estoque', icon: Package, roles: ['Operador', 'Administrador'] },
  { to: '/movimentacoes', label: 'Movimentações', icon: TrendingUp, roles: ['Operador', 'Administrador'] },
  { to: '/notas', label: 'Notas Fiscais', icon: FileText, roles: ['Operador', 'Administrador'] },
  { to: '/fornecedores', label: 'Fornecedores', icon: Building2, roles: ['Operador', 'Administrador'] },
  { to: '/eventos', label: 'Eventos', icon: Calendar, roles: ['Operador', 'Administrador'] },
  { to: '/financeiro', label: 'Financeiro', icon: BarChart3, roles: ['Administrador'] },
  { to: '/auditoria', label: 'Auditoria', icon: Shield, roles: ['Administrador'] },
  { to: '/usuarios', label: 'Usuários', icon: Users, roles: ['Administrador'] },
]

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => { setMounted(true) }, [])

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
  const userPermissions = user?.permissions
  const filteredNav = navItems.filter(item => {
    if (!item.roles.includes(user?.role || 'Operador')) return false
    if (isAdmin) return true
    if (userPermissions && Array.isArray(userPermissions)) return userPermissions.includes(item.to)
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col`}>
        <div className="h-16 flex items-center gap-3 px-6 border-b border-gray-200 dark:border-gray-700">
          <Box className="w-8 h-8 text-blue-600" />
          <div><h1 className="font-bold text-sm text-gray-900 dark:text-gray-100">Mercado Cultural</h1><p className="text-xs text-gray-500 dark:text-gray-400">Controle de Estoque</p></div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {filteredNav.map(item => {
            const Icon = item.icon
            const active = pathname.startsWith(item.to)
            return (
              <Link key={item.to} href={item.to} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                <Icon className="w-5 h-5" /> {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="px-4 pb-2"><p className="text-[10px] text-gray-400 dark:text-gray-600 text-center">Billy Mesquita — iDark Soluções</p></div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-300">{user?.name?.charAt(0)?.toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700 flex items-center px-4 lg:px-6">
          <button className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <button className="ml-auto p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Alternar tema">
            {mounted && (theme === 'dark' ? <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" /> : <Moon className="w-5 h-5 text-gray-600" />)}
          </button>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
