import type { Metadata } from 'next'
import { ThemeProvider } from 'next-themes'
import { ErrorBoundary } from '@/components/error-boundary'
import './globals.css'

export const metadata: Metadata = {
  title: 'Controle de Estoque - Mercado Cultural',
  description: 'Sistema de gestão de estoque e notas fiscais/avulsas',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem><ErrorBoundary>{children}</ErrorBoundary></ThemeProvider>
      </body>
    </html>
  )
}
