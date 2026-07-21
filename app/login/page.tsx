'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Eye, EyeOff, Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => { setMounted(true) }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data))
      router.push('/dashboard')
    } catch { setError('Erro de conexão') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 relative">
      <button className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Alternar tema">
        {mounted && (theme === 'dark' ? <Sun className="w-5 h-5 text-white" /> : <Moon className="w-5 h-5 text-white" />)}
      </button>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4">
            <Box className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Mercado Cultural</h1>
          <p className="text-blue-200 mt-1">Controle de Estoque e Notas</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center">Acessar sistema</h2>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}
          <div>
            <label className="label">Usuário</label>
            <input className="input-field" placeholder="nome de usuário" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div>
            <label className="label">Senha</label>
            <div className="relative">
              <input type={showPwd ? 'text' : 'password'} className="input-field pr-10" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowPwd(!showPwd)}>
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center">{loading ? 'Entrando...' : 'Entrar'}</button>
        </form>
        <p className="text-center text-blue-200 text-xs mt-6">Desenvolvido por <strong>Billy Mesquita</strong> & <strong>Bruno Gonçalves</strong> — iDark Soluções de Tecnologia</p>
      </div>
    </div>
  )
}
