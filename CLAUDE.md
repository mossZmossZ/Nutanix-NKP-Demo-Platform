# CLAUDE.md

Operating manual for Claude when working in this repo. Read this first every session.

## What this is

**Nutanix NKP Workshop Platform** — a browser-based hands-on lab platform for Nutanix
Kubernetes Platform (NKP), modelled on **killer.sh / KodeKloud / Linux Foundation exams**.

Two sides:

- **User side** — log in, read a lab guide (left pane), work on a live in-browser **RDP
  desktop** to a provisioned Linux machine (right pane), flip a top tab between
  **Remote** and **Credentials**.
- **Admin side** — a "cloud-manage" console: create machines (manually, or dynamically via
  **Terraform + Ansible**), watch provisioning logs live, manage users (RBAC), and assign
  each user their RDP credentials.

The admin is intentionally the **human in the loop**: provisioning a machine and assigning
it to a user are two separate steps bridged by the admin. Don't auto-wire them.

## Stack (do not change without asking)

| Layer     | Choice |
|-----------|--------|
| Frontend  | React + Vite + TypeScript + Tailwind CSS + **shadcn/ui** |
| Backend   | Node.js + **Express** + TypeScript (lightweight, layered — **no MVC framework**) |
| Database  | MongoDB (Mongoose) |
| Jobs      | **BullMQ + Redis** (provisioning queue, live log streaming) |
| Remote    | **Apache Guacamole** (`guacd` + client) — clientless HTML5 RDP in the browser |
| Infra     | Terraform + Ansible (Nutanix provider), invoked via `execa` from a worker |
| Docs/Labs | **MDX in-app** (`@mdx-js/rollup` + shadcn typography) — **not** Docusaurus |
| Auth      | JWT (httpOnly cookie), **username + password** (not email) |
| Deploy    | Docker Compose (dev: mongo + redis · prod: nginx + fe + be + mongo + redis + guac) |

## Repo layout

```
/frontend      Vite + React + TS + Tailwind + shadcn
/backend       Express + TS, Mongoose, BullMQ worker, Guacamole + provisioning adapters
/infra         terraform/ + ansible/ templates (Nutanix)
/docs-content  .mdx lab guides + doc pages
/deploy        docker-compose.dev.yml, docker-compose.prod.yml, nginx/
design.md      design-system source of truth (violet SaaS) — see "Design" below
design/        per-page layout references (homepage/login/admin/users) — refs only, tokens live in design.md
ARCHITECTURE.md, PLAN.md, TASKS.md, SECURITY.md
```

## Conventions & guardrails

- **Invoke the `/andrej-karpathy-skills:karpathy-guidelines` skill** before writing,
  reviewing, or refactoring code, and follow it: minimum code that solves the task, surgical
  changes, surface assumptions/tradeoffs, define verifiable success criteria. Don't add
  speculative abstraction/config/error-handling.
- **Design is a spec, not a suggestion.** All UI follows `design.md`: violet `#702DFF`
  is the *only* accent (status colors are functional-only), **Inter** type ladder
  (400/500/600/700), radius 8px default / 12px panels / pill for chips+avatars+hero CTAs, one
  product-shadow style only, light-only on semantic tokens. Map tokens into the Tailwind theme;
  theme shadcn components from those tokens. Never inline hex. Files in `design/` are layout
  references only — their token values are superseded by `design.md`.
- **Never run Terraform/Ansible inside an HTTP request.** Provisioning is always a BullMQ
  job; the API enqueues and returns a `jobId`; the worker streams logs.
- **Secrets never touch the repo or client logs.** RDP passwords, JWT secret, Nutanix creds
  live in env / a secret store. See `SECURITY.md`.
- **RBAC on every `/admin/*` route** (API and UI). `role` is a JWT claim; `user` role cannot
  reach admin surfaces.
- **TypeScript strict.** Share DTO types between frontend and backend where practical.

## Commands

> The apps don't exist yet — Phase 0 (`PLAN.md`) scaffolds them. Fill in exact scripts as
> they're created; keep this table current.

| Task | Command |
|------|---------|
| Dev infra (mongo + redis) | `docker compose -f deploy/docker-compose.dev.yml up -d` |
| Frontend dev | `cd frontend && npm run dev` |
| Backend dev | `cd backend && npm run dev` |
| Backend worker | `cd backend && npm run worker` |
| Lint / typecheck | `npm run lint` / `npm run typecheck` (per package) |
| Prod stack | `docker compose -f deploy/docker-compose.prod.yml up -d` |

## Where to look

- **How it fits together / data model / flows** → `ARCHITECTURE.md`
- **What to build and in what order** → `PLAN.md`
- **Concrete checklist / current state** → `TASKS.md`
- **Handling secrets, RDP creds, provisioning safety** → `SECURITY.md`
- **Any UI decision** → `design.md`

## Working style (this maintainer)

- Prefers being **grilled** before building — surface tradeoffs, give a recommendation, then
  proceed. Prefers **lightweight** solutions over heavy frameworks. Keep dev setup minimal.
