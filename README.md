# Controle de Estoque — Mercado Cultural

Sistema de gestão de estoque, eventos, notas fiscais e financeiro.

## Tecnologias

- **Next.js 15** (App Router)
- **Prisma ORM** + Turso (SQLite serverless)
- **Tailwind CSS**
- **next-themes** (dark mode)
- **JWT** (autenticação com expiração 12h)
- **bcrypt** (senhas com hash + salt)
- **Turso** (banco de dados serverless)
- **Vercel** (deploy)

## Funcionalidades

- **Produtos** — cadastro com SKU automático, controle de estoque
- **Movimentações** — entrada/saída com validação de estoque disponível
- **Notas Fiscais** — fiscais e avulsas com vencimento e status (Pendente, Pago, Atrasado, Cancelado)
- **Fornecedores** — cadastro manual ou automático via nota
- **Eventos** — organização com abas por status (Ativo, Planejado, Finalizado, Cancelado)
- **Custos de Evento** — custos adicionais (Diaristas, Banda, Segurança, etc.)
- **Financeiro** — dashboard com Valor Bruto, CPV, Custos Adicionais, Valor Líquido, memória de cálculo detalhada, filtro por evento/período, relatório exportável
- **Usuários** — gestão com permissões granulares por menu
- **Auditoria** — log de todas as ações
- **Dark mode** — tema claro/escuro
- **Responsivo** — adaptável para mobile

## Segurança

- Rate limit de 5 tentativas por minuto no login
- Validação de entrada em todas as rotas
- JWT com expiração de 12 horas
- Verificação de usuário ativo em cada requisição
- Senhas armazenadas com bcrypt
- Auditoria em operações CRUD
- Setup protegido (requer admin autenticado)

## Scripts

```bash
npm run dev        # desenvolvimento
npm run build      # produção
npm run lint       # verificação de lint
npm run type-check # verificação de tipos
```

## Deploy

Projetado para deploy na Vercel com Turso como banco de dados.

### Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | URL de conexão do Turso |
| `DATABASE_AUTH_TOKEN` | Token de autenticação do Turso |
| `JWT_SECRET` | Chave secreta para JWT |
| `DEFAULT_ADMIN_PASS` | Senha inicial do admin (opcional) |
| `DEFAULT_OPER_PASS` | Senha inicial do operador (opcional) |

### Setup inicial

Após o deploy, faça uma requisição `POST /api/setup` com token de admin para criar as tabelas e usuários iniciais.

## Créditos

Billy Mesquita — iDark Soluções de Tecnologia
