# syntax=docker/dockerfile:1
#
# Frontend image: Vite build -> static assets served by nginx.
#
# IMPORTANT: build from the REPO ROOT context, not frontend/ —
#   docker build -f frontend/Dockerfile -t <img> .
# src/docs/registry.ts globs MDX from the sibling repo-root /docs-content
# (`import.meta.glob('../../../docs-content/*.mdx')`), so both dirs must be present
# under /app with their original relative layout or the Docs pages build empty.
#
# nginx here is the public edge. Its tuned nginx.conf + the http/https server block
# are bind-mounted at deploy time (see deploy/nginx/), so switching TLS modes never
# requires rebuilding this image.

FROM node:22-bookworm-slim AS build
WORKDIR /app/frontend
# Deps first for layer caching (node_modules is excluded from the context).
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
# App source + the sibling docs-content the MDX glob resolves to (../../../docs-content).
COPY frontend/ ./
COPY docs-content/ /app/docs-content/
RUN npm run build

FROM nginx:1.27-alpine AS runtime
# Static build output only; nginx config comes from bind mounts in compose.
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
