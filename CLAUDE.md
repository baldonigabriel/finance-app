# Finance App — CLAUDE.md

> Guia de desenvolvimento para o Claude Code. Leia este arquivo inteiro antes de qualquer tarefa.

---

## Visão Geral do Projeto

App financeiro pessoal com dashboard web e bot de WhatsApp integrado. O usuário registra receitas e despesas tanto pela interface web quanto enviando mensagens em linguagem natural via WhatsApp, que são interpretadas por IA e lançadas automaticamente.

**Status:** Em desenvolvimento — MVP em construção  
**Nome:** A definir

---

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | NestJS + Prisma + PostgreSQL |
| Frontend | Next.js 14 (App Router) + Tailwind CSS + Recharts |
| Autenticação | JWT (access token + refresh token) |
| WhatsApp | Evolution API (self-hosted, webhook) |
| IA do Bot | Claude API (Anthropic) — interpreta mensagens em linguagem natural |
| Package Manager | pnpm |
| Deploy | Railway (backend + PostgreSQL) + Vercel (frontend Next.js) |

---

## Estrutura do Monorepo

```
finance-app/
├── apps/
│   ├── api/               # NestJS backend
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   ├── users/
│   │   │   │   ├── transactions/
│   │   │   │   ├── categories/
│   │   │   │   ├── goals/
│   │   │   │   └── whatsapp/
│   │   │   ├── common/
│   │   │   │   ├── decorators/
│   │   │   │   ├── filters/
│   │   │   │   ├── guards/
│   │   │   │   └── interceptors/
│   │   │   ├── config/
│   │   │   └── prisma/
│   │   ├── test/
│   │   └── prisma/
│   │       └── schema.prisma
│   └── web/               # Next.js frontend (App Router)
│       ├── app/
│       │   ├── (auth)/        # Rotas de autenticação (login, register)
│       │   ├── (dashboard)/   # Rotas protegidas (dashboard, transações, metas)
│       │   ├── layout.tsx     # Layout raiz
│       │   └── page.tsx       # Página inicial (redirect)
│       ├── components/
│       │   ├── ui/            # Componentes base (Button, Input, Card...)
│       │   └── shared/        # Componentes reutilizáveis de negócio
│       ├── hooks/
│       ├── services/          # Chamadas à API NestJS
│       ├── store/             # Estado global (Zustand)
│       ├── lib/               # Utilitários, configuração do React Query
│       └── public/
├── packages/
│   └── shared/            # Tipos TypeScript compartilhados (DTOs, enums)
├── .claude/
│   └── skills/            # Skills instaladas
├── docker-compose.yml     # PostgreSQL local
├── pnpm-workspace.yaml
└── CLAUDE.md              # Este arquivo
```

---

## Funcionalidades do MVP

### 1. Autenticação
- Registro e login com email + senha
- JWT com refresh token
- Vincular número de WhatsApp ao usuário (campo no perfil)

### 2. Transações
- CRUD completo de receitas e despesas
- Campos: `tipo` (receita/despesa), `valor`, `categoria`, `descrição`, `data`
- Filtros por período, categoria e tipo
- Registro via dashboard web E via bot WhatsApp

### 3. Dashboard com Gráficos
- Saldo atual do mês (receitas − despesas)
- Gráfico de pizza: distribuição de gastos por categoria
- Gráfico de barras/linha: evolução mensal (últimos 6 meses)
- Cards de resumo: total receitas, total despesas, saldo, maior gasto

### 4. Categorias Personalizadas
- CRUD de categorias com nome e ícone
- Categorias padrão pré-criadas no seed: Alimentação, Transporte, Saúde, Lazer, Moradia, Educação, Outros
- Cada categoria pertence ao usuário (multi-tenant)

### 5. Metas Financeiras
- Criar meta com nome, valor alvo, prazo e categoria opcional
- Acompanhar progresso (valor atual vs meta)
- Status: em andamento / concluída / expirada

