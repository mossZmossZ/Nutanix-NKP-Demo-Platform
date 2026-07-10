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

## Phase 3 — Web Design & UX/UI (the whole-app design pass)  ◀◀◀ NEXT
> This is the **last** phase that designs UI. Phases 4+ are functional and have no design
> plan — they inherit the system this phase establishes. So Phase 3 owns **every existing
> surface** and locks the design system before functional work begins.
>
> **Source of truth: `design.md`** (root) — unified violet SaaS system (accent `#702DFF`,
> Inter, 8/12/pill radii, light-only on semantic tokens). Supersedes the old `DESIGN.md`.
> Per-page layout refs live in `design/`.
>
> **Workflow (human-in-the-loop):** foundation first, then one surface at a time —
> I edit a surface → maintainer reviews → iterate until approved → next surface. A final
> whole-app cohesion sign-off gates entry to Phase 4. **Do not start Phase 4 until the
> maintainer confirms.**

- [x] Design system consolidated: root `design.md` (single source of truth) + `design/` page refs
- [x] Role-based landing stubs: `LabAccessPage`, `AdminPortalPage`, profile dropdown nav
      (replaces old single `HomePage`) — uncommitted, needs a baseline commit
> **Direction (locked 2026-07-10):** ALL app surfaces are **light** (`canvas`/`surface`,
> **violet-only** — no gradient). The **homepage (`LandingPage.tsx`) is FROZEN** — it's an
> approved dark/gradient marketing exception, used only as a *quality* reference; do not edit
> it or the shared shell in a way that changes it. Cadence: foundation → one surface at a time,
> maintainer review between each.

- [x] **Foundation pass** — tokens→`@theme` + motion tokens + `prefers-reduced-motion` were
      already done in `index.css`. **Added 2026-07-10:** `Skeleton`, `Card`, `Input`, `Badge`
      primitives (token-themed, `design.md §4/§7`); route-level `React.lazy` + `Suspense` in
      `App.tsx` with branded fallbacks (`PageFallback` + shell-shaped `AppFallback`). typecheck
      + lint + build green, per-route chunk splitting confirmed. _Awaiting review._
- [x] **Login** — redesigned to `design.md` (light, violet-only): centered `<Card>` +
      `<Input>` primitives + violet brand lockup. Committed `0183785`.
- [x] **Home (landing)** — FROZEN/approved; reference only, do not touch (skipped by direction)
- [ ] **Lab Access Portal** (user) — dashboard = hero + "Available labs" card grid (mock,
      status Badge, "Open lab" CTA) + empty-state fallback. NB: the Remote/Credentials tabs
      live on the in-lab page (docs + RDP), which is Phase 5 — **not** this dashboard.
      · _awaiting review_
- [ ] **Admin Portal** — dashboard shell (sidebar: Users/Machines/Assignments) + summary
      tiles; Users wired to the real API, Machines/Assignments placeholders · _review → approve_  ◀◀◀ NEXT
- [ ] **Docs + global shell** — MDX typography + nav/profile dropdown refined to the shell · _review → approve_
- [ ] Mock/placeholder data isolated in one fixtures location (easy to remove in Phase 4)
- [ ] ✅ **Cohesion sign-off** — all surfaces follow `design.md`, read as one cohesive SaaS
      product; Admin → Users still fully functional against the real API. **Maintainer confirms
      before Phase 4.**

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
