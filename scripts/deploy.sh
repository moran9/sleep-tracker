#!/usr/bin/env bash
set -euo pipefail

DOCKER_USER="moran9"

if [ -f .env ]; then
  DOCKER_TOKEN=$(grep -E '^DOCKER_TOKEN=' .env | cut -d '=' -f2-)
fi

if [ -z "${DOCKER_TOKEN:-}" ]; then
  echo "Error: DOCKER_TOKEN not set. Add it to .env"
  exit 1
fi

echo "$DOCKER_TOKEN" | docker login -u "$DOCKER_USER" --password-stdin

docker build -t "$DOCKER_USER/sleep-tracker-server:latest" ./server
docker build -t "$DOCKER_USER/sleep-tracker-client:latest" ./client

docker push "$DOCKER_USER/sleep-tracker-server:latest"
docker push "$DOCKER_USER/sleep-tracker-client:latest"

echo "Done. Images pushed to Docker Hub."
