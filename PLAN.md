# Build Plan

Phased roadmap. Each phase ends at a **verifiable checkpoint** — don't move on until it's
green. Build vertically (thin end-to-end slices) rather than one whole layer at a time.
Track concrete items in `TASKS.md`.

## Phase 0 — Scaffold & dev loop
Goal: repos exist, dev infra runs, both apps boot.
- Monorepo dirs (`/frontend /backend /infra /docs-content /deploy`).
- Frontend: Vite + React + TS + Tailwind + shadcn init; map `design.md` tokens into the
  Tailwind theme (colors, type ladder, radii, spacing).
- Backend: Express + TS, Mongoose connect, health route, env config.
- `docker-compose.dev.yml` (mongo + redis). `.env.example`.
- **Verify:** `docker compose -f deploy/docker-compose.dev.yml up -d` healthy; frontend
  renders a themed page; `GET /api/health` → 200.

## Phase 1 — Auth & RBAC
Goal: seeded admin can log in; RBAC guards admin routes.
- `User` model; seed static admin from `ADMIN_USER`/`ADMIN_PASSWORD` on boot.
- JWT login (httpOnly cookie), `requireAuth` + `requireAdmin` middleware.
- Frontend: login page (design.md styling), auth context, protected routes, redirect on
  missing/expired JWT.
- Admin → Users: list + create user (username, password, role).
- **Verify:** seeded admin logs in; `user`-role token is 403 on `/admin/*`; created user can
  log in.

## Phase 2 — Landing + Docs (MDX)
Goal: the public face and the MDX pipeline.
- MDX pipeline (`@mdx-js/rollup`) + shadcn typography.
- **Landing page** from `design.md` (alternating full-bleed tiles, violet accent).
- **Docs page** rendering `.mdx` from `/docs-content`, nav entry.
- **Verify:** landing matches design.md rules (single accent, pill CTAs, tile rhythm); a docs
  MDX file renders with styled typography.

## Phase 3 — Web design: portals + SaaS-grade redesign
Goal: the authenticated app looks and feels like a real SaaS product — before any of its
data is real. Mock/hardcoded content only; no new backend calls. This sets the IA that
Phase 4's models/APIs will populate.
- **Landing page:** elevate to a genuinely strong "powerful home page" — sharper hero,
  richer alternating-tile storytelling, tighter CTAs. Follows `design.md`
  (this page is the public marketing face).
- **Lab Access Portal** (user-side): SaaS dashboard shell (persistent app nav/sidebar) +
  "My Labs" placeholder card list (lab name, status, "Enter lab" CTA) + Credentials tab
  placeholder.
- **Admin Portal**: SaaS dashboard shell (persistent sidebar: Users / Machines /
  Assignments) + summary/stat tiles. Users section stays wired to the real API (already
  built in Phase 1); Machines/Assignments sections are placeholder tiles pointing at
  Phase 4.
- Global nav / profile dropdown (already landed) — refine to match the new shell.
- Placeholder data lives in one clearly-marked fixtures location so it's trivial to rip
  out when Phase 4 wires real data.
- **Verify:** Landing, Lab Access, and Admin portals all follow `design.md` tokens (violet
  `#702DFF` only accent, Inter ladder, 8px radii/pill CTAs) and read as one cohesive SaaS
  product; Admin → Users still fully functions against the real API throughout.

## Phase 4 — Domain model + static assignment
Goal: admin can create a machine manually and assign RDP creds to a user (no Terraform yet).
- `Lab`, `Machine`, `Assignment` models.
- Admin → Machines: create **static** machine (name, rdpHost, adminUser, adminPassword).
- Admin → Assignments: assign `(user, lab)` → `rdpHost/rdpUser/rdpPassword` + variables;
  also inline "Assign to user →" from machine detail.
- User: lab list + Credentials tab showing their assignment (replaces Phase 3's placeholder
  cards with real data).
- **Verify:** admin creates a static machine, assigns it; that user sees exactly those
  credentials and no one else's.

## Phase 5 — Remote desktop (Guacamole)
Goal: user sees a live RDP desktop in the browser.
- Add `guacd` + Guacamole to prod compose; wire nginx `/guac`.
- Backend Guacamole adapter: create/update a connection from an assignment, mint token.
- Lab page split view: left MDX guide, right embedded Guacamole client; **Remote|Credentials**
  tabs.
- **Verify:** against a test RDP host, an assigned user connects to the desktop in-browser;
  an unassigned user cannot.

## Phase 6 — Admin UI: web design + functional (Settings + Dashboard)
Goal: turn the two remaining mock admin surfaces into real, data-backed pages, and add the
presence/activity machinery they need. Independent of Phase 5 (remote-session troubleshooting) —
can proceed in parallel.
- **Presence & activity backend:** frontend heartbeat (~30s, only while the tab is visible);
  `UserActivity` collection keyed `(userId, dayKey)` accumulating active seconds (`$inc` by a
  capped delta), day boundary in `WORKSHOP_TZ` (default `Asia/Bangkok`); `AuditEvent` model +
  write-hooks on key mutations (assignment create/revoke, user create/delete, machine
  import/delete, lab create/import, login).
