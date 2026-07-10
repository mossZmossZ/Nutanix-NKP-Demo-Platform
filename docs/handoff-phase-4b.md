# Handoff → Phase 4b (Admin: bind the design template to real data)
_Written 2026-07-10 · branch `phase-2-landing-docs` · previous session finished 4a (backend)_

## TL;DR
Phase **4a is done and green** (backend domain + API, `116` tests, deterministic — see
`docs/reports/phase-4a-validation.md`). Your job in **4b** is frontend-only: wire the **already-built,
frozen admin design template** to these real APIs. **Do not restyle** the admin template; only bind
logic / real data. Any *redesign* must go through a dedicated **Opus agent** + validation first.
Leave the **Users page as-is** (already real).

## What exists now (4a — backend, all real, no mocks)
Models: `Lab`, `Assignment` (RDP password AES-256-GCM encrypted at rest). Guide content is
**file-backed** under repo-root `wiki/<slug>/NN-*.md` (via `WIKI_DIR`), not in Mongo.

### API contract 4b will consume
**Admin — labs** (`/api/admin/labs`, requireAdmin):
- `GET /` → labs list (each with `pageCount`) · `POST /` `{slug,title,summary?,difficulty?,duration?,order?}` (kebab slug; scaffolds `wiki/<slug>/01-intro.md`)
- `GET /:slug` → `{ ...lab, pages }` · `PATCH /:slug` (metadata; slug immutable) · `DELETE /:slug` (409 if assignments exist)
- `GET /:slug/pages/:file` → `{file, content}` · `PUT /:slug/pages/:file` `{content}` (edit a guide page)

**Admin — assignments** (`/api/admin/assignments`, requireAdmin):
- `GET /` → `[{ id, user:{id,username}, lab:{id,slug,title}, rdpHost, rdpPort, rdpUser, rdpPassword /*decrypted*/, completedPages }]`
- `POST /` `{userId,labId,rdpHost,rdpPort?,rdpUser,rdpPassword}` (409 on dup `{userId,labId}`) · `PATCH /:id` · `DELETE /:id`

**User** (`/api/me`, requireAuth) — for reference; the 4c session builds these UIs:
- `GET /labs` · `GET /labs/:slug` (`{lab,pages,completedPages,connection}`) · `GET /labs/:slug/pages/:file` · `POST /labs/:slug/progress`

## 4b task list (from TASKS.md → Phase 4, section 4b)
1. **Lab management surface (new admin page)** — CRUD labs against `/api/admin/labs`, plus a simple
   guide-page editor (list pages, edit a page's markdown via `GET/PUT /:slug/pages/:file`). This is a
   **net-new surface** → design it per `design.md` using the `frontend-design` + `web-design-guidelines`
   skills (violet-only, tokens, no inline hex). Add it to `adminNav`.
2. **Lab Credentials page** (`frontend/src/pages/admin/LabCredentialsPage.tsx`) — replace the local
   `initialAssignments` mock array with real data from `/api/admin/assignments`. **Auto-link:** the
   assign dialog's **Lab** field becomes a dropdown populated from `GET /api/admin/labs` (not free text);
   the **User** field a dropdown from the existing users API. Persist via `POST`; revoke via `DELETE`.
3. **Users page** — already real; **do not touch**.

## Gotchas / decisions carried forward
- **DTO shape inconsistency:** admin `labs` endpoints return the **raw Mongoose doc (`_id`)**, while
  `assignments` + `/api/me` return a **DTO (`id`)**. Handle both, or (recommended) normalize the labs
  responses to a DTO (`id`) as a tiny 4b backend tweak.
- **Auth/proxy:** frontend talks to the API through the Vite dev proxy (single-origin httpOnly cookie);
  reuse the existing auth context + fetch pattern from `UsersPage.tsx` (the one real admin page).
- **Design freeze:** admin surfaces are a finished template — bind data, don't restyle. The template
  deviates from `design.md` (functional status colors, a few gradients/hex) — accepted; revisit only
  via an Opus-agent redesign. New Lab-management surface follows `design.md`.
- **Stale env:** root `.env.example` has an unused `CREDENTIAL_ENCRYPTION_KEY` next to the wired
  `CREDENTIAL_SECRET` — safe to delete the stale one.

## Git state (nothing committed yet)
4a is **uncommitted** on `phase-2-landing-docs`, mixed with the earlier Phase 3 admin-template changes.
New untracked: `backend/src/{lib,models/Lab.ts,models/Assignment.ts,routes/admin/labs.ts,routes/admin/assignments.ts,routes/me.ts}`,
`backend/test/{crypto,wiki,models,admin-labs,admin-assignments,me-labs}.test.ts`, `wiki/`, `docs/reports/`.
Modified: `.env.example`, `backend/.env.example`, `backend/src/app.ts`, `backend/src/config/env.ts`,
`backend/test/setup.ts`, `TASKS.md`.
**Recommend:** commit 4a (backend) as its own commit before starting 4b so the frontend work is isolated.

## Suggested orchestration for 4b (mirror this session)
Orchestrator + Sonnet implementers (~40–60K ctx each; split proactively) + a Haiku validation/report pass:
- Sonnet A: Lab management page (CRUD + page editor) against `/api/admin/labs`.
- Sonnet B: wire `LabCredentialsPage` to `/api/admin/assignments` + lab/user dropdowns.
- Haiku: typecheck + `npm run build` + a short validation report in `docs/reports/`.
Verify with the real backend running (`cd backend && npm run dev`) + a seeded admin.