### 6. Bot WhatsApp
- Receber mensagem do usuário via webhook da Evolution API
- Interpretar com Claude API: extrair tipo, valor, categoria e descrição
- Registrar transação automaticamente
- Responder confirmando o lançamento
- Comandos especiais: `saldo`, `resumo`, `ajuda`

---

## Padrões de Código — Backend (NestJS)

### Estrutura de um módulo

Sempre que criar um módulo NestJS, seguir esta ordem:

1. `nome.module.ts`
2. `dto/create-nome.dto.ts`
3. `dto/update-nome.dto.ts`
4. `dto/nome-response.dto.ts`
5. `nome.service.ts`
6. `nome.controller.ts`
7. `nome.service.spec.ts`

### DTOs

```typescript
// Sempre usar class-validator + class-transformer
import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTransactionDto {
  @ApiProperty({ example: 'despesa' })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({ example: 150.00 })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: 'uuid-da-categoria' })
  @IsString()
  categoryId: string;

  @ApiProperty({ example: 'Almoço no restaurante', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
```

### Response DTOs

Sempre usar response DTOs para nunca expor campos sensíveis:

```typescript
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class TransactionResponseDto {
  @Expose() id: string;
  @Expose() type: TransactionType;
  @Expose() amount: number;
  @Expose() description: string;
  @Expose() date: Date;
  @Expose() category: CategoryResponseDto;
}
```

### Services

- Injetar `PrismaService` via construtor
- Lançar `NotFoundException` quando recurso não encontrado
- Lançar `ForbiddenException` quando recurso não pertence ao usuário autenticado
- Sempre verificar `userId` ao buscar/alterar recursos (multi-tenant)

### Controllers

```typescript
@ApiTags('transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  // Sempre usar @CurrentUser() para pegar o userId do JWT
}
```

### Testes Unitários

- Arquivo: `nome.service.spec.ts` junto ao service
- Mockar sempre o `PrismaService`
- Cobrir: caminho feliz, not found, forbidden (recurso de outro usuário)

```typescript
describe('TransactionsService', () => {
  let service: TransactionsService;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(async () => {
    // setup com mockDeep do jest-mock-extended
  });
});
```

---

## Padrões de Código — Frontend (Next.js)

### Roteamento (App Router)

- Usar App Router do Next.js 14 — nunca Pages Router
- Rotas protegidas dentro do grupo `(dashboard)/`
- Rotas públicas dentro do grupo `(auth)/`
- Layouts compartilhados via `layout.tsx` em cada grupo
- Nunca usar `useRouter` do `next/router` — usar `next/navigation`

### Componentes

- Componentes funcionais com TypeScript
- Props sempre tipadas com `interface`
- Componentes de UI base em `components/ui/`
- Componentes de negócio em `components/shared/`
- Componentes que usam hooks ou estado: adicionar `'use client'` no topo
- Componentes puramente visuais e sem estado: Server Components (sem diretiva)

### Chamadas à API

- Usar `@tanstack/react-query` para fetch, cache e estados de loading/error em Client Components
- Arquivo de serviço em `services/` para cada módulo (ex: `transactions.service.ts`)
- Nunca fazer fetch direto dentro de componentes
- Base URL da API NestJS via variável de ambiente `NEXT_PUBLIC_API_URL`

### Estado Global

- Zustand para estado global (usuário autenticado, preferências)
- React Query para estado de servidor (dados da API)

### Design

- Seguir as skills `frontend-design` e `ui-ux-pro-max` instaladas em `.claude/skills/`
- App financeiro: transmitir confiança, clareza e precisão
- Paleta sóbria com acento vibrante (definida pela ui-ux-pro-max)
- Gráficos com Recharts — sempre responsivos
- Ícones: Lucide React exclusivamente (nunca emojis como ícones)
- `cursor-pointer` em todos os elementos clicáveis
- Hover states com transição suave (150–300ms)
- Responsivo: 375px, 768px, 1024px, 1440px

---

## Fluxo do Bot WhatsApp

