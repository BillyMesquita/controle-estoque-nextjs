# Controle de Estoque — Mercado Cultural

Sistema de gestão de estoque, eventos, notas fiscais e financeiro.
3 perfis de acesso: Administrador, Financeiro e Operador.

**Deploy:** [controle-estoque-nextjs.vercel.app](https://controle-estoque-nextjs.vercel.app)

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router) |
| ORM | Prisma 6 + driverAdapters |
| Banco | SQLite (dev) / Turso (prod) / PostgreSQL |
| Front | Tailwind CSS, lucide-react, next-themes |
| Auth | JWT (httpOnly cookie, SameSite=Strict, 24h) |
| Hash | bcrypt (async, cost 12) |
| Deploy | Vercel |

## Funcionalidades

- **Produtos** — cadastro com SKU automático, preço de custo e venda, estoque
- **Movimentações** — entrada/saída/avaria/consumo, weighted-average cost, validação de saldo
- **Notas Fiscais** — fiscais e avulsas, número sequencial (NF-1...), vencimento, status de pagamento
- **Fornecedores** — cadastro manual (notas armazenam nome como texto — desacoplado)
- **Eventos** — abas por status (Ativo/Planejado/Finalizado/Cancelado), custos adicionais
- **Custos de Evento** — Diaristas, Banda, Segurança, Gelo, Embalagem, Func. Mensal
- **Financeiro** — Valor Bruto, CPV, Custos Adicionais, Valor Líquido, distribuição proporcional mensal, filtro por evento/período, relatório exportável
- **Usuários** — 3 perfis com permissões granulares por menu
- **Auditoria** — log de todas as operações CRUD com filtros
- **Interface** — dark mode, sidebar responsiva (overlay em mobile), paginação, busca

## Perfis de Acesso

| Perfil | Acesso |
|---|---|
| **Administrador** | Tudo (usuários, auditoria, setup, estoque, notas, eventos, financeiro, fornecedores) |
| **Financeiro** | Notas, eventos, financeiro, movimentações, fornecedores. Sem acesso a estoque, auditoria, usuários |
| **Operador** | Registrar movimentações, próprias notas, visualizar eventos. Sem acesso a estoque, custos, financeiro |

## Segurança

- JWT armazenado em **cookie httpOnly** (inacessível via JS)
- **SameSite=Strict** + **Secure** (anti-CSRF)
- **bcrypt async cost 12** — resistente a brute force
- **Rate limit** — 5 tentativas/min no login (em memória)
- **Sanitização** — `stripHtml()` em todos os campos textuais (anti-XSS)
- **Validação** de entrada em todas as rotas POST/PUT/PATCH
- **Auth guard** — verifica se usuário está ativo a cada requisição
- **Role guard** — cada rota verifica perfil mínimo necessário
- **Try/catch** universal — sem vazamento de stack trace
- **Auditoria** em operações críticas
- **Refresh token** — endpoint `/api/auth/refresh`

## Scripts

```bash
npm run dev              # next dev
npm run build            # use-schema.js + next build
npm run start            # next start
npm run postinstall      # use-schema.js + prisma generate (automático)
npm run lint             # next lint
npm run type-check       # tsc --noEmit
npm run db:push          # prisma db push
npm run db:seed          # tsx prisma/seed.ts
npm run db:studio        # prisma studio
npm run db:setup         # tsx scripts/setup-db.ts (SQLite local)
npm run db:setup-turso   # tsx scripts/setup-turso.ts (Turso)
npm run db:reset         # limpa dados operacionais (mantém categorias)
```

## Schema Switching

O Prisma schema é selecionado automaticamente baseado na `DATABASE_URL`:

| URL prefix | Schema usado |
|---|---|
| `file:` | `schema.sqlite.prisma` |
| `libsql://` | `schema.turso.prisma` |
| `postgresql://` | `postgres` |

O script `scripts/use-schema.js` copia o schema correto para `prisma/schema.prisma`
e roda automaticamente no `postinstall` e no `build`.

## Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | Sim | URL do banco (SQLite/Turso/PostgreSQL) |
| `DATABASE_AUTH_TOKEN` | Turso | Token de autenticação do Turso |
| `JWT_SECRET` | Sim | Chave secreta para assinar JWTs |
| `DEFAULT_ADMIN_PASS` | Não | Senha do admin no seed (default: `REMOVIDO`) |
| `DEFAULT_OPER_PASS` | Não | Senha do operador no seed (default: `REMOVIDO`) |

> Sem `JWT_SECRET` o sistema **não inicializa** — erro lançado em `lib/auth-utils.ts`.

## Desenvolvimento Local

