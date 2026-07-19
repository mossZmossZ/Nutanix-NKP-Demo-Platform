#!/usr/bin/env bash
#
# Deploy / update the production stack on this host.
#
# Usage:
#   ./deploy.sh                 # pull + run :latest
#   ./deploy.sh 3ab9f12         # roll to a specific <git-sha> build (rollback/pin)
#   ./deploy.sh dev --no-pull   # run locally-built :dev images (skip registry pull)
#
# The images are public on Docker Hub, so pulling needs no login. Copy
# .env.prod.example to .env and fill it before the first run.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env"

# ── Parse args: an optional image tag and an optional --no-pull flag ──────────
TAG="latest"
PULL=1
for arg in "$@"; do
  case "$arg" in
    --no-pull) PULL=0 ;;
    -*)        echo "unknown flag: $arg" >&2; exit 2 ;;
    *)         TAG="$arg" ;;
  esac
done
export IMAGE_TAG="$TAG"   # shell env wins over .env, so this is the effective tag

compose() { docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"; }

# ── Preflight ────────────────────────────────────────────────────────────────
command -v docker >/dev/null 2>&1 || { echo "error: docker not found" >&2; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "error: docker compose v2 required" >&2; exit 1; }
[ -f "$ENV_FILE" ] || {
  echo "error: missing $SCRIPT_DIR/$ENV_FILE" >&2
  echo "       cp .env.prod.example .env  and fill in the secrets first." >&2
  exit 1
}

# Validate interpolation + YAML + required secrets BEFORE touching anything.
compose config -q

# ── Bind-mount dirs, owned by the uids the containers run as ─────────────────
# mongo runs as uid 999, the backend `node` user as uid 1000. chown needs root;
# if it can't, warn instead of failing (Docker Desktop is permissive anyway).
mkdir -p ./data/mongo ./data/wiki
chown -R 999:999   ./data/mongo 2>/dev/null || echo "warn: could not chown data/mongo — rerun with sudo if mongo can't write"
chown -R 1000:1000 ./data/wiki  2>/dev/null || echo "warn: could not chown data/wiki  — rerun with sudo if lab authoring can't write"

echo "==> Deploying image tag: $IMAGE_TAG"

# ── Pull (public images; no login needed) ────────────────────────────────────
if [ "$PULL" -eq 1 ]; then
  compose pull
fi

# ── Bring the stack up ───────────────────────────────────────────────────────
compose up -d --remove-orphans

# ── Reclaim space from superseded (now-dangling) images ─────────────────────
docker image prune -f >/dev/null 2>&1 || true

echo "==> Stack status:"
compose ps
echo "==> Done. Follow logs with:  docker compose -f $SCRIPT_DIR/$COMPOSE_FILE logs -f"
