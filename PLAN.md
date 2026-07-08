# Build Plan

Phased roadmap. Each phase ends at a **verifiable checkpoint** — don't move on until it's
green. Build vertically (thin end-to-end slices) rather than one whole layer at a time.
Track concrete items in `TASKS.md`.

## Phase 0 — Scaffold & dev loop
Goal: repos exist, dev infra runs, both apps boot.
- Monorepo dirs (`/frontend /backend /infra /docs-content /deploy`).
- Frontend: Vite + React + TS + Tailwind + shadcn init; map `DESIGN.md` tokens into the
  Tailwind theme (colors, type ladder, radii, spacing).
- Backend: Express + TS, Mongoose connect, health route, env config.
- `docker-compose.dev.yml` (mongo + redis). `.env.example`.
- **Verify:** `docker compose -f deploy/docker-compose.dev.yml up -d` healthy; frontend
  renders a themed page; `GET /api/health` → 200.

## Phase 1 — Auth & RBAC
Goal: seeded admin can log in; RBAC guards admin routes.
- `User` model; seed static admin from `ADMIN_USER`/`ADMIN_PASSWORD` on boot.
- JWT login (httpOnly cookie), `requireAuth` + `requireAdmin` middleware.
- Frontend: login page (DESIGN.md styling), auth context, protected routes, redirect on
  missing/expired JWT.
- Admin → Users: list + create user (username, password, role).
- **Verify:** seeded admin logs in; `user`-role token is 403 on `/admin/*`; created user can
  log in.

## Phase 2 — Landing + Docs (MDX)
Goal: the public face and the MDX pipeline.
- MDX pipeline (`@mdx-js/rollup`) + shadcn typography.
- Apple-style **landing page** from `DESIGN.md` (alternating full-bleed tiles, Action Blue).
- **Docs page** rendering `.mdx` from `/docs-content`, nav entry.
- **Verify:** landing matches DESIGN.md rules (single accent, pill CTAs, tile rhythm); a docs
  MDX file renders with styled typography.

## Phase 3 — Domain model + static assignment
Goal: admin can create a machine manually and assign RDP creds to a user (no Terraform yet).
- `Lab`, `Machine`, `Assignment` models.
- Admin → Machines: create **static** machine (name, rdpHost, adminUser, adminPassword).
- Admin → Assignments: assign `(user, lab)` → `rdpHost/rdpUser/rdpPassword` + variables;
  also inline "Assign to user →" from machine detail.
- User: lab list + Credentials tab showing their assignment.
- **Verify:** admin creates a static machine, assigns it; that user sees exactly those
  credentials and no one else's.

## Phase 4 — Remote desktop (Guacamole)
Goal: user sees a live RDP desktop in the browser.
- Add `guacd` + Guacamole to prod compose; wire nginx `/guac`.
- Backend Guacamole adapter: create/update a connection from an assignment, mint token.
- Lab page split view: left MDX guide, right embedded Guacamole client; **Remote|Credentials**
  tabs.
- **Verify:** against a test RDP host, an assigned user connects to the desktop in-browser;
  an unassigned user cannot.

## Phase 5 — Dynamic provisioning (Terraform + Ansible + BullMQ)
Goal: the cloud-manage feature with live logs.
- BullMQ queue + worker process; `Job` model.
- Provisioning adapter: per-machine workdir, `execa` `terraform apply` → `ansible-playbook`,
  stream logs to job doc; parse `terraform output`.
- Nutanix Terraform template + Ansible playbook (installs NKP tooling + xrdp) in `/infra`.
- Admin → Machines → Create (dynamic): launch job, **SSE live-log drawer**, rich detail panel
  on success; admin copies creds into an assignment.
- **Verify:** creating a dynamic machine provisions a real/mock Nutanix VM; logs stream live;
  status reaches `online`; outputs populate the detail panel.

## Phase 6 — Prod hardening & ship
Goal: full stack runs behind nginx over TLS.
- `docker-compose.prod.yml` (nginx + fe + be + worker + mongo + redis + guac).
- nginx TLS + routing; secret handling per `SECURITY.md`; basic dashboards/counts.
- **Verify:** `docker compose -f deploy/docker-compose.prod.yml up -d` serves the full flow
  end-to-end over HTTPS on a clean host.

## Sequencing notes
- Phases 3→4→5 are the spine; do them in order (assignment before remote before dynamic).
- Phase 5 is the highest-risk (real infra). Mock the Nutanix provider early if hardware
  isn't ready, so the queue/log/UI plumbing is proven independently.
