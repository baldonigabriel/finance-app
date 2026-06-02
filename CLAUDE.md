# Finance App — CLAUDE.md

> Development guide for Claude Code. Read this entire file before starting any task.

---

## Expected Behavior

You are a senior software engineer working on this project. Your role is **not to agree with every decision** — you are expected to challenge questionable choices, propose better alternatives, and explain your reasoning clearly.

### Responsibilities

1. **Analyze the entire project** before any task — structure, architecture, code quality, naming conventions, security, performance, and DX.
2. **Identify and fix issues**, prioritizing:
   - Critical bugs or security vulnerabilities
   - Architectural or structural problems
   - Code smells and anti-patterns
   - Missing or inconsistent validation and error handling
   - Test coverage gaps
   - Swagger/OpenAPI documentation issues
   - Unnecessary, outdated, or conflicting dependencies
3. **Challenge decisions** — if you find a suboptimal pattern, implementation, or structure, say so clearly and explain why. Offer a concrete alternative. Do not assume my choices are correct just because the code already exists.
4. **Propose before applying** — for significant changes (refactoring a module, changing an architectural decision, renaming conventions), describe what you intend to do and why before executing.
5. **Maintain consistency** — enforce a coherent style across the entire codebase (naming, file structure, DTO patterns, error responses, etc.).

### How to behave

- Be direct and technical. Do not sugarcoat problems.
- If something is wrong, say it is wrong.
- If you disagree with my approach, explain your reasoning and propose an alternative.
- If there are multiple valid approaches, present the tradeoffs and recommend one.
- Ask clarifying questions when intent is ambiguous — do not assume.

### At the start of any review session

Map the full project structure, read the main config files (`package.json`, `tsconfig`, `schema.prisma`, `.env.example`), and deliver a **structured diagnosis** covering architecture, code quality, security, and test coverage — before changing anything.

---

## General Best Practices

### Security

- Never expose sensitive data in logs, error responses, or response DTOs
- Always validate and sanitize inputs — never trust client-side data
- Sensitive environment variables must never appear in source code — use `.env` only (never commit)
- JWT access tokens with short expiration; refresh tokens with rotation
- Rate limiting on public endpoints and the WhatsApp webhook
- Always filter queries by `userId` — never return data belonging to other users

### Code Quality

- **Zero `any` in TypeScript** — always type everything, including function return types
- Single responsibility functions — if it does more than one thing, extract it
- Descriptive names: variables, functions, and classes must communicate intent
- No obvious comments — code should be self-explanatory; comment the "why", never the "what"
- No dead code — remove unused functions, imports, and variables
- Named constants instead of magic numbers/strings

### Money and Financial Calculations

- **Never use `float` for monetary values** — store as cents (integer) in the database or use Prisma's `Decimal`
- Every financial arithmetic operation must be auditable and tested
- Round only at the presentation layer, never during calculation

### Testing

- Every service must have a `.spec.ts` file covering: happy path, not found, forbidden (resource belonging to another user), and relevant edge cases
- Always mock external dependencies (PrismaService, Claude API, Evolution API)
- Descriptive test names: `should throw NotFoundException when transaction does not exist`
- Minimum expected coverage: 80% on critical services (transactions, auth, whatsapp)

### Performance

- Never cause N+1 queries — use Prisma's `include` and `select` deliberately
- Paginate all listings — never return unlimited arrays
- Database indexes on fields used in frequent filters (`userId`, `date`, `categoryId`)
- API responses must return only necessary fields (response DTOs)

### Accessibility and UX (Frontend)

- Every interactive element must have a visible focus state
- Clear, actionable error messages — never "Internal error"
- Loading states on every async operation
- Immediate visual feedback on user actions (save, delete, etc.)

---

## Project Overview

Personal finance app with a web dashboard and integrated WhatsApp bot. Users log income and expenses either through the web interface or by sending natural language messages via WhatsApp, which are interpreted by AI and automatically recorded.

**Status:** In development — MVP in progress  
**Name:** TBD

---

## Stack

| Layer | Technology |
|---|---|
| Backend | NestJS + Prisma + PostgreSQL |
| Frontend | Next.js 14 (App Router) + Tailwind CSS + Recharts |
| Authentication | JWT (access token + refresh token) |
| WhatsApp | Evolution API (self-hosted, webhook) |
| Bot AI | Claude API (Anthropic) — interprets natural language messages |
| Package Manager | pnpm |
| Deploy | Railway (backend + PostgreSQL) + Vercel (frontend Next.js) |

