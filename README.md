# Finance App

Personal finance app with a web dashboard and integrated WhatsApp bot. Log income and expenses through the web interface or simply by sending a natural language message via WhatsApp — the AI interprets it and records the transaction automatically.

---

## Features

### Web Dashboard
- **Summary cards** — total income, expenses, monthly balance, and largest expense
- **Pie chart** — expense distribution by category
- **Bar chart** — monthly evolution over the last 6 months
- **Recent transactions** — list of the latest movements for the month

### Transactions
- Full CRUD for income and expenses
- Filters by period, category, and type
- Soft delete (records are never permanently lost)

### Categories
- Custom categories per user
- 7 default categories created automatically at registration: Food, Transport, Health, Leisure, Housing, Education, Other

### Financial Goals
- Create goals with a target amount and deadline
- Progress tracking
- Status: in progress, completed, or expired

### WhatsApp Bot
- Integration with the [Evolution API](https://github.com/EvolutionAPI/evolution-api)
- Messages interpreted by AI (Claude Haiku)
- Commands: `balance`, `summary`, `help`
- Example: _"spent 47 on uber"_ → transaction recorded automatically

---

## Stack

| Layer | Technology |
|---|---|
| Backend | NestJS + Prisma + PostgreSQL |
| Frontend | Next.js 14 (App Router) + Tailwind CSS + Recharts |
| Authentication | JWT (access token + refresh token) |
| WhatsApp | Evolution API (webhook) |
| Bot AI | Claude API — claude-haiku-4-5 |
| Package Manager | pnpm workspaces |
| Deploy | Railway (API + PostgreSQL) + Vercel (frontend) |

---

## Monorepo Structure

```
finance-app/
├── apps/
│   ├── api/                    # NestJS backend
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/       # Register, login, refresh token
│   │   │   │   ├── users/      # User profile
│   │   │   │   ├── transactions/
│   │   │   │   ├── categories/
│   │   │   │   ├── goals/
│   │   │   │   └── whatsapp/   # Webhook + Claude API integration
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
│       │   ├── (auth)/         # Login and registration
│       │   ├── (dashboard)/    # Protected pages
│       │   └── layout.tsx
│       ├── components/
│       │   └── dashboard/      # CategoryDonut, MonthlyBar
│       ├── services/           # API calls
│       └── store/              # Zustand (auth)
└── packages/
    └── shared/                 # Shared TypeScript types
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- [pnpm](https://pnpm.io/) >= 9 — `npm install -g pnpm`
- [Docker](https://www.docker.com/) (for local PostgreSQL)

---

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/seu-usuario/finance-app.git
cd finance-app
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Start the database

```bash
docker compose up -d
```

### 4. Configure environment variables

```bash
# API
cp .env.example apps/api/.env

# Web
cp apps/web/.env.local.example apps/web/.env.local
```

Edit `apps/api/.env` with the real values:

```env
DATABASE_URL=postgresql://finance:finance123@localhost:5432/finance_db

JWT_SECRET=put-a-long-random-string-here
JWT_REFRESH_SECRET=put-another-long-random-string-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

ANTHROPIC_API_KEY=sk-ant-...       # Required for the WhatsApp bot
EVOLUTION_API_URL=http://...       # URL of your Evolution API instance
EVOLUTION_API_KEY=...

PORT=3000
FRONTEND_URL=http://localhost:3001
```

### 5. Create tables and seed the database

```bash
pnpm --filter @finance-app/api run prisma:migrate --name init
pnpm --filter @finance-app/api run prisma:seed
```

The seed creates a test user: `admin@financeapp.com` / `admin123`

---

## Running in Development

Open two terminals:

```bash
# Terminal 1 — API (http://localhost:3000)
pnpm --filter @finance-app/api run dev

# Terminal 2 — Web (http://localhost:3001)
pnpm --filter @finance-app/web run dev
```

Or run everything together:

```bash
pnpm dev
```

---

## URLs

| Service | URL |
|---|---|
| Frontend | http://localhost:3001 |
| API | http://localhost:3000 |
| Swagger (API documentation) | http://localhost:3000/api/docs |
| Prisma Studio | `pnpm --filter @finance-app/api run prisma:studio` |

---

## Useful Commands

```bash
# Development
pnpm dev                                              # Run api + web
pnpm --filter @finance-app/api run dev               # Backend only
pnpm --filter @finance-app/web run dev               # Frontend only

# Database
pnpm --filter @finance-app/api run prisma:migrate    # New migration
pnpm --filter @finance-app/api run prisma:seed       # Seed
pnpm --filter @finance-app/api run prisma:studio     # Prisma Studio

# Tests
pnpm --filter @finance-app/api run test              # Unit tests
pnpm --filter @finance-app/api run test:cov          # Coverage

# Build
pnpm build
```

---

## API — Main Endpoints

All endpoints (except `/auth`) require the header:
```
Authorization: Bearer <access_token>
```

| Method | Route | Description |
|---|---|---|
| `POST` | `/auth/register` | Registration |
| `POST` | `/auth/login` | Login |
| `POST` | `/auth/refresh` | Refresh token |
| `GET` | `/users/me` | User profile |
| `PATCH` | `/users/me` | Update profile |
| `GET` | `/transactions` | List transactions (filters: `type`, `categoryId`, `startDate`, `endDate`) |
| `POST` | `/transactions` | Create transaction |
| `GET` | `/transactions/summary` | Financial summary for the period |
| `PATCH` | `/transactions/:id` | Update transaction |
| `DELETE` | `/transactions/:id` | Remove transaction (soft delete) |
| `GET` | `/categories` | List categories |
| `POST` | `/categories` | Create category |
| `GET` | `/goals` | List goals |
| `POST` | `/goals` | Create goal |
| `POST` | `/whatsapp/webhook` | Evolution API webhook |

Full interactive documentation at **http://localhost:3000/api/docs**

---

## WhatsApp Bot

### Setup

1. Have an instance of the [Evolution API](https://github.com/EvolutionAPI/evolution-api) running
2. Configure the webhook to point to `https://your-api.com/whatsapp/webhook`
3. The user must link their WhatsApp number in the profile (`PATCH /users/me` with `whatsappNumber`)

### Available Commands

| Message | Response |
|---|---|
| `"spent 50 at the grocery store"` | Records an expense of $50.00 in Food |
| `"received 3000 salary"` | Records income of $3,000.00 |
| `balance` or `summary` | Financial summary for the current month |
| `help` | List of available commands |

---

## Database

### Models

```
User
 ├── categories[]     (one-to-many, unique per [name, userId])
 ├── transactions[]   (one-to-many, soft delete via deletedAt)
 └── goals[]          (one-to-many)

Transaction
 ├── type: income | expense
 ├── amount: Decimal(10,2)
 └── category → Category

Goal
 ├── status: in_progress | completed | expired
 └── category? → Category (optional)
```

---

## Design System

The design system was generated with the `ui-ux-pro-max` skill and is documented in `design-system/finance-app/MASTER.md`.

| Token | Value |
|---|---|
| Font | IBM Plex Sans |
| Sidebar | `#0C0C0C` |
| Background | `#F8F7F4` |
| Accent | `#2563EB` |
| Income | `#16A34A` (emerald) |
| Expense | `#DC2626` (rose) |

---

## Deploy

### API — Railway

1. Create a project on [Railway](https://railway.app/)
2. Add a PostgreSQL database
3. Connect the repository and set the root to `apps/api`
4. Configure the environment variables (same as `.env.example`)
5. Railway detects NestJS automatically

### Frontend — Vercel

1. Import the repository on [Vercel](https://vercel.com/)
2. Set the **Root Directory** to `apps/web`
3. Add the environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://your-api.railway.app
   ```

---

## AI Development Tools

This project uses [Claude Code](https://claude.ai/code) with the following skills installed in `.claude/skills/`:

| Skill | Purpose |
|---|---|
| `ui-ux-pro-max` | Design system generation — color palette, typography, component styles, and chart recommendations. Output saved in `design-system/finance-app/` |
| `frontend-design` | Visual quality guidelines — avoid generic AI aesthetics, distinctive typographic choices, spatial composition, and micro-interactions |

### How to reinstall the skills

Skills are not versioned in the repository (they are local development tools). To reinstall them on a new machine, refer to the Claude Code documentation or the commit history to understand the design decisions already made in `design-system/finance-app/MASTER.md`.

### Recorded design decisions

All visual decisions are documented in:

- `design-system/finance-app/MASTER.md` — global source of truth (colors, typography, shadows, components)
- `design-system/finance-app/pages/dashboard.md` — dashboard-specific overrides

---

## License

MIT
