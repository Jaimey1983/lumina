#!/usr/bin/env bash
# Lumina — Cloud Agent install (idempotent repository bootstrap).
# Runs after the repo is checked out. System services (PostgreSQL, Redis) come
# from the environment snapshot; this script only prepares repo dependencies,
# builds the workspace packages, generates the Prisma client, and writes local
# env files if they are missing. It must terminate (no long-running processes).
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT="$(pwd)"

echo "==> pnpm install (frozen lockfile)"
pnpm install --frozen-lockfile

echo "==> build workspace packages (@lumina/*)"
pnpm -r --filter "./packages/*" build

echo "==> prisma generate"
pnpm --filter lumina-backend exec prisma generate

# --- backend .env (gitignored — created once, holds a generated secret) -------
BACKEND_ENV="$ROOT/lumina-backend/.env"
if [ ! -f "$BACKEND_ENV" ]; then
  echo "==> writing lumina-backend/.env"
  MASTER_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")"
  cat > "$BACKEND_ENV" <<EOF
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://lumina:lumina1234@localhost:5432/lumina"
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=lumina_super_secret_key_2025_cambiar_en_produccion
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3001
GEMINI_API_KEY=
AI_KEYS_MASTER_SECRET=${MASTER_SECRET}
EOF
else
  echo "==> lumina-backend/.env already present — leaving as-is"
fi

# --- frontend .env.local (gitignored) -----------------------------------------
FRONTEND_ENV="$ROOT/lumina-frontend/.env.local"
if [ ! -f "$FRONTEND_ENV" ]; then
  echo "==> writing lumina-frontend/.env.local"
  cat > "$FRONTEND_ENV" <<'EOF'
NEXT_PUBLIC_API_URL=http://localhost:3000
EOF
else
  echo "==> lumina-frontend/.env.local already present — leaving as-is"
fi

echo "==> install complete"
