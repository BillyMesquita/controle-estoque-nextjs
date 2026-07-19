# Controle de Estoque

Sistema de controle de estoque, notas fiscais e financeiro.

## Tecnologias

- Next.js 14 (App Router)
- Prisma ORM + Turso (SQLite serverless)
- Tailwind CSS
- next-themes (dark mode)
- autenticação JWT

## Funcionalidades

- **Produtos**: cadastro com SKU automático, controle de estoque
- **Movimentações**: entrada/saída de produtos
- **Notas Fiscais**: registro de notas fiscais e avulsas
- **Fornecedores**: cadastro com criação automática via nota
- **Eventos**: organização por eventos
- **Financeiro**: dashboard com receitas/despesas
- **Usuários**: gestão com permissões granulares por menu
- **Auditoria**: log de todas as ações
- **Dark mode**: alternância entre tema claro/escuro

## Credenciais padrão

| Usuário  | Senha      | Perfil         |
|----------|-----------|----------------|
| admin    | DEV_REMOVED  | Administrador  |
| operador | DEV_REMOVED | Operador     |

## Configuração

```bash
npm install
cp .env.example .env.local  # configurar DATABASE_URL e DATABASE_AUTH_TOKEN
npx prisma generate
npm run dev
```
