# Phase 4c — User-facing lab view (design spec)

_Written 2026-07-11 · branch `phase-2-landing-docs`_

## Context

Phase 4a (backend: `Lab`/`Assignment` models, admin API, `/api/me` API) and Phase 4b (admin
UI bound to real data) are done. Phase 4c is the participant-facing surface: a real "My Labs"
list and a killer.sh-style split lab view (guide left, desktop/creds right).

A prior handoff doc (`docs/handoff-phase-4c.md`) bundled Guacamole wiring into 4c. `TASKS.md`
keeps them as separate phases (4c = guide + progress + creds; Phase 5 = Guacamole, gated on a
reachable xrdp host to test against). This spec follows `TASKS.md`: **Guacamole is out of
scope here** and remains Phase 5.

## Scope

**In:**
- My Labs list (`LabAccessPage.tsx`) wired to `GET /me/labs`
- New route `/lab-access/:slug` — split lab view
- Guide pane: page list, markdown rendering, per-page "mark complete", Next/Back
- Right panel: `Remote` / `Credentials` tabs — Credentials real, Remote a placeholder

**Out (Phase 5):**
- `guacd` service, RDP token broker, `guacamole-common-js` canvas — the Remote tab stays a
  static "coming soon" panel until that phase

**No backend changes.** All required `/api/me/*` endpoints already exist and were confirmed
correct for this scope by reading `backend/src/routes/me.ts` directly:
- `GET /me/labs`
- `GET /me/labs/:slug` → `{lab, pages, completedPages, connection}`
- `GET /me/labs/:slug/pages/:file` → `{file, content}`
- `POST /me/labs/:slug/progress` `{file, completed}` → `{completedPages}`

## 1. My Labs list (`frontend/src/pages/LabAccessPage.tsx`)

- Replace the mock `labs` array with a `GET /me/labs` call via `api<T>()` on mount.
- Response shape: `[{id, lab:{slug,title,summary,difficulty,duration}, pageCount,
  completedCount}]`.
- Card grid layout stays. The old `status` badge (ready/provisioning/offline — not part of the
  real data) is replaced with a progress meter: `completedCount / pageCount` + an "X of Y
  pages" label.
- "Open lab" button becomes `<Link to={`/lab-access/${lab.lab.slug}`}>`.
- Empty state (no assignments): "No labs assigned yet" message, consistent with the
  empty-state pattern used elsewhere in the app.

## 2. Routing

- New route `/lab-access/:slug`, inside `<ProtectedRoute>`, lazy-loaded (`React.lazy` +
  `Suspense`) matching the pattern in `App.tsx`.
- Still rendered inside `AppShell`, but the page overrides `main`'s default padding
  (`-mx-xl -my-lg h-[calc(100vh-4rem)]`) so the split pane can use the full viewport height.
  No new layout-escape mechanism is added to `AppShell` itself — the override is local to this
  one page.

## 3. Lab view shell

- On mount: `GET /me/labs/:slug` → `{lab, pages, completedPages, connection}`.
- 404 (not assigned / bad slug) → inline "not assigned" empty-state panel, not a crash or
  silent redirect.
- Two-pane layout using shadcn's `resizable` primitive (built on `react-resizable-panels`,
  new dependency) — draggable divider between the guide pane (left) and the tabbed panel
  (right), default split ~40/60.

## 4. Guide pane (left)

- Slim page-list sidebar inside the pane: one row per entry in `pages[]`, each showing title +
  a completed-checkmark derived from `completedPages`.
- Selecting a page lazily fetches `GET /me/labs/:slug/pages/:file` (not prefetched — matches
  how the existing docs pages load).
- Rendering: **react-markdown + remark-gfm** (new deps), plus a syntax highlighter for
  code/YAML blocks (`rehype-highlight` or equivalent, new dep). Element styling is adapted
  from the existing `mdxComponents` class-per-element map (`frontend/src/docs/
  mdx-components.tsx`) so it stays on `design.md` tokens rather than introducing a second
  styling system.
- A small shared **copy-to-clipboard button** component is added (none exists yet) and used on
  code blocks in the guide pane and on the credential fields in the Credentials tab.
- Explicit **"Mark complete"** toggle per page → `POST /me/labs/:slug/progress {file,
  completed}`; on success, update `completedPages` in local state (toggle, matching the API's
  idempotent design — clicking again un-marks it).
- **Next / Back** buttons at the bottom of the rendered content, cycling through `pages[]` in
  document order.
- Page fetch failure → inline retry state scoped to the guide pane; the rest of the shell
  (page list, right panel) stays usable.

## 5. Right panel — tabs

- New shadcn `tabs` install (`@radix-ui/react-tabs`).
- **Credentials tab**: renders `connection.{rdpHost, rdpPort, rdpUser, rdpPassword}` as a
  simple field list, each with the shared copy button.
- **Remote tab**: static placeholder panel — "Live desktop is coming in Phase 5" plus a hint to
  connect manually via the Credentials tab in the meantime. No canvas, no guacd/token calls.
  Structure (tab exists, just empty) is deliberately kept so Phase 5 only has to swap in the
  canvas component, not add tab scaffolding.

## New dependencies

`react-markdown`, `remark-gfm`, `rehype-highlight` (or equivalent), `@radix-ui/react-tabs`
(via `shadcn add tabs`), `react-resizable-panels` (via `shadcn add resizable`).

## Error / empty states summary

| Situation | Behavior |
|---|---|
| No labs assigned (`/lab-access`) | Existing empty-state pattern, no cards |
| Lab slug not assigned to caller (`/lab-access/:slug`) | Inline "not assigned" panel, no crash |
| Guide page fetch fails | Inline retry, scoped to guide pane only |
| Mark-complete request fails | Toggle reverts, inline error near the button |

## Testing plan

- Frontend: component-level checks for the My Labs list (empty vs populated), the guide pane's
  page navigation + mark-complete toggle, and the Credentials tab rendering — matching whatever
  test setup the existing admin pages use (if any exist; otherwise manual verification against
  a running backend is acceptable for this phase, consistent with prior 4a/4b validation
  reports under `docs/reports/`).
- Manual E2E per `TASKS.md`'s Phase 4c checkpoint: seeded admin creates a lab + assignment for
  a `user`; log in as that user → `/lab-access` shows only assigned labs → open a lab → guide
  renders, page nav + progress persist across reload, Credentials tab shows the real RDP
  fields, Remote tab shows the placeholder; an unassigned user sees nothing for that lab.

## Non-goals (explicit)

- Guacamole/live desktop (Phase 5)
- Machine-reachability checks / "desktop unavailable" states (Phase 5, once a real desktop
  exists to be unavailable)
- Lab task auto-grading, self-signup — already listed as backlog non-goals in `TASKS.md`
