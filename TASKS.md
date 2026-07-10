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

## Phase 3 — Web Design & UX/UI (the whole-app design pass) ✅ COMPLETE
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
- [x] **Lab Access Portal** (user) — precise-minimal dashboard = hero + "Available labs" card
      grid (mock, mono metadata row, status Badge, "Open lab" CTA) + empty-state fallback.
      Committed `7e3eb68`. NB: the Remote/Credentials tabs live on the **in-lab page**
      (docs + RDP), which is **Phase 5** (needs Guacamole) — **not** this dashboard.
- [x] **Admin Portal** — full 5-surface console **design template** (Dashboard, Users,
      Machines, Lab Credentials, Settings). **Users page is wired to the real API**; the other
      four are **mock/placeholder** awaiting Phase 4 logic. Committed `52cec4c` + local polish.
- [x] **Docs + global shell** — shell + nav/profile dropdown in place across surfaces.
- [x] Mock/placeholder data lives inline per admin page (swapped for real data in Phase 4).
- [x] ✅ **Cohesion sign-off** — maintainer accepts the admin UI as the **final design template**.
> **Admin template is frozen (2026-07-10):** treat the admin surfaces as a finished design
> template — Phase 4 **binds logic / real data** into them, it does **not** restyle them. Any
> *redesign* must be done by a dedicated **Opus agent** and validated as warranted first. NB:
> the admin pages currently use functional status colors + a few gradients/hex that deviate
> from `design.md`'s violet-only rule — **accepted as-is** for the template; revisit only via
> the Opus-agent redesign path. **New** Phase 4 surfaces follow `design.md`.

## Phase 4 — Labs, Assignments & the participant experience (user-first)  ◀◀◀ NEXT
> **Direction (2026-07-10):** perfect the *participant* experience before automating infra —
> the admin can provision machines by hand, but the participant experience is what scales.
> Admin provisions machines **manually** and pastes RDP creds; there is **no `Machine` model
> yet** (deferred to Phase 6) — creds are typed straight into an `Assignment` (`ARCHITECTURE.md`
> allows "typed by admin"). **Each participant gets their own desktop** (killer.sh-style
> isolation). Real data replaces the admin mock — **except Users, already real**.

**4a — Backend domain (real data)**
- [ ] `Lab` model — `slug, title, summary, difficulty, duration, order`; guide content is
      **file-backed** under `wiki/<slug>/NN-*.md` (+ `wiki/<slug>/images/`), **not** in the DB
- [ ] `Assignment` model — `userId, labId, rdpHost, rdpPort, rdpUser, rdpPassword` (encrypted
      at rest per `SECURITY.md`), `completedPages: string[]` (per-user progress)
- [ ] Admin API — Lab CRUD (create scaffolds `wiki/<slug>/01-intro.md`; edit reads/writes page
      files); Assignment CRUD (assign user→lab + RDP creds; revoke)
- [ ] User API — `GET /api/me/labs`, `GET /api/me/labs/:slug` (pages + my progress),
      `POST …/progress` (mark page complete)

**4b — Admin: bind the design template to real data** (no restyle; Opus-agent for any redesign)
- [ ] Lab management surface — CRUD labs (new surface follows `design.md` via frontend-design)
- [ ] Lab Credentials page — swap mock array → real Assignments; **Lab field auto-links to real
      Labs** (dropdown from the Lab list); assign form persists RDP creds
- [ ] (Users page already real — leave as-is)

**4c — User: My Labs + killer.sh-style lab view**
- [ ] `LabAccessPage` (My Labs) wired to real assignments (replace mock array)
- [ ] In-lab page (net-new): split view — **guide left / desktop right**; top tabs
      **Remote | Credentials**
- [ ] Guide reader: file-backed **multi-page** (`wiki/<slug>/NN-*.md`), section rail,
      **next/back**, scroll, **mark-as-complete per page** (persisted per-user on the Assignment),
      `react-markdown`, **code + YAML** highlight, **copy** buttons, **image** support
- [ ] Credentials tab — the user's own RDP host/user/password with copy
- [ ] ✅ Checkpoint: assigned user sees only their labs + creds; guide pages render with
      progress; unassigned user sees nothing

## Phase 5 — In-browser RDP (Guacamole, lightweight & in-app)
> **Lightweight, in-app canvas** (not the Java webapp): only `guacd` + a `guacamole-lite` Node
> WS tunnel + `guacamole-common-js` rendering the raw desktop **inside the Remote tab** — no
> Guacamole login/chrome. Token is minted server-side from the user's Assignment; the RDP
> password never reaches the client. **Needs a reachable xrdp host to verify.**
- [ ] `guacd` in **dev** compose + `guacamole-lite` tunnel wired to the backend
- [ ] Backend token endpoint — AES-encrypted connection token from the requesting user's
      Assignment (RBAC: only the assignee)
- [ ] Frontend — `guacamole-common-js` canvas mounts in the **Remote** tab of the in-lab page
- [ ] ✅ Checkpoint (real xrdp host): assigned user reaches their **own** live RDP desktop
      in-browser; unassigned cannot

## Phase 6 — Dynamic provisioning (Terraform + Ansible + BullMQ)
- [ ] `Machine` model (deferred from Phase 4) — `source: 'static'|'dynamic'` + status; admin
      can then assign creds *from a machine* instead of typing them by hand
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
