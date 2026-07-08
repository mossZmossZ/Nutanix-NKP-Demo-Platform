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

## Phase 1 — Auth & RBAC  ◀◀◀ NEXT
- [ ] `User` model (`user`, `passwordHash`, `role`)
- [ ] Seed static admin from `ADMIN_USER`/`ADMIN_PASSWORD` on boot
- [ ] JWT login (httpOnly cookie), `requireAuth`, `requireAdmin`
- [ ] Frontend: login page, auth context, protected routes, redirect on no JWT
- [ ] Admin → Users: list + create user
- [ ] ✅ Checkpoint: admin logs in, `user` blocked from `/admin/*`, created user logs in

## Phase 2 — Landing + Docs (MDX)
- [ ] MDX pipeline (`@mdx-js/rollup`) + shadcn typography
- [ ] Apple-style landing page (DESIGN.md tiles/accent/pills)
- [ ] Docs page rendering `/docs-content/*.mdx` + nav entry
- [ ] ✅ Checkpoint: landing follows DESIGN.md rules; MDX renders styled

## Phase 3 — Domain model + static assignment
- [ ] `Lab`, `Machine`, `Assignment` models
- [ ] Admin → Machines: create static machine
- [ ] Admin → Assignments: assign `(user, lab)` creds + variables; inline assign from machine
- [ ] User: lab list + Credentials tab
- [ ] ✅ Checkpoint: assigned user sees only their credentials

## Phase 4 — Remote desktop (Guacamole)
- [ ] `guacd` + Guacamole in prod compose; nginx `/guac`
- [ ] Backend Guacamole adapter (connection + token from assignment)
- [ ] Lab split view: MDX guide | Guacamole client; Remote|Credentials tabs
- [ ] ✅ Checkpoint: assigned user reaches RDP desktop in-browser; unassigned cannot

## Phase 5 — Dynamic provisioning (Terraform + Ansible + BullMQ)
- [ ] BullMQ queue + worker process; `Job` model
- [ ] Provisioning adapter: workdir + `execa` terraform → ansible + log streaming
- [ ] Nutanix Terraform template + Ansible playbook (NKP tooling + xrdp) in `/infra`
- [ ] Admin → Machines → Create (dynamic): job launch + SSE live logs + detail panel
- [ ] ✅ Checkpoint: dynamic create provisions VM, logs stream, status `online`

## Phase 6 — Prod hardening & ship
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