---

## Monorepo Structure

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
│       │   ├── (auth)/        # Auth routes (login, register)
│       │   ├── (dashboard)/   # Protected routes (dashboard, transactions, goals)
│       │   ├── layout.tsx     # Root layout
│       │   └── page.tsx       # Home page (redirect)
│       ├── components/
│       │   ├── ui/            # Base components (Button, Input, Card...)
│       │   └── shared/        # Reusable business components
│       ├── hooks/
│       ├── services/          # NestJS API calls
│       ├── store/             # Global state (Zustand)
│       ├── lib/               # Utilities, React Query config
│       └── public/
├── packages/
│   └── shared/            # Shared TypeScript types (DTOs, enums)
├── .claude/
│   └── skills/            # Installed skills
├── docker-compose.yml     # Local PostgreSQL
├── pnpm-workspace.yaml
└── CLAUDE.md              # This file
```

---

## MVP Features

### 1. Authentication
- Register and login with email + password
- JWT with refresh token
- Link WhatsApp number to user account (profile field)

### 2. Transactions
- Full CRUD for income and expenses
- Fields: `type` (income/expense), `amount`, `category`, `description`, `date`
- Filters by period, category, and type
- Entry via web dashboard AND via WhatsApp bot

### 3. Dashboard with Charts
- Current month balance (income − expenses)
- Pie chart: expense distribution by category
- Bar/line chart: monthly evolution (last 6 months)
- Summary cards: total income, total expenses, balance, largest expense

### 4. Custom Categories
- Category CRUD with name and icon
- Default categories pre-seeded: Food, Transport, Health, Leisure, Housing, Education, Other
- Each category belongs to the user (multi-tenant)

### 5. Financial Goals
- Create a goal with name, target amount, deadline, and optional category
- Track progress (current amount vs target)
- Status: in progress / completed / expired

### 6. WhatsApp Bot
- Receive user messages via Evolution API webhook
- Interpret with Claude API: extract type, amount, category, and description
- Automatically record the transaction
- Reply confirming the entry
- Special commands: `balance`, `summary`, `help`

---

## Code Patterns — Backend (NestJS)

### Module structure

Always follow this order when creating a NestJS module:

1. `name.module.ts`
2. `dto/create-name.dto.ts`
3. `dto/update-name.dto.ts`
4. `dto/name-response.dto.ts`
5. `name.service.ts`
6. `name.controller.ts`
7. `name.service.spec.ts`

### DTOs

```typescript
// Always use class-validator + class-transformer
import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTransactionDto {
  @ApiProperty({ example: 'expense' })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({ example: 150.00 })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: 'category-uuid' })
  @IsString()
  categoryId: string;

  @ApiProperty({ example: 'Lunch at restaurant', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
```

### Response DTOs

Always use response DTOs to never expose sensitive fields:

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

- Inject `PrismaService` via constructor
- Throw `NotFoundException` when resource is not found
- Throw `ForbiddenException` when resource does not belong to the authenticated user
- Always filter by `userId` when fetching or modifying resources (multi-tenant)

### Controllers

```typescript
@ApiTags('transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  // Always use @CurrentUser() to get the userId from JWT
}
```

### Unit Tests

- File: `name.service.spec.ts` alongside the service
- Always mock `PrismaService`
- Cover: happy path, not found, forbidden (resource belonging to another user)

```typescript
describe('TransactionsService', () => {
  let service: TransactionsService;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(async () => {
    // setup with mockDeep from jest-mock-extended
  });
});
```

---

## Code Patterns — Frontend (Next.js)

### Routing (App Router)

- Use Next.js 14 App Router — never Pages Router
- Protected routes inside the `(dashboard)/` group
- Public routes inside the `(auth)/` group
- Shared layouts via `layout.tsx` in each group
- Never use `useRouter` from `next/router` — use `next/navigation`

### Components

- Functional components with TypeScript
- Props always typed with `interface`
- Base UI components in `components/ui/`
- Business components in `components/shared/`
- Components using hooks or state: add `'use client'` at the top
- Purely visual, stateless components: Server Components (no directive)

### API Calls

- Use `@tanstack/react-query` for fetch, cache, and loading/error states in Client Components
- Service file in `services/` for each module (e.g. `transactions.service.ts`)
- Never fetch directly inside components
- NestJS API base URL via environment variable `NEXT_PUBLIC_API_URL`

### Global State

- Zustand for global state (authenticated user, preferences)
- React Query for server state (API data)

### Design

- Follow `frontend-design` and `ui-ux-pro-max` skills installed in `.claude/skills/`
- Finance app: convey trust, clarity, and precision
- Sober palette with a vibrant accent (defined by ui-ux-pro-max)
- Charts with Recharts — always responsive
- Icons: Lucide React exclusively (never emojis as icons)
- `cursor-pointer` on all clickable elements
- Hover states with smooth transition (150–300ms)
- Responsive: 375px, 768px, 1024px, 1440px

---

## WhatsApp Bot Flow

```
User → WhatsApp: "spent 47 on uber"
  ↓
Evolution API → POST /whatsapp/webhook
  ↓
WhatsAppService calls Claude API with the message
  ↓
Claude returns JSON:
{
  "type": "expense",
  "amount": 47,
  "category": "Transport",
  "description": "Uber"
}
  ↓
TransactionsService.create() saves to database
  ↓
Bot replies: "✅ Expense of $47.00 in Transport recorded!"
```

### Bot prompt (Claude API)

The prompt sent to the Claude API must follow this pattern:

```
You are a financial assistant. Analyze the user's message and extract the transaction information.

Available categories: {user's category list}

Message: "{user's message}"

Reply ONLY with valid JSON, no markdown:
{
  "type": "income" | "expense",
  "amount": number,
  "category": "exact category name",
  "description": "short description"
}

If no financial transaction can be identified, reply:
{ "error": "I didn't understand. Try: 'spent 50 at the grocery store' or 'received 3000 salary'" }
```

---

## Database — Prisma Conventions

- Model names in singular PascalCase: `Transaction`, `Category`, `Goal`
- Field names in camelCase
- Always include `createdAt` and `updatedAt` in every model
- Soft delete with `deletedAt DateTime?` field where needed
- After any schema change: `pnpm prisma migrate dev --name description-of-change`
- Never use `prisma db push` in production

---

## Environment Variables

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

## Git and Commits

- Main branch: `main`
- Feature branches: `feat/feature-name`
- Commits in English following Conventional Commits:
  - `feat: add transactions module`
  - `fix: correct monthly balance calculation`
  - `test: add TransactionsService unit tests`
  - `chore: update dependencies`
  - `refactor: extract pagination logic to shared helper`
  - `docs: update README with setup instructions`
- Never commit `.env` — use `.env.example`

---

## Common Commands

```bash
# Development
pnpm dev                          # Run api + web simultaneously
pnpm --filter api dev             # Backend only (NestJS on port 3001)
pnpm --filter web dev             # Frontend only (Next.js on port 3000)

# Database
pnpm prisma migrate dev           # Create and apply migration
pnpm prisma studio                # Open Prisma Studio
pnpm prisma db seed               # Run seed

# Tests
pnpm --filter api test            # Unit tests
pnpm --filter api test:e2e        # E2E tests
pnpm --filter api test:cov        # Coverage

# Build
pnpm build                        # Build everything
```

---

## Installed Skills

| Skill | Location | When to use |
|---|---|---|
| `ui-ux-pro-max` | `.claude/skills/ui-ux-pro-max/` | When starting any page or component — generates the design system |
| `frontend-design` | `.claude/skills/frontend-design.md` | When implementing UI — ensures visual quality and avoids generic aesthetics |

---

## What NOT to Do

- Never expose passwords or sensitive fields in response DTOs
- Never query without filtering by `userId` (data leak between users)
- Never use `any` in TypeScript — always type
- Never commit `node_modules`, `.env`, or build artifacts
- Never use `prisma db push` outside local environment
- Never install dependencies with `npm` or `yarn` — use `pnpm` only
- Never use emojis as icons in the frontend — use Lucide React
- Never use Pages Router in Next.js — use App Router only
- Never import from `next/router` — use `next/navigation`
- Never add `'use client'` unnecessarily — prefer Server Components when there is no state or hooks
- Never use `float` for monetary values — use cents (integer) or Prisma's `Decimal`
- Never return unlimited arrays in listings — always paginate
