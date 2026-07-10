# Phase 4a — Backend Domain + API Validation Report
_Date: 2026-07-10 · Branch: phase-2-landing-docs_

## Result: PASS
_(Initial validation surfaced a flaky failure; fixed and re-verified — see "Flaky test caught & fixed" below.)_

## Gates
- typecheck: **pass** (`tsc --noEmit`, clean)
- tests: **116 passed (116)** across 9 files — verified **deterministic over 6 consecutive runs** (0 failures)
- lint: **pass** (0 errors, 0 warnings)

## Flaky test caught & fixed
The independent validation pass caught what the implementation agents missed: `test/models.test.ts`
failed **intermittently** (~1 run in 3) on the two "enforces unique" tests.

- **Root cause:** Mongoose unique indexes build **asynchronously** after `mongoose.connect()`.
  The `beforeAll` didn't wait for the build, so the duplicate-insert assertions raced the index —
  when the index wasn't ready yet, the duplicate insert succeeded and the test failed. (Not a
  `runValidators` issue and not a model bug — the models declare the indexes correctly; the test
  setup simply didn't wait for them.)
- **Fix:** `await Promise.all([LabModel.init(), AssignmentModel.init()])` in the test's `beforeAll`
  (after `connect`). `Model.init()` resolves once indexes finish building, making the unique tests
  deterministic. Verified 6/6 clean runs.

## Scope delivered (4a)
### Domain layer
- **`Lab`** (`backend/src/models/Lab.ts`) — `slug` (unique), `title`, `summary`, `difficulty`, `duration`, `order`. Guide content is **file-backed** (not in DB).
- **`Assignment`** (`backend/src/models/Assignment.ts`) — `userId`, `labId`, `rdpHost`, `rdpPort`, `rdpUser`, `rdpPassword` (ciphertext), `completedPages[]`; compound unique `{userId,labId}`.
- **`crypto.ts`** — AES-256-GCM `encryptSecret` / `decryptSecret` (iv:authTag:ciphertext, tamper-detecting).
- **`wiki.ts`** — `scaffoldLab`, `listPages`, `readPage`, `writePage`, `removeLab`; path-traversal guarded.

### Admin API (`requireAdmin`)
- Labs: `GET /` · `POST /` · `GET /:slug` · `PATCH /:slug` · `DELETE /:slug` · `GET /:slug/pages/:file` · `PUT /:slug/pages/:file`
- Assignments: `GET /` · `POST /` · `PATCH /:id` · `DELETE /:id`
- Mounted at `/api/admin/labs` and `/api/admin/assignments`.

### User API (`requireAuth`, ownership-enforced)
- `GET /api/me/labs` — caller's labs + progress, **no credentials**
- `GET /api/me/labs/:slug` — lab-view payload: `{ lab, pages, completedPages, connection }` (decrypted creds); **404** if not the caller's assignment
- `GET /api/me/labs/:slug/pages/:file` — page markdown, gated by assignment
- `POST /api/me/labs/:slug/progress` — toggle a page in `completedPages`

## Test files (116 tests / 9 files)
- `crypto.test.ts` — round-trip, IV randomness, tamper detection
- `wiki.test.ts` — scaffold/list/read/write/remove, path-traversal rejection
- `models.test.ts` — Lab/Assignment validation, **unique constraints** (now deterministic)
- `admin-labs.test.ts` — lab CRUD, kebab-slug validation, wiki scaffolding, RBAC 403
- `admin-assignments.test.ts` — encrypt-on-write / decrypt-on-read, dup 409, RBAC 403
- `me-labs.test.ts` — ownership, decrypted creds to owner only, progress toggle, 401 unauth
- (plus pre-existing `smoke`, `auth-security`, `rbac-guards`)

## Notes / follow-ups for Phase 4b
1. **DTO shape inconsistency:** admin `POST/GET /api/admin/labs` returns the **raw Mongoose doc (`_id`)**, while the assignment routes and `/api/me` routes return a **DTO (`id`)**. The 4b frontend must handle both — recommend normalizing lab responses to a DTO (`id`) for consistency.
2. **Stale env placeholder:** root `.env.example` still lists an unused `CREDENTIAL_ENCRYPTION_KEY` alongside the wired `CREDENTIAL_SECRET` — remove the stale one.
3. **Wiki persistence:** guide pages are **file-backed by design** under `WIKI_DIR` (repo-root `wiki/`), per the agreed plan — not Mongo. Prod deploy must mount/persist this directory.
4. Middlewares (`requireAuth`/`requireAdmin`) are covered implicitly via route RBAC tests (403/401), consistent with the existing `rbac-guards.test.ts` approach.
