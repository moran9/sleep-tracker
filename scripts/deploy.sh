#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DOCKER_USER="moran9"

if [ -f "$REPO_ROOT/.env" ]; then
  DOCKER_TOKEN=$(grep -E '^DOCKER_TOKEN=' "$REPO_ROOT/.env" | cut -d '=' -f2-)
fi

if [ -z "${DOCKER_TOKEN:-}" ]; then
  echo "Error: DOCKER_TOKEN not set. Add it to .env"
  exit 1
fi

echo "$DOCKER_TOKEN" | docker login -u "$DOCKER_USER" --password-stdin

docker build -t "$DOCKER_USER/sleep-tracker-server:latest" "$REPO_ROOT/server"
docker build -t "$DOCKER_USER/sleep-tracker-client:latest" "$REPO_ROOT/client"

docker push "$DOCKER_USER/sleep-tracker-server:latest"
docker push "$DOCKER_USER/sleep-tracker-client:latest"

echo "Done. Images pushed to Docker Hub."