```bash
cp .env.example .env
npm install
npm run db:setup       # cria SQLite + seed (admin / operador)
npm run dev            # http://localhost:3000
```

**Credencial padrão (dev):** `adminbilly` / `REMOVIDO`

## Deploy (Vercel + Turso)

1. Crie um banco Turso: `turso db create controle-estoque`
2. Obtenha a URL: `turso db show controle-estoque --url`
3. Gere o token: `turso db tokens create controle-estoque`
4. Configure no Vercel:
   - `DATABASE_URL` = libsql://...turso.io
   - `DATABASE_AUTH_TOKEN` = token gerado
   - `JWT_SECRET` = string aleatória segura
5. Deploy + `POST /api/setup` com token de admin

## API

Autenticação via cookie `token` (httpOnly, enviado automaticamente).

### Auth

| Método | Rota | Acesso |
|---|---|---|
| POST | `/api/auth/login` | Público (rate limited) |
| POST | `/api/auth/refresh` | Autenticado |
| POST | `/api/auth/logout` | Público |
| GET | `/api/auth/me` | Autenticado |

### Produtos

| Método | Rota | Acesso |
|---|---|---|
| GET | `/api/products` | Autenticado |
| POST | `/api/products` | Autenticado |
| GET | `/api/products/:id` | Autenticado |
| PUT | `/api/products/:id` | Autenticado |
| DELETE | `/api/products/:id` | Admin |
| GET | `/api/products/report` | Autenticado |

### Notas Fiscais

| Método | Rota | Acesso |
|---|---|---|
| GET | `/api/invoices` | Autenticado (Operador vê só próprias) |
| POST | `/api/invoices` | Autenticado |
| GET | `/api/invoices/:id` | Autenticado (Operador vê só próprias) |
| DELETE | `/api/invoices/:id` | Admin/Financeiro |
| PATCH | `/api/invoices/:id/payment-status` | Admin/Financeiro |

### Eventos

| Método | Rota | Acesso |
|---|---|---|
| GET | `/api/events` | Autenticado |
| POST | `/api/events` | Admin/Financeiro |
| GET | `/api/events/:id` | Autenticado |
| PUT | `/api/events/:id` | Admin/Financeiro |
| DELETE | `/api/events/:id` | Admin/Financeiro |
| GET | `/api/events/:id/costs` | Autenticado |
| PUT | `/api/events/:id/costs` | Admin |

### Financeiro

| Método | Rota | Acesso |
|---|---|---|
| GET | `/api/financial/dashboard` | Admin/Financeiro |
| GET | `/api/financial/report` | Autenticado |

### Fornecedores

| Método | Rota | Acesso |
|---|---|---|
| GET | `/api/suppliers` | Autenticado |
| POST | `/api/suppliers` | Autenticado |
| GET | `/api/suppliers/:id` | Autenticado |
| PUT | `/api/suppliers/:id` | Admin/Financeiro |
| DELETE | `/api/suppliers/:id` | Admin |

### Categorias

| Método | Rota | Acesso |
|---|---|---|
| GET | `/api/categories` | Autenticado |
| POST | `/api/categories` | Autenticado |
| DELETE | `/api/categories/:id` | Admin/Financeiro |

### Movimentações

| Método | Rota | Acesso |
|---|---|---|
| GET | `/api/stock-movements` | Autenticado |
| POST | `/api/stock-movements` | Autenticado |

### Usuários

| Método | Rota | Acesso |
|---|---|---|
| GET | `/api/users` | Admin |
| POST | `/api/users` | Admin |
| GET | `/api/users/:id` | Admin |
| PUT | `/api/users/:id` | Admin |
| DELETE | `/api/users/:id` | Admin |

### Auditoria & Manutenção

| Método | Rota | Acesso |
|---|---|---|
| GET | `/api/audit-logs` | Admin |
| POST | `/api/setup` | Admin |
| POST | `/api/fix-invoice-fk` | Admin |
| GET | `/api/debug` | Admin |

## Notas Técnicas

- **Número da nota:** auto-gerado sequencialmente (`NF-{COUNT+1}`) — campo removido do formulário
- **Fornecedor em notas:** salvo como `supplierName` (texto), sem FK para tabela de fornecedores
- **users_old:** notas/movimentações/auditoria com FK para `users_old` (tabela de renomeação do Turso). Novos usuários sincronizados via `INSERT OR IGNORE`
- **Responsividade:** sidebar colapsável, grids adaptáveis (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3/4`), touch targets mínimos de 44px, overflow-x-auto em tabelas
- **Race conditions:** useEffect com padrão `isMounted`/`ignore` em todos os componentes

## Créditos

Billy Mesquita & Bruno Gonçalves — iDark Soluções de Tecnologia
