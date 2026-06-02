# Finance App

Aplicativo financeiro pessoal com dashboard web e bot de WhatsApp integrado. Registre receitas e despesas pela interface web ou simplesmente enviando uma mensagem em linguagem natural pelo WhatsApp — a IA interpreta e lança automaticamente.

---

## Funcionalidades

### Dashboard Web
- **Cards de resumo** — total de receitas, despesas, saldo do mês e maior gasto
- **Gráfico de pizza** — distribuição de gastos por categoria
- **Gráfico de barras** — evolução mensal dos últimos 6 meses
- **Transações recentes** — lista das últimas movimentações do mês

### Transações
- CRUD completo de receitas e despesas
- Filtros por período, categoria e tipo
- Soft delete (registros nunca são perdidos permanentemente)

### Categorias
- Categorias personalizadas por usuário
- 7 categorias padrão criadas automaticamente no cadastro: Alimentação, Transporte, Saúde, Lazer, Moradia, Educação, Outros

### Metas Financeiras
- Criação de metas com valor alvo e prazo
- Acompanhamento de progresso
- Status: em andamento, concluída ou expirada

### Bot WhatsApp
- Integração com a [Evolution API](https://github.com/EvolutionAPI/evolution-api)
- Mensagens interpretadas por IA (Claude Haiku)
- Comandos: `saldo`, `resumo`, `ajuda`
- Exemplo: _"gastei 47 reais no uber"_ → transação registrada automaticamente

---

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | NestJS + Prisma + PostgreSQL |
| Frontend | Next.js 14 (App Router) + Tailwind CSS + Recharts |
| Autenticação | JWT (access token + refresh token) |
| WhatsApp | Evolution API (webhook) |
| IA do Bot | Claude API — claude-haiku-4-5 |
| Package Manager | pnpm workspaces |
| Deploy | Railway (API + PostgreSQL) + Vercel (frontend) |

---

## Estrutura do Monorepo

```
finance-app/
├── apps/
│   ├── api/                    # NestJS backend
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/       # Registro, login, refresh token
│   │   │   │   ├── users/      # Perfil do usuário
│   │   │   │   ├── transactions/
│   │   │   │   ├── categories/
│   │   │   │   ├── goals/
│   │   │   │   └── whatsapp/   # Webhook + integração Claude API
│   │   │   ├── common/
│   │   │   │   ├── decorators/ # @CurrentUser()
│   │   │   │   ├── filters/    # PrismaExceptionFilter
│   │   │   │   └── guards/     # JwtAuthGuard
│   │   │   └── prisma/
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       └── seed.ts
│   └── web/                    # Next.js frontend
│       ├── app/
│       │   ├── (auth)/         # Login e cadastro
│       │   ├── (dashboard)/    # Páginas protegidas
│       │   └── layout.tsx
│       ├── components/
│       │   └── dashboard/      # CategoryDonut, MonthlyBar
│       ├── services/           # Chamadas à API
│       └── store/              # Zustand (auth)
└── packages/
    └── shared/                 # Tipos TypeScript compartilhados
```

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) >= 20
- [pnpm](https://pnpm.io/) >= 9 — `npm install -g pnpm`
- [Docker](https://www.docker.com/) (para o PostgreSQL local)

---

## Instalação e Setup

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/finance-app.git
cd finance-app
```

### 2. Instale as dependências

```bash
pnpm install
```

### 3. Suba o banco de dados

```bash
docker compose up -d
```

### 4. Configure as variáveis de ambiente

```bash
# API
cp .env.example apps/api/.env

# Web
cp apps/web/.env.local.example apps/web/.env.local
```

Edite `apps/api/.env` com os valores reais:

```env
DATABASE_URL=postgresql://finance:finance123@localhost:5432/finance_db

JWT_SECRET=coloque-uma-string-longa-e-aleatoria-aqui
JWT_REFRESH_SECRET=coloque-outra-string-longa-e-aleatoria-aqui
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

ANTHROPIC_API_KEY=sk-ant-...       # Necessário para o bot WhatsApp
EVOLUTION_API_URL=http://...       # URL da sua instância da Evolution API
EVOLUTION_API_KEY=...

PORT=3000
FRONTEND_URL=http://localhost:3001
```

### 5. Crie as tabelas e popule o banco

```bash
pnpm --filter @finance-app/api run prisma:migrate --name init
pnpm --filter @finance-app/api run prisma:seed
```

O seed cria um usuário de teste: `admin@financeapp.com` / `admin123`

---

## Rodando em Desenvolvimento

Abra dois terminais:

```bash
# Terminal 1 — API (http://localhost:3000)
pnpm --filter @finance-app/api run dev

# Terminal 2 — Web (http://localhost:3001)
pnpm --filter @finance-app/web run dev
```

Ou rode tudo junto:

```bash
pnpm dev
```

---

## URLs

| Serviço | URL |
|---|---|
| Frontend | http://localhost:3001 |
| API | http://localhost:3000 |
| Swagger (documentação da API) | http://localhost:3000/api/docs |
| Prisma Studio | `pnpm --filter @finance-app/api run prisma:studio` |

---

## Comandos úteis

```bash
# Desenvolvimento
pnpm dev                                              # Roda api + web
pnpm --filter @finance-app/api run dev               # Só o backend
pnpm --filter @finance-app/web run dev               # Só o frontend

# Banco de dados
pnpm --filter @finance-app/api run prisma:migrate    # Nova migration
pnpm --filter @finance-app/api run prisma:seed       # Seed
pnpm --filter @finance-app/api run prisma:studio     # Prisma Studio

# Testes
pnpm --filter @finance-app/api run test              # Testes unitários
pnpm --filter @finance-app/api run test:cov          # Coverage

# Build
pnpm build
```

---

## API — Endpoints principais

Todos os endpoints (exceto `/auth`) exigem o header:
```
Authorization: Bearer <access_token>
```

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/auth/register` | Cadastro |
| `POST` | `/auth/login` | Login |
| `POST` | `/auth/refresh` | Renovar token |
| `GET` | `/users/me` | Perfil do usuário |
| `PATCH` | `/users/me` | Atualizar perfil |
| `GET` | `/transactions` | Listar transações (filtros: `type`, `categoryId`, `startDate`, `endDate`) |
| `POST` | `/transactions` | Criar transação |
| `GET` | `/transactions/summary` | Resumo financeiro do período |
| `PATCH` | `/transactions/:id` | Atualizar transação |
| `DELETE` | `/transactions/:id` | Remover transação (soft delete) |
| `GET` | `/categories` | Listar categorias |
| `POST` | `/categories` | Criar categoria |
| `GET` | `/goals` | Listar metas |
| `POST` | `/goals` | Criar meta |
| `POST` | `/whatsapp/webhook` | Webhook da Evolution API |

Documentação completa e interativa em **http://localhost:3000/api/docs**

---

## Bot WhatsApp

### Configuração

1. Tenha uma instância da [Evolution API](https://github.com/EvolutionAPI/evolution-api) rodando
2. Configure o webhook para apontar para `https://sua-api.com/whatsapp/webhook`
3. O usuário deve vincular o número de WhatsApp no perfil (`PATCH /users/me` com `whatsappNumber`)

### Comandos disponíveis

| Mensagem | Resposta |
|---|---|
| `"gastei 50 no mercado"` | Registra despesa de R$ 50,00 em Alimentação |
| `"recebi 3000 de salário"` | Registra receita de R$ 3.000,00 |
| `saldo` ou `resumo` | Resumo financeiro do mês atual |
| `ajuda` | Lista de comandos disponíveis |

---

## Banco de Dados

### Modelos

```
User
 ├── categories[]     (one-to-many, unique por [name, userId])
 ├── transactions[]   (one-to-many, soft delete via deletedAt)
 └── goals[]          (one-to-many)

Transaction
 ├── type: income | expense
 ├── amount: Decimal(10,2)
 └── category → Category

Goal
 ├── status: in_progress | completed | expired
 └── category? → Category (opcional)
```

---

## Design System

O design system foi gerado com a skill `ui-ux-pro-max` e está documentado em `design-system/finance-app/MASTER.md`.

| Token | Valor |
|---|---|
| Fonte | IBM Plex Sans |
| Sidebar | `#0C0C0C` |
| Background | `#F8F7F4` |
| Accent | `#2563EB` |
| Receita | `#16A34A` (emerald) |
| Despesa | `#DC2626` (rose) |

---

## Deploy

### API — Railway

1. Crie um projeto no [Railway](https://railway.app/)
2. Adicione um banco PostgreSQL
3. Conecte o repositório e aponte o root para `apps/api`
4. Configure as variáveis de ambiente (igual ao `.env.example`)
5. Railway detecta NestJS automaticamente

### Frontend — Vercel

1. Importe o repositório no [Vercel](https://vercel.com/)
2. Configure o **Root Directory** para `apps/web`
3. Adicione a variável de ambiente:
   ```
   NEXT_PUBLIC_API_URL=https://sua-api.railway.app
   ```

---

## Ferramentas de Desenvolvimento com IA

O projeto utiliza o [Claude Code](https://claude.ai/code) com as seguintes skills instaladas em `.claude/skills/`:

| Skill | Finalidade |
|---|---|
| `ui-ux-pro-max` | Geração do design system — paleta de cores, tipografia, estilos de componentes e recomendações de gráficos. Output salvo em `design-system/finance-app/` |
| `frontend-design` | Diretrizes de qualidade visual — evitar estética genérica de IA, escolhas tipográficas distintivas, composição espacial e micro-interações |

### Como reinstalar as skills

As skills não estão versionadas no repositório (são ferramentas locais de desenvolvimento). Para reinstalá-las em uma nova máquina, consulte a documentação do Claude Code ou o histórico de commits para entender as decisões de design já tomadas em `design-system/finance-app/MASTER.md`.

### Decisões de design registradas

Todas as decisões visuais estão documentadas em:

- `design-system/finance-app/MASTER.md` — fonte da verdade global (cores, tipografia, sombras, componentes)
- `design-system/finance-app/pages/dashboard.md` — overrides específicos do dashboard

---

## Licença

MIT
