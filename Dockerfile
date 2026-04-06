FROM node:20-slim AS base

RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
COPY prisma/ ./prisma/
COPY prisma.config.ts ./
RUN pnpm install --frozen-lockfile --prod=false

# Generate Prisma client
RUN npx prisma generate

# Build
FROM deps AS build
COPY . .
RUN pnpm run build

# Production
FROM base AS production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./
COPY --from=build /app/package.json ./

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
