import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Controle de Estoque - Mercado Cultural',
  description: 'Sistema de gestão de estoque e notas fiscais/avulsas',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
