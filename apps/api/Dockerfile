# Multi-stage production Dockerfile for @saar/api
FROM node:24-alpine AS builder

WORKDIR /app

# Install pnpm and build essentials for native addons (argon2)
RUN apk add --no-cache python3 make g++ libc6-compat
RUN corepack enable && corepack prepare pnpm@12.3.4 --activate

# Copy workspace and lock files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/api ./apps/api
COPY prisma ./prisma

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma Client
RUN pnpm --filter @saar/api exec prisma generate --schema=./prisma/schema.prisma

# Build contracts and api
RUN pnpm --filter @saar/contracts build
RUN pnpm --filter @saar/api build

# Prune dev dependencies for production
RUN pnpm prune --prod

# Production runtime stage
FROM node:24-alpine AS runner

WORKDIR /app

# Install dumb-init for proper signal handling and curl for healthchecks
RUN apk add --no-cache dumb-init curl

ENV NODE_ENV=production
ENV API_PORT=3001

# Run as non-root user
USER node

# Copy built artifacts and dependencies
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/packages ./packages
COPY --chown=node:node --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --chown=node:node --from=builder /app/apps/api/dist ./apps/api/dist
COPY --chown=node:node --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --chown=node:node --from=builder /app/prisma ./prisma

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3001/api/v1/health || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "apps/api/dist/main"]
