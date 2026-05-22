FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm" PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY packages/backend/package.json packages/backend/package.json
COPY packages/backend/prisma ./packages/backend/prisma
RUN pnpm install --frozen-lockfile
WORKDIR /app/packages/backend && npx prisma generate && cd /app

FROM deps AS builder
COPY . .
RUN pnpm --filter @prompt-lab/shared build \
  && pnpm --filter @prompt-lab/backend build \
  && pnpm --filter @prompt-lab/backend deploy --prod /prod/backend

FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
ENV NODE_ENV=production PORT=4000
COPY --from=builder /prod/backend ./
EXPOSE 4000
CMD ["node", "dist/index.js"]
