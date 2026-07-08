# Architecture

How the Nutanix NKP Workshop Platform fits together. See `CLAUDE.md` for the stack table and
`DESIGN.md` for the visual system.

## System overview

```
                        ┌───────────────────────── Browser ─────────────────────────┐
                        │  React (Vite + TS + Tailwind + shadcn)                     │
                        │  ┌── User ──────────────┐   ┌── Admin (RBAC) ───────────┐  │
                        │  │ Landing / Docs (MDX) │   │ Dashboard · Users         │  │
                        │  │ Lab: [guide | RDP]   │   │ Machines (cloud-manage)   │  │
                        │  │ tabs: Remote|Creds   │   │ Assignments · Labs        │  │
                        │  └──────────────────────┘   └───────────────────────────┘  │
                        └───────┬───────────────────────────────┬────────────────────┘
                                │ HTTPS (/, /api, /guac)         │ RDP-over-HTML5 (canvas)
                        ┌───────▼──────── nginx (prod, TLS) ─────▼────────┐
                        │           reverse proxy + TLS terminate         │
                        └───┬───────────────┬───────────────────┬────────┘
                            │ /api          │ /guac             │
                    ┌───────▼──────┐  ┌─────▼──────────┐   ┌────▼─────┐
                    │ Express API  │  │ Guacamole web  │   │ frontend │
                    │ (TS, layered)│  │  + guacd       │   │ (static) │
                    └──┬────┬───┬──┘  └─────┬──────────┘   └──────────┘
             Mongoose  │    │   │ enqueue   │ RDP
              ┌────────▼┐  ┌▼───▼─────┐    ┌▼──────────────────────┐
              │ MongoDB │  │ Redis    │    │ Provisioned Linux VMs │
              │ (app)   │  │ (BullMQ) │    │  xrdp + kubectl/NKP   │
              └─────────┘  └────┬─────┘    └───────────▲───────────┘
                                │ job                  │ terraform apply / ansible-playbook
                          ┌─────▼───────────────┐      │
                          │ Provisioning worker  │──────┘  (execa → /infra templates)
                          │ (BullMQ consumer)    │  streams logs → job doc → SSE → admin UI
                          └──────────────────────┘
```

## Backend structure (Express, layered — no MVC framework)

Keep it flat and explicit. Roughly:

```
backend/src/
  routes/        thin HTTP handlers, validation, RBAC middleware
  services/      business logic (auth, users, machines, assignments, labs, jobs)
  models/        Mongoose schemas
  infra/         adapters to the outside world:
    guacamole/   create/update connections, mint tokens
    provisioning/ execa wrappers for terraform + ansible, workdir management
    queue/       BullMQ setup, job producers
  worker/        BullMQ consumer entrypoint (runs as a separate process)
  middleware/    auth (JWT), rbac, error handler
  config/        env loading, constants
```

Route → service → model/infra. No controllers-as-classes, no decorators, no DI container.

## Data model (MongoDB / Mongoose)

```
User
  _id, user (unique username), passwordHash, role: 'admin' | 'user', createdAt

Lab                         # reusable guide template
  _id, slug, title, summary, mdxPath, variables: [{ key, label, required }]

Machine                     # the infrastructure, created manually OR by a Job
  _id, name, source: 'static' | 'dynamic',
  rdpHost, adminUser, adminPassword,          # secret at rest — see SECURITY.md
  status: 'pending'|'provisioning'|'configuring'|'online'|'offline'|'failed',
  terraformOutputs: {...}, jobId?, createdAt

Assignment                  # links User <-> Lab, holds per-user RDP creds the user sees
  _id, userId, labId,
  rdpHost, rdpUser, rdpPassword,              # copied from a Machine or typed by admin
  variables: { key: value },                  # resolved lab variables
  machineId?, createdAt

Job                         # one Terraform -> Ansible provisioning run
  _id, machineId, type: 'provision'|'deprovision',
  state: 'pending'|'provisioning'|'configuring'|'ready'|'failed',
  logs: [ { ts, stream, line } ],  error?, createdAt, finishedAt
```

Notes:
- **Credentials are per-user** — each user gets their own `(rdpHost, rdpUser, rdpPassword)`.
- **Labs are reusable templates**; the per-user instance is the `Assignment`.
- `Machine` and `Assignment` are **decoupled** — the admin copies machine details into an
  assignment manually (static path) or after a dynamic provision.

## Key flows

### 1. Auth
1. On first boot the backend **seeds a static admin** from `ADMIN_USER` / `ADMIN_PASSWORD`
   (env). This account always exists so you can get in.
2. Admin creates other users in the Admin → Users page (username + password + role).
3. Login issues a **JWT** (httpOnly cookie) with `role` claim. `requireAuth` guards user
   routes; `requireAdmin` guards `/admin/*` (API + UI).

### 2. Dynamic machine provisioning (cloud-manage)
1. Admin → Machines → **Create Machine**, picks a Terraform/Ansible template + variables.
2. API creates a `Machine (status: pending)` + a `Job (pending)`, enqueues on **BullMQ**,
   returns `jobId`.
3. **Worker** copies the template into a per-machine workdir, injects variables, runs
   `terraform apply` → `ansible-playbook` via `execa`, appending stdout/stderr to the job
   log. State walks `provisioning → configuring → ready`.
4. Admin UI **streams the log live** (SSE from `/api/jobs/:id/stream`), then shows the rich
   machine-detail panel (RDP IP, admin user, generated password, outputs, `online`).

### 3. Assigning a user their machine
- **Static:** Admin → Assignments (or inline "Assign to user →" on a machine) → fills
  `rdpHost / rdpUser / rdpPassword` (+ lab variables) for a `(user, lab)`.
- **Dynamic:** same form, values copied from a provisioned machine's detail panel.
- Result: an `Assignment` the user sees on their Credentials tab.

### 4. User lab session
1. User logs in → opens an assigned lab. Missing/expired JWT → redirect to login.
2. **Left pane** renders the lab's MDX guide. **Top tabs: Remote | Credentials.**
3. **Remote:** backend ensures a **Guacamole connection** exists for the user's assignment
   `(rdpHost, rdpUser, rdpPassword)`, mints a short-lived token; the right pane embeds the
   Guacamole HTML5 client (RDP desktop in a `<canvas>`).
4. **Credentials:** renders the assignment's RDP details + resolved lab variables.

## Provisioning internals (`/infra`)

- `infra/terraform/<template>/` — Nutanix Terraform provider config; variables injected per
  run. State on a mounted volume for v1 (remote backend later).
- `infra/ansible/<template>/` — playbooks that install/configure NKP tooling and `xrdp`.
- The worker owns a **per-machine workdir** so concurrent provisions don't collide. Terraform
  outputs are parsed (`terraform output -json`) into `Machine.terraformOutputs`.

## Deployment

- **Dev:** `docker-compose.dev.yml` runs **mongo + redis** only; fe/be/worker run locally
  with hot reload.
- **Prod:** `docker-compose.prod.yml` runs **nginx + frontend + backend + worker + mongo +
  redis + guacd + guacamole**. Nginx terminates TLS and proxies `/` → frontend, `/api` →
  backend, `/guac` → Guacamole. Guacamole keeps its own store, separate from app Mongo.

## Deliberate non-goals (v1)

- No auto-grading / task verification in lab guides (killer.sh's hardest feature).
- No public self-signup (admin creates users).
- No automatic wiring of Terraform output → user credential (admin copies manually).
- No in-app lab authoring editor (guides are `.mdx` files in the repo).
