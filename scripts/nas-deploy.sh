#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [ -f "$REPO_ROOT/.env" ]; then
  NAS_USER=$(grep -E '^NAS_USER=' "$REPO_ROOT/.env" | cut -d '=' -f2-)
  NAS_HOST=$(grep -E '^NAS_HOST=' "$REPO_ROOT/.env" | cut -d '=' -f2-)
fi

if [ -z "${NAS_USER:-}" ] || [ -z "${NAS_HOST:-}" ]; then
  echo "Error: NAS_USER or NAS_HOST not set. Add them to .env"
  exit 1
fi

NAS_DIR="/var/services/homes/$NAS_USER/sleep-tracker"

echo "Copying files to NAS..."
ssh "$NAS_USER@$NAS_HOST" "mkdir -p $NAS_DIR"
ssh "$NAS_USER@$NAS_HOST" "cat > $NAS_DIR/docker-compose.yml" < "$REPO_ROOT/docker-compose.yml"

echo "Pulling and restarting on NAS..."
ssh "$NAS_USER@$NAS_HOST" "cd $NAS_DIR && /usr/local/bin/docker compose pull && /usr/local/bin/docker compose up -d"

echo "Done. App is running on the NAS."
