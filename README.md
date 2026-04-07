# Ledgerly Service

Personal expense tracker API built with NestJS, Prisma, Better Auth, and PostgreSQL.

## Stack

| Layer    | Tech                          | Platform     |
| -------- | ----------------------------- | ------------ |
| Backend  | NestJS + Better Auth + Prisma | Vercel       |
| Database | PostgreSQL                    | Neon         |
| Auth     | Better Auth + Google OAuth    | Cookie-based |

## Getting Started

### Prerequisites

- Node.js >= 20
- pnpm >= 9
- Neon PostgreSQL account
- Google Cloud Console (OAuth credentials)

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

| Variable | Description | Example |
| -------- | ----------- | ------- |
| `DATABASE_URL` | Neon PostgreSQL connection string | `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require` |
| `BETTER_AUTH_SECRET` | Auth secret key (generate with `openssl rand -base64 32`) | `3tMzzRoL1x57...` |
| `BETTER_AUTH_URL` | Backend URL | `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | `GOCSPX-xxx` |
| `CORS_ORIGINS` | Allowed origins for CORS + Better Auth (comma-separated) | `http://localhost:5173,http://localhost:3000` |
| `PORT` | Server port | `3000` |
| `ADMIN_EMAIL` | Admin user email (full CRUD access) | `admin@gmail.com` |
| `VIEWER_EMAIL` | Viewer user email (read-only access) | `viewer@gmail.com` |

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 Client ID (Web application)
3. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://your-app.vercel.app/api/auth/callback/google` (production)
4. Add test users in OAuth consent screen (ADMIN_EMAIL + VIEWER_EMAIL)

## API Documentation

Swagger UI available at `/docs` when server is running.

- **Local**: http://localhost:3000/docs
- **Production**: https://ledgerly-service.vercel.app/docs

### Endpoints Overview (34 endpoints)

| Module | Endpoints | Description |
| ------ | --------- | ----------- |
| Health | `GET /` | Health check |
| Auth | `POST /api/auth/sign-in/social` | Google OAuth login |
| Auth | `GET /api/auth/get-session` | Check current session (no role) |
| Auth | `POST /api/auth/sign-out` | Logout |
| Profile | `GET /api/me` | Current user profile with role |
| Wallets | `POST GET /api/wallets` | List + create wallets |
| Wallets | `GET PATCH DELETE /api/wallets/:id` | Wallet detail + update + delete |
| Wallets | `POST /api/wallets/seed` | Seed 7 default wallets |
| Categories | `POST GET /api/categories` | List + create categories |
| Categories | `GET PATCH DELETE /api/categories/:id` | Category detail + update + delete |
| Categories | `POST /api/categories/seed` | Seed 14 default categories |
| Transactions | `POST GET /api/transactions` | List + create transactions |
| Transactions | `POST /api/transactions/transfer` | Transfer between wallets (auto 3 records) |
| Transactions | `GET PATCH DELETE /api/transactions/:id` | Transaction detail + update + delete |
| Recurring | `POST GET /api/recurrings` | List + create recurring reminders |
| Recurring | `GET /api/recurrings/due-today` | Reminders due today |
| Recurring | `GET PATCH DELETE /api/recurrings/:id` | Recurring detail + update + delete |
| Budgets | `POST GET /api/budgets` | List + create budgets |
| Budgets | `GET PATCH DELETE /api/budgets/:id` | Budget detail + update + delete |
| Reports | `GET /api/reports/dashboard` | Total balance + 12-month trend |
| Reports | `GET /api/reports/weekly` | Weekly report |
| Reports | `GET /api/reports/monthly` | Monthly report + comparison |
| Reports | `GET /api/reports/yearly` | Yearly report |

### Auth & Roles

- **ADMIN**: Full CRUD access (POST/PATCH/DELETE)
- **VIEWER**: Read-only access (GET only)
- Only whitelisted emails (ADMIN_EMAIL, VIEWER_EMAIL) can login via Google OAuth
- Authentication via httpOnly session cookie (`better-auth.session_token`)

## Testing

```bash
pnpm run test         # Unit tests (25 tests)
pnpm run test:e2e     # E2E tests (27 tests)
pnpm run lint         # ESLint
```

### Postman Collection

Import `postman/Ledgerly-API.postman_collection.json` into Postman for manual API testing with pre-configured auth flow and auto-saved variables.

## Scripts

```bash
pnpm run start:dev    # Development with watch mode
pnpm run start        # Production
pnpm run build        # Build
pnpm run test         # Unit tests
pnpm run test:e2e     # E2E tests
pnpm run lint         # Lint + fix
npx prisma studio     # Database GUI
npx prisma db seed    # Seed default data
```

## Deployment (Vercel)

The backend is deployed as a Vercel Serverless Function via `api/index.ts`.

### Vercel Environment Variables

Set these in Vercel dashboard > Settings > Environment Variables:

```
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=https://your-app.vercel.app
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
CORS_ORIGINS=https://your-frontend.vercel.app,http://localhost:5173
ADMIN_EMAIL=...
VIEWER_EMAIL=...
```

### Build Configuration

Configured in `vercel.json` — no manual setup needed.

## Project Structure

```
api/
  index.ts                # Vercel serverless entry point
src/
  main.ts                 # Local dev bootstrap (CORS, helmet, rate limit, Swagger)
  app.module.ts           # Root module
  lib/
    auth.ts               # Better Auth instance (lazy init, dynamic import)
    env.ts                # Environment helpers (requireEnv, getAllowedOrigins)
  prisma/                 # PrismaService, PrismaModule, exception filter
  auth/                   # Auth controller, guards, decorators
  wallet/                 # Wallet CRUD + balance calculation
  category/               # Category CRUD + default seeding
  transaction/            # Transaction CRUD + transfer mechanism
  recurring/              # Recurring reminder CRUD
  budget/                 # Budget CRUD + spending alerts
  report/                 # Reports (dashboard, weekly, monthly, yearly)
  test/                   # Test helpers (mock prisma)
prisma/
  schema.prisma           # Database schema (10 models, 5 enums)
  seed.ts                 # Default wallets + categories seeder
  migrations/             # Migration history
postman/
  Ledgerly-API.postman_collection.json  # Postman collection (40 requests)
```

## Security

- **Helmet** — Security headers (X-Content-Type-Options, X-Frame-Options, HSTS)
- **Rate Limiting** — Auth routes: max 20 requests per 15 minutes
- **CORS** — Whitelisted origins only, credentials required
- **Cookie** — httpOnly, Secure, SameSite=None (cross-domain)
- **Prisma** — Parameterized queries (SQL injection safe)
- **Validation** — class-validator with whitelist mode
