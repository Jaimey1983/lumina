#!/usr/bin/env bash
# Lumina — Cloud Agent start (per-boot reconciliation). Idempotent and safe to
# re-run. Starts PostgreSQL + Redis (installed in the base snapshot), ensures the
# lumina role/database exist, applies Prisma migrations, and seeds demo data.
# The long-running dev servers run as `terminals` (see environment.json), not here.
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT="$(pwd)"

# --- PostgreSQL 16 ------------------------------------------------------------
echo "==> ensuring PostgreSQL is running"
if ! pg_isready -q 2>/dev/null; then
  sudo pg_ctlcluster 16 main start 2>/dev/null || true
  for i in $(seq 1 30); do
    pg_isready -q 2>/dev/null && break
    sleep 1
  done
fi
pg_isready 2>&1 || { echo "PostgreSQL failed to start"; exit 1; }

# --- Redis --------------------------------------------------------------------
echo "==> ensuring Redis is running"
if ! redis-cli ping >/dev/null 2>&1; then
  sudo redis-server --daemonize yes --dir /var/lib/redis 2>/dev/null \
    || redis-server --daemonize yes 2>/dev/null || true
  for i in $(seq 1 15); do
    redis-cli ping >/dev/null 2>&1 && break
    sleep 1
  done
fi
redis-cli ping >/dev/null 2>&1 && echo "Redis: PONG" || echo "WARN: Redis not responding (used only for live sessions)"

# --- lumina role + database ---------------------------------------------------
echo "==> ensuring lumina role and database"
sudo -u postgres psql -v ON_ERROR_STOP=1 <<'SQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'lumina') THEN
    CREATE ROLE lumina LOGIN PASSWORD 'lumina1234';
  END IF;
END$$;
ALTER ROLE lumina CREATEDB;
SQL
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='lumina'" | grep -q 1 \
  || sudo -u postgres createdb -O lumina lumina

# --- migrations + seed (idempotent) -------------------------------------------
cd "$ROOT/lumina-backend"
echo "==> prisma migrate deploy"
npx prisma migrate deploy
echo "==> seeding demo users + data (idempotent)"
npx ts-node --project tsconfig.json prisma/seed-test-user.ts || true
npx ts-node --project tsconfig.json prisma/seed-superadmin.ts || true
npx ts-node --project tsconfig.json prisma/seed-demo-data.ts || true

echo "==> start reconciliation complete"
