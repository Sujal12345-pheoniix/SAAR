#!/usr/bin/env bash
# SAAR — Local Development Setup Script
# Run this once after cloning. Requires: Node 24, pnpm 12, Docker

set -euo pipefail

echo "🚀 SAAR Setup Starting..."

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js not found. Install Node 24."; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "❌ pnpm not found. Run: npm i -g pnpm"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker not found. Install Docker Desktop."; exit 1; }

NODE_VER=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VER" -lt 24 ]; then
  echo "❌ Node 24+ required. Current: $(node --version)"
  exit 1
fi

# Copy env file
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✅ Created .env from .env.example — please fill in secrets before running"
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Start Docker services
echo "🐳 Starting PostgreSQL and Redis..."
docker compose -f infra/docker/docker-compose.yml up -d

# Wait for PostgreSQL
echo "⏳ Waiting for PostgreSQL..."
until docker exec saar_postgres_dev pg_isready -U saar_user -d saar_dev >/dev/null 2>&1; do
  sleep 1
done
echo "✅ PostgreSQL ready"

# Wait for Redis
echo "⏳ Waiting for Redis..."
until docker exec saar_redis_dev redis-cli ping >/dev/null 2>&1; do
  sleep 1
done
echo "✅ Redis ready"

# Run migrations
echo "🗄️  Running database migrations..."
pnpm db:migrate

# Run seed
echo "🌱 Seeding database..."
pnpm db:seed

echo ""
echo "✅ SAAR setup complete!"
echo ""
echo "Start the API:    pnpm --filter @saar/api dev"
echo "Start the web:    pnpm --filter @saar/web dev"
echo "Start mobile:     pnpm --filter @saar/mobile start"
echo "Run all dev:      pnpm dev"
echo ""
echo "Health check:     curl http://localhost:3001/health"
echo "Readiness check:  curl http://localhost:3001/ready"
echo "API docs:         http://localhost:3001/api/v1/meta"
