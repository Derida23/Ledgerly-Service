# Ledgerly Service

Personal expense tracker API built with NestJS, Prisma, Better Auth, and PostgreSQL.

## Stack

| Layer    | Tech                          | Platform   |
| -------- | ----------------------------- | ---------- |
| Backend  | NestJS + Better Auth + Prisma | Render     |
| Database | PostgreSQL                    | Neon       |
| Auth     | Better Auth + Google OAuth    | Cookie-based |

## Getting Started

### Prerequisites

- Node.js >= 20
- pnpm >= 9
- PostgreSQL (or Neon account)

### Setup

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env
# Edit .env with your values

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database (optional, requires existing users)
npx prisma db seed

# Start development server
pnpm run start:dev
```

### Environment Variables

| Variable | Description |
| -------- | ----------- |
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `DIRECT_URL` | Direct database URL (bypasses pooler) |
| `BETTER_AUTH_SECRET` | Auth secret key (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | Backend URL (`http://localhost:3000`) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `FRONTEND_URL` | Frontend URL for CORS (`http://localhost:5173`) |
| `PORT` | Server port (default: 3000) |
| `ADMIN_EMAIL` | Admin user email (full CRUD access) |
| `VIEWER_EMAIL` | Viewer user email (read-only access) |

## API Documentation

Swagger UI available at `http://localhost:3000/docs` when server is running.

### Endpoints Overview

| Module | Endpoints | Description |
| ------ | --------- | ----------- |
| Health | `GET /` | Health check |
| Auth | `ALL /api/auth/*` | Google OAuth login/logout/session |
| Wallets | `CRUD /api/wallets` | Wallet management + balance |
| Categories | `CRUD /api/categories` | Category management + seed defaults |
| Transactions | `CRUD /api/transactions` | Income/expense + transfer |
| Recurring | `CRUD /api/recurrings` | Monthly reminders |
| Budgets | `CRUD /api/budgets` | Budget tracking + alerts |
| Reports | `GET /api/reports/*` | Dashboard, weekly, monthly, yearly |

### Auth & Roles

- **ADMIN**: Full CRUD access (POST/PUT/DELETE)
- **VIEWER**: Read-only access (GET only)
- Only whitelisted emails can login via Google OAuth

## Scripts

```bash
pnpm run start:dev    # Development with watch mode
pnpm run start        # Production
pnpm run build        # Build
pnpm run test         # Unit tests
pnpm run test:e2e     # E2E tests
pnpm run lint         # Lint
npx prisma studio     # Database GUI
npx prisma db seed    # Seed default data
```

## Project Structure

```
src/
  main.ts                 # Bootstrap (CORS, validation, Swagger)
  app.module.ts           # Root module
  lib/auth.ts             # Better Auth instance
  prisma/                 # PrismaService, PrismaModule, exception filter
  auth/                   # Auth controller, guards, decorators
  wallet/                 # Wallet CRUD + balance calculation
  category/               # Category CRUD + default seeding
  transaction/            # Transaction CRUD + transfer mechanism
  recurring/              # Recurring reminder CRUD
  budget/                 # Budget CRUD + spending alerts
  report/                 # Reports (dashboard, weekly, monthly, yearly)
prisma/
  schema.prisma           # Database schema (10 models)
  seed.ts                 # Default wallets + categories seeder
  migrations/             # Migration history
```
