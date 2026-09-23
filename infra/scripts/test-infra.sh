#!/usr/bin/env bash
# SAAR — Test Infrastructure Script
# Starts isolated test DB + Redis, runs migrations, then tears down after tests

set -euo pipefail

ACTION=${1:-"start"}

case "$ACTION" in
  start)
    echo "🧪 Starting test infrastructure..."
    docker compose -f infra/docker/docker-compose.test.yml up -d
    until docker exec saar_postgres_test pg_isready -U saar_test -d saar_test >/dev/null 2>&1; do sleep 1; done
    echo "✅ Test PostgreSQL ready on port 5433"
    until docker exec saar_redis_test redis-cli ping >/dev/null 2>&1; do sleep 1; done
    echo "✅ Test Redis ready on port 6380"
    DATABASE_URL="postgresql://saar_test:saar_test@localhost:5433/saar_test" pnpm db:migrate
    echo "✅ Test migrations applied"
    ;;
  stop)
    echo "🛑 Stopping test infrastructure..."
    docker compose -f infra/docker/docker-compose.test.yml down -v
    echo "✅ Test infrastructure stopped and cleaned"
    ;;
  *)
    echo "Usage: $0 [start|stop]"
    exit 1
    ;;
esac
