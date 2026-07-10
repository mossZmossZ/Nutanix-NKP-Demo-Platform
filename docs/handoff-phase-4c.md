# Handoff → Phase 4c (User-facing lab view + Guacamole RDP)

_Written 2026-07-10 · branch `phase-2-landing-docs` · previous session finished 4b (admin, commit `4a6925a`)_

> **Start fresh.** Open a new session and read this file first — it carries the exact `/api/me`
> shapes so you don't re-derive anything. Orchestrate (don't hand-write feature code): Sonnet
> implementers (~40–60K ctx each, one concern, self-verify green) + a Haiku validation/report pass.
> Invoke `/andrej-karpathy-skills:karpathy-guidelines` before any code.

## TL;DR
4a (backend) and 4b (admin: machine pool + lab/creds surfaces) are **done, committed, green**
(backend 125/125 tests — see `docs/reports/phase-4b-validation.md`). Your job in **4c** is the
**user side**: the killer.sh-style split lab view — lab guide on the left, a live in-browser **RDP
desktop** (Apache Guacamole) on the right, a top **Remote / Credentials** tab — plus the "my labs"
list. This is where **Guacamole** finally gets wired (the one genuinely new infra piece).

## What already exists (consume, don't rebuild)
- **User API** (`/api/me`, `requireAuth`) — fully built in 4a, and 4b made `connection` resolve from
  the **bound machine**:
  - `GET /me/labs` → `[{ id, lab:{slug,title,summary,difficulty,duration}, pageCount, completedCount }]`
    (only the caller's assigned labs, sorted by lab order then title).
  - `GET /me/labs/:slug` → `{ id, lab, pages:[{file,...}], completedPages:string[],
    connection:{ rdpHost, rdpPort, rdpUser, rdpPassword /* DECRYPTED */ } }` (404 if the user isn't
    assigned that lab).
  - `GET /me/labs/:slug/pages/:file` → `{ file, content }` (raw markdown; 404 if unassigned/missing).
  - `POST /me/labs/:slug/progress` `{ file:string, completed:boolean }` → `{ completedPages }`
    (idempotent toggle).
- **Frontend entry point**: `frontend/src/pages/LabAccessPage.tsx` at route `/lab-access`
  (inside `<ProtectedRoute>` in `frontend/src/App.tsx`) — currently a placeholder; this is your
  landing surface for the user side. Reuse the `api<T>()` wrapper (`@/lib/api`) + `useAuth` exactly
  as the admin pages do (single-origin cookie via the Vite proxy).
- **Guide content** is file-backed markdown under `wiki/<slug>/NN-*.md` (served through the `/me`
  page endpoints — you never read the filesystem from the client).

## 4c scope
1. **"My labs" list** — `GET /me/labs` → cards (title, difficulty, duration, a progress meter from
   `completedCount / pageCount`). Selecting one routes into the lab view. Design per `design.md`
   (light violet, tokens, no inline hex) — net-new, use `frontend-design` + `web-design-guidelines`.
2. **Split lab view** (the killer.sh layout):
   - **Left pane** — guide: page nav from `pages[]`, render each page's markdown
     (`GET .../pages/:file`), a "mark complete" control per page → `POST .../progress`, progress
     reflected live. (There's already an MDX/markdown render path in the docs area — reuse the
     renderer rather than adding a new markdown lib.)
   - **Right pane** — the desktop, behind a top **Remote / Credentials** tab. **Credentials** tab
     shows `connection` (host:port / user / password with copy). **Remote** tab hosts the Guacamole
     session.
3. **Guacamole integration** (the infra piece):
   - Stand up **`guacd`** as a service (add to `deploy/docker-compose.dev.yml` and the prod compose;
     CLAUDE.md's prod stack already anticipates guac).
   - Broker the connection **server-side**. Recommended: `guacamole-lite` (Node) in the backend
     opens the guacd tunnel and mints a **short-lived encrypted token** from the RDP creds; the
     frontend uses `guacamole-common-js` to render the display over a websocket. Add a new
     endpoint, e.g. `GET /me/labs/:slug/rdp-token`, that returns a token for the caller's bound
     machine — do **not** enqueue anything (this is a live connection, not a BullMQ job).

## Gotchas / decisions to carry forward
- **SECURITY — don't ship the raw RDP password to the browser for the *desktop*.** The `connection`
  object returns the decrypted password (fine to *display* under the Credentials tab, matching the
  admin pattern), but the **Remote** desktop must connect via a **brokered token** (guacd-side),
  never by embedding the password in client JS or the tunnel URL. See `SECURITY.md`.
- **Empty / not-provisioned states**: a user may have an assignment whose machine is fine, but the
  RDP target may be unreachable. Design a clear "desktop unavailable / reconnecting" state; don't
  hard-crash the pane.
- **Reset semantics**: revoke currently runs a **no-op `resetMachine()`** placeholder
  (`backend/src/routes/admin/assignments.ts`) before returning a machine to the pool. Real
  re-provision/wipe wiring is a later phase — don't build it here unless asked.
- **Open backend follow-up (not 4c-blocking)**: admin `/api/admin/labs` still returns raw Mongoose
  docs (`_id`) while everything else returns DTOs (`id`); the 4b frontend works around it. The
  `/me` endpoints are already clean (slug-keyed, no `_id` leak). Normalizing the admin labs DTO
  (and updating `admin-labs.test.ts:115`) is a small standalone cleanup worth its own commit.

## Suggested orchestration (mirror 4a/4b)
- **Backend/infra agent**: `guacd` compose service + `GET /me/labs/:slug/rdp-token` broker
  (guacamole-lite) + config/env for the guac secret. Self-verify typecheck/tests.
- **Frontend agent A**: "my labs" list + split-view shell + guide pane (markdown render + progress).
- **Frontend agent B**: RDP desktop pane (`guacamole-common-js`) + Remote/Credentials tab wiring.
- **Haiku**: typecheck + build + a short report in `docs/reports/phase-4c-validation.md`.

## Verify (needs live infra)
`docker compose -f deploy/docker-compose.dev.yml up -d` (mongo + redis + **guacd**), then
`cd backend && npm run dev` and `cd frontend && npm run dev`. As a **seeded admin**: create a lab,
import a machine, assign it to a `user`. Log in **as that user** → `/lab-access` → open the lab →
guide renders, progress toggles persist, the **Remote** tab connects to the desktop (requires a
reachable RDP target behind guacd). Commit 4c as its own focused commit when green.
