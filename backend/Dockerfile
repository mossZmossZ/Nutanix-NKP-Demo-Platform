# syntax=docker/dockerfile:1
#
# Multi-stage build for the API. Final image ships only the compiled `dist` + the
# production node_modules on a slim, non-root runtime — no toolchain, no dev deps,
# no source. glibc (bookworm-slim) is used deliberately over alpine/musl so ssh2's
# optional native bits and any transitive addon resolve without surprises.

# 1) Production-only dependencies — this layer becomes the runtime node_modules.
FROM node:22-bookworm-slim AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# 2) Build — full deps (incl. TypeScript) compile src -> dist.
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# 3) Runtime — slim, non-root, prod deps + compiled output only.
FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./

# Drop root. The app only reads from /app; it writes lab content to the mounted
# WIKI_DIR (see compose), whose host dir must be writable by uid 1000 (`node`).
USER node

EXPOSE 4000

# Self-contained liveness probe (Node 22 has global fetch — no curl/wget needed).
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/server.js"]
