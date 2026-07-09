# Tasks

Living checklist. Mirrors the phases in `PLAN.md`. Check items off as they land; keep this in
sync with reality (it's the "current state" file).

## Phase 0 — Scaffold & dev loop
- [x] Monorepo dirs: `/frontend /backend /deploy` (`/infra`, `/docs-content` land in Phases 2/5)
- [x] Frontend: Vite + React 19 + TS + **Tailwind v4** + shadcn init
- [x] Map `DESIGN.md` tokens → Tailwind theme (via v4 CSS-first `@theme` in `src/index.css`)
- [x] Backend: Express + TS + Mongoose + `/api/health`
- [x] `deploy/docker-compose.dev.yml` (mongo + redis)
- [x] `.env.example` (root, comprehensive) + `backend/.env.example` (backend subset)
- [x] ✅ Checkpoint: frontend/backend typecheck+build green, compose validates, health route wired

## Phase 1 — Auth & RBAC
- [x] `User` model (`username`, `passwordHash`, `role`) — bcryptjs hashing
- [x] Seed static admin from `ADMIN_USER`/`ADMIN_PASSWORD` on boot (upsert every boot — env is source of truth)
- [x] JWT login (httpOnly cookie, 7-day, SameSite=Lax), `requireAuth`, `requireAdmin`; `/api/auth/{login,logout,me}`
- [x] Frontend: login page, auth context (`/me` on load), protected + admin routes, redirect on no JWT (Vite dev proxy → single-origin cookie)
- [x] Admin → Users: full CRUD (list/create/edit role+password/delete) with self-delete + last-admin guards
- [x] ✅ Checkpoint: admin logs in, `user` blocked from `/admin/*` (403), created user logs in — verified end-to-end through the Vite proxy
- [x] Backend test suite: vitest + supertest + mongodb-memory-server (`npm test`), 60 tests — smoke, auth/JWT tampering, RBAC, NoSQL-injection, CRUD guards

## Phase 2 — Landing + Docs (MDX)
- [x] MDX pipeline (`@mdx-js/rollup`) + shadcn typography
- [x] Apple-style landing page (DESIGN.md tiles/accent/pills)
- [x] Docs page rendering `/docs-content/*.mdx` + nav entry
- [x] ✅ Checkpoint: landing follows DESIGN.md rules; MDX renders styled

## Phase 3 — Web design: portals + SaaS-grade redesign  ◀◀◀ NEXT
- [x] Role-based landing stubs: `LabAccessPage`, `AdminPortalPage`, profile dropdown nav
      (replaces old single `HomePage`) — uncommitted, needs a baseline commit
- [ ] Landing page: stronger hero + tile storytelling ("powerful home page" pass)
- [ ] Lab Access Portal: SaaS dashboard shell (app nav/sidebar) + "My Labs" placeholder
      card list + Credentials tab placeholder
- [ ] Admin Portal: SaaS dashboard shell (sidebar: Users/Machines/Assignments) + summary
      tiles; Users section wired live to real API, Machines/Assignments as placeholders
- [ ] Mock/placeholder data isolated in one fixtures location (easy to remove in Phase 4)
- [ ] ✅ Checkpoint: all three surfaces follow `DESIGN.md`, read as one cohesive SaaS
      product; Admin → Users still fully functional against the real API

## Phase 4 — Domain model + static assignment
- [ ] `Lab`, `Machine`, `Assignment` models
- [ ] Admin → Machines: create static machine
- [ ] Admin → Assignments: assign `(user, lab)` creds + variables; inline assign from machine
- [ ] User: lab list + Credentials tab (replaces Phase 3 placeholder cards with real data)
- [ ] ✅ Checkpoint: assigned user sees only their credentials

## Phase 5 — Remote desktop (Guacamole)
- [ ] `guacd` + Guacamole in prod compose; nginx `/guac`
- [ ] Backend Guacamole adapter (connection + token from assignment)
- [ ] Lab split view: MDX guide | Guacamole client; Remote|Credentials tabs
- [ ] ✅ Checkpoint: assigned user reaches RDP desktop in-browser; unassigned cannot

## Phase 6 — Dynamic provisioning (Terraform + Ansible + BullMQ)
- [ ] BullMQ queue + worker process; `Job` model
- [ ] Provisioning adapter: workdir + `execa` terraform → ansible + log streaming
- [ ] Nutanix Terraform template + Ansible playbook (NKP tooling + xrdp) in `/infra`
- [ ] Admin → Machines → Create (dynamic): job launch + SSE live logs + detail panel
- [ ] ✅ Checkpoint: dynamic create provisions VM, logs stream, status `online`

## Phase 7 — Prod hardening & ship
- [ ] `deploy/docker-compose.prod.yml` (nginx + fe + be + worker + mongo + redis + guac)
- [ ] nginx TLS + routing
- [ ] Secret handling per `SECURITY.md`
- [ ] Admin dashboard counts
- [ ] ✅ Checkpoint: full flow end-to-end over HTTPS on a clean host

## Backlog / later (explicit non-goals for v1)
- [ ] Lab task auto-grading / verification
- [ ] Public self-signup or workshop access codes
- [ ] Auto-wire Terraform output → user credential
- [ ] In-app MDX lab authoring editor
- [ ] Remote Terraform state backend