- **Settings page (mock → real):** admin change-own-password; editable platform display name
  (`Settings` singleton); default lab-document font size; Web App Endpoint stays a read-only
  "configured at deploy (nginx)" field (the only labelled-mock item). Font size is a **per-user**
  preference (A−/A+ in the lab toolbar, persisted on `User`, inheriting the platform default).
  Drop the mock infra cards (k8s version, node count, vCPU/mem defaults, Guacamole host, session
  timeout, 2FA, brand-color picker).
- **Dashboard redesign (all real):** concurrent-users-now + per-user active-time-today table;
  real user/machine/lab counts; machine health (UP/DOWN, free/assigned, summed vCPU/mem);
  labs-by-enrollment + avg progress; real activity feed from `AuditEvent`; quick actions. Cut
  trend deltas and the APM/performance bar (no data source / infra). Keep the existing richer
  visual aesthetic (not re-paletted to violet-only).
- **Verify:** dashboard shows only real data (live concurrent count, real per-user daily active
  time, real counts/health, real activity feed); Settings persist (password, platform name,
  default font size); a participant's font-size choice follows them across devices.

## Phase 7 — Dynamic provisioning (Terraform + Ansible + BullMQ) — ❌ DECLINED 2026-07-19
> **Cut by the maintainer:** workshop VMs are created **manually** and added to the Machine
> pool; the Machine model / pool console / SSH terminal already built in earlier phases cover
> the manual workflow. The BullMQ/Terraform/Ansible plumbing below is **not** being built.

Goal (not pursued): the cloud-manage feature with live logs.
- BullMQ queue + worker process; `Job` model.
- Provisioning adapter: per-machine workdir, `execa` `terraform apply` → `ansible-playbook`,
  stream logs to job doc; parse `terraform output`.
- Nutanix Terraform template + Ansible playbook (installs NKP tooling + xrdp) in `/infra`.
- Admin → Machines → Create (dynamic): launch job, **SSE live-log drawer**, rich detail panel
  on success; admin copies creds into an assignment.
- **Verify:** creating a dynamic machine provisions a real/mock Nutanix VM; logs stream live;
  status reaches `online`; outputs populate the detail panel.

## Phase 8 — Prod hardening & ship
Goal: full stack runs on one host behind a single public nginx, images pulled from Docker Hub.
> **Grilled + locked 2026-07-20.** CI (GitHub Actions) builds+pushes multi-stage images to
> **public** Docker Hub on push to `main`; a human runs `deploy.sh` on the host (CI, not auto-CD).
> **No worker/redis** (declined Phase-7 stubs). See `TASKS.md` Phase 8 for the itemised checklist.
- **Images:** multi-stage, non-root — `backend` (`node:alpine` runtime, `dist` + prod deps) and
  `frontend` (`nginx:alpine` serving the build). Repos:
  `mosszmossz/nutanix-nkp-workshop-{frontend,backend}`, tagged `:latest` + `:<short-sha>`.
- **Topology:** the **frontend nginx is the only public container**; it serves static + reverse-
  proxies `/api` + `/api/ws/*` to `backend` internally. `backend`/`mongo`/`guacd` publish no ports.
- **Compose (`deploy/docker-compose.prod.yml`):** bind-mounts `./data/mongo` + `./data/wiki`
  (`WIKI_DIR`); healthchecks; resource limits; `guacd` pinned `1.6.0`.
- **nginx:** two swappable mounted configs — `app.http.conf` (HTTP on local IP, behind the
  external CF tunnel) and `app.https.conf` (HTTPS with the maintainer's cert). Both do WebSocket
  upgrade + long read-timeouts for the RDP/SSH tunnels.
- **CI gate:** typecheck + lint + build (not `npm test` — 7 documented frozen-surface failures).
- **Prod-correctness (backend):** `trust proxy` (real client IP for the limiter/audit + `Secure`
  cookie), lab-find limit 10→60/10min, boot-time guard rejecting default/unset crypto secrets.
- **Secrets:** `deploy/.env.prod.example` cleaned of dead vars (`REDIS_URL`, `NUTANIX_*`,
  `CREDENTIAL_ENCRYPTION_KEY`, `LOG_LEVEL`); crypto secrets generate-once-never-change.
- **Verify:** on the prod host, an assigned user reaches their RDP desktop + guide + creds through
  the single public nginx (HTTP-behind-CF-tunnel and HTTPS-cert configs both); a pinned `<sha>`
  deploy + rollback works; DB/wiki/secrets persist across a redeploy.

## Sequencing notes
- Phase 3 (design) intentionally runs on mock data before Phase 4 (real models/APIs) —
  UI-first, thin vertical slice. Don't design further ahead than Phase 4 needs (e.g. no
  Machines list filtering/sorting/pagination — that's speculative surface Phase 4 doesn't
  call for).
- Phases 4→5 are the spine (assignment before remote). Phase 6 (admin UI real-data) is
  independent and ran in parallel with Phase 5. **Phase 7 (dynamic provisioning) is declined**
  — VMs are created manually — so the spine ends at Phase 5 + manual Machine-pool management.
