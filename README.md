# Controle de Estoque — Mercado Cultural

Sistema de gestão de estoque, eventos, notas fiscais e financeiro desenvolvido para o Mercado Cultural.

## Tecnologias

- **Next.js 15** (App Router)
- **Prisma ORM** + Turso (SQLite serverless)
- **Tailwind CSS**
- **next-themes** (dark mode)
- **JWT** (autenticação)
- **Turso** (banco de dados serverless)
- **Vercel** (deploy)

## Funcionalidades

- **Produtos** — cadastro com SKU automático, controle de estoque por lote
- **Movimentações** — entrada/saída de produtos com tipos (Avaria, Consumo Interno sem impacto financeiro)
- **Notas Fiscais** — registro de notas fiscais e avulsas com vencimento e status de pagamento
- **Fornecedores** — cadastro manual ou criação automática via nota fiscal
- **Eventos** — organização por eventos (Ativo, Planejado, Finalizado, Cancelado) com abas de filtro
- **Custos de Evento** — cadastro de custos adicionais (Diaristas, Func. Mensal, Banda, etc.)
- **Financeiro** — dashboard consolidado com:
  - Valor Bruto, Custo (CPV), Custos Adicionais, Valor Líquido
  - Memória de cálculo detalhada
  - Filtro por evento e período (semana/mês/trimestre/semestre/ano)
  - Relatório exportável em HTML
- **Usuários** — gestão com permissões granulares por menu
- **Auditoria** — log de todas as ações com detalhes
- **Dark mode** — alternância entre tema claro/escuro
- **Responsivo** — interface adaptável para mobile

## Scripts

```bash
npm run dev        # desenvolvimento
npm run build      # produção
npm run lint       # verificação de lint
npm run type-check # verificação de tipos TypeScript
```

## Configuração

```bash
npm install
npx prisma generate
npm run dev
```

### Deploy no Vercel

Variáveis de ambiente necessárias na Vercel:

- `DATABASE_URL` — URL de conexão do Turso
- `DATABASE_AUTH_TOKEN` — token de autenticação do Turso
- `JWT_SECRET` — chave secreta para JWT

## Créditos

Billy Mesquita — iDark Soluções de Tecnologia