```
Usuário → WhatsApp: "gastei 47 reais no uber"
  ↓
Evolution API → POST /whatsapp/webhook
  ↓
WhatsAppService chama Claude API com a mensagem
  ↓
Claude retorna JSON:
{
  "type": "expense",
  "amount": 47,
  "category": "Transporte",
  "description": "Uber"
}
  ↓
TransactionsService.create() salva no banco
  ↓
Bot responde: "✅ Despesa de R$ 47,00 em Transporte registrada!"
```

### Prompt do bot (Claude API)

O prompt enviado à Claude API deve seguir este padrão:

```
Você é um assistente financeiro. Analise a mensagem do usuário e extraia as informações da transação.

Categorias disponíveis: {lista de categorias do usuário}

Mensagem: "{mensagem do usuário}"

Responda APENAS com JSON válido, sem markdown:
{
  "type": "income" | "expense",
  "amount": número,
  "category": "nome exato da categoria",
  "description": "descrição curta"
}

Se não for possível identificar uma transação financeira, responda:
{ "error": "Não entendi. Tente: 'gastei 50 no mercado' ou 'recebi 3000 de salário'" }
```

---

## Banco de Dados — Convenções Prisma

- Nomes de models em PascalCase singular: `Transaction`, `Category`, `Goal`
- Nomes de campos em camelCase
- Sempre incluir `createdAt` e `updatedAt` em todos os models
- Soft delete com campo `deletedAt DateTime?` onde necessário
- Após qualquer alteração no schema: `pnpm prisma migrate dev --name descricao-da-mudanca`
- Nunca usar `prisma db push` em produção

---

## Variáveis de Ambiente

```env
# API
DATABASE_URL=
JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
ANTHROPIC_API_KEY=
EVOLUTION_API_URL=
EVOLUTION_API_KEY=

# Web
NEXT_PUBLIC_API_URL=
```

---

## Git e Commits

- Branch principal: `main`
- Branches de feature: `feat/nome-da-feature`
- Commits em português seguindo Conventional Commits:
  - `feat: adiciona módulo de transações`
  - `fix: corrige cálculo de saldo mensal`
  - `test: adiciona testes do TransactionsService`
  - `chore: atualiza dependências`
- Nunca commitar `.env` — usar `.env.example`

---

## Comandos Frequentes

```bash
# Desenvolvimento
pnpm dev                          # Roda api + web simultaneamente
pnpm --filter api dev             # Só o backend (NestJS na porta 3001)
pnpm --filter web dev             # Só o frontend (Next.js na porta 3000)

# Banco de dados
pnpm prisma migrate dev           # Cria e aplica migration
pnpm prisma studio                # Abre o Prisma Studio
pnpm prisma db seed               # Roda o seed

# Testes
pnpm --filter api test            # Testes unitários
pnpm --filter api test:e2e        # Testes e2e
pnpm --filter api test:cov        # Coverage

# Build
pnpm build                        # Build de tudo
```

---

## Skills Instaladas

| Skill | Localização | Quando usar |
|---|---|---|
| `ui-ux-pro-max` | `.claude/skills/ui-ux-pro-max/` | Ao iniciar qualquer página ou componente — gera o design system |
| `frontend-design` | `.claude/skills/frontend-design.md` | Ao implementar UI — garante qualidade visual e evita estética genérica |

---

## O que NÃO fazer

- Nunca expor senha ou campos sensíveis em response DTOs
- Nunca fazer query sem filtrar por `userId` (vazamento de dados entre usuários)
- Nunca usar `any` no TypeScript — tipar sempre
- Nunca commitar `node_modules`, `.env`, ou arquivos de build
- Nunca usar `prisma db push` fora do ambiente local
- Nunca instalar dependências com `npm` ou `yarn` — usar apenas `pnpm`
- Nunca usar emojis como ícones no frontend — usar Lucide React
- Nunca usar Pages Router no Next.js — usar apenas App Router
- Nunca importar de `next/router` — usar `next/navigation`
- Nunca adicionar `'use client'` desnecessariamente — preferir Server Components quando não há estado ou hooks
