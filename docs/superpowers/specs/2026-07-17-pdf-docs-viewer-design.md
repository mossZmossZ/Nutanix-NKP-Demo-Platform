# PDF Documentation on the Docs Page — Design

**Date:** 2026-07-17
**Status:** Approved (design), pending implementation plan
**Author:** Claude + maintainer

## Summary

Let an admin register a PDF hosted on Nutanix Objects (or any S3-compatible
store) as a documentation entry by pasting **title + summary + URL**. The entry
is stored as metadata in MongoDB, appears in the **public `/docs` index mixed
with the existing MDX docs**, and opens in an **in-app embedded viewer**
(`<iframe>`/`<object>`) with an "Open in new tab" fallback.

This is the docs surface only — **not** the lab guide pane. It reuses the
existing public `/docs` route family.

### Key decisions (from brainstorming)

- **PDF source:** admin registers an *existing* object URL. No upload flow.
- **Storage:** Nutanix Objects / any S3-compatible endpoint. URLs are pasted, not
  generated.
- **URL access:** URLs are **directly loadable** (public or long-lived
  presigned). Backend stores the URL as plain text — **no S3 SDK, no
  credentials, no presigning.**
- **Rendering:** native browser embed (`<iframe>`/`<object>`), not pdf.js.
- **Placement:** same `/docs` index, mixed in with MDX docs, sorted by `order`.

### Explicitly out of scope (YAGNI)

No file uploads, no S3 credentials/SDK, no presigning, no pdf.js/react-pdf, no
per-user PDF access control (docs are public today), no thumbnails.

### Accepted tradeoff

Because the backend does not sign URLs, a **private or expiring** Nutanix Objects
link will fail to embed *and* the "Open in new tab" fallback will also fail.
Registered URLs must be public or long-lived. Accepted by maintainer.

---

## Architecture

### 1. Data model — `backend/src/models/PdfDoc.ts`

Mongoose schema, following the `Settings.ts` / `Lab.ts` conventions
(`InferSchemaType`, `{ timestamps: true }`).

| field     | type              | rules                                             |
|-----------|-------------------|---------------------------------------------------|
| `title`   | String, required  | trimmed, non-empty                                |
| `summary` | String, optional  | trimmed                                           |
| `url`     | String, required  | must match `^https?://`                           |
| `slug`    | String, required  | unique index; kebab-case; auto-derived from title |
| `order`   | Number, default 0 | sorts against MDX `order`                         |
| timestamps| —                 | `createdAt` / `updatedAt`                          |

**Slug derivation** (service helper, unit-tested): lowercase title → strip to
`[a-z0-9]` words → join with `-`. On uniqueness collision, append `-2`, `-3`, …
until free. Admin never types a slug.

### 2. Backend routes

**Public — `backend/src/routes/docs.ts`**, mounted `app.use("/api/docs", docsRouter)`:
- `GET /api/docs/pdfs` → `200 [{ slug, title, summary, url, order }]`, sorted by
  `order` then `title`. No auth (matches the public `/docs` page).

**Admin — `backend/src/routes/admin/docs.ts`**, mounted
`app.use("/api/admin/docs", adminDocsRouter)`, guarded by
`requireAuth, requireAdmin` (same pattern as `settings.ts`):
- `GET /` → list including `id`.
- `POST /` → create. Validates: `title` non-empty string; `url` matches
  `^https?://`; `order` (if present) is an integer. Derives + assigns unique
  slug. `201` with the created DTO, or `400 { error }`.
- `PATCH /:id` → partial update (title/summary/url/order). Re-derives slug only
  if title changes. `404` if id not found, `400` on invalid field.
- `DELETE /:id` → `204`, or `404`.

Validation is inline in the route (mirrors `settings.ts`) — no new framework.

### 3. Frontend

**`frontend/src/lib/api.ts`** — add:
```ts
export interface PdfDoc {
  id?: string;        // present on admin responses only
  slug: string;
  title: string;
  summary?: string;
  url: string;
  order: number;
}
export const listPdfDocs = () => api<PdfDoc[]>("/docs/pdfs");
```
Admin CRUD helpers (`listAdminPdfDocs`, `createPdfDoc`, `updatePdfDoc`,
`deletePdfDoc`) alongside.

**`DocsIndexPage`** (`frontend/src/pages/docs/DocsIndexPage.tsx`):
- On mount, `listPdfDocs()`. Merge PDF entries with build-time `docsIndex` into
  one array of a small discriminated shape
  `{ kind: "mdx" | "pdf"; slug; title; summary; order }`.
- Sort by `order` then title; render the existing card style.
- MDX card → `to={/docs/${slug}}`; PDF card → `to={/docs/pdf/${slug}}` with a
  small violet "PDF" chip (pill, per design.md).
- If `listPdfDocs()` rejects: still render MDX docs + a quiet inline notice
  ("Couldn't load PDF documents"). Non-fatal.

**`PdfDocPage`** (new, `frontend/src/pages/docs/PdfDocPage.tsx`), route
`/docs/pdf/:slug` inside `PublicLayout`:
- Fetch `listPdfDocs()`, find by slug (list is small; avoids a second endpoint).
- Render title + summary, then the PDF in a rounded panel (radius-12,
  product-shadow) via `<iframe title=… src={url}>` sized tall
  (e.g. `h-[calc(100vh-…)]` / `min-h`), plus an **"Open in new tab ↗"**
  `text-primary` link above the frame.
- Not-found and loading states mirror `DocPage`.

**Admin `DocsPage`** (new, `frontend/src/pages/admin/DocsPage.tsx`), route
`/admin/docs` under `AdminRoute`:
- Table of registered PDFs (title, url, order, actions).
- Create/edit form: title, summary, url, order. Inline `ApiError.message` on
  failure (duplicate/invalid url).
- Delete with confirm.
- Add nav item `{ label: "Documentation", to: "/admin/docs", icon: <FileText /> }`
  to `adminNav.tsx` (import `FileText` from lucide-react).

**`App.tsx`** — add lazy imports + routes:
- `/docs/pdf/:slug` → `PdfDocPage` (inside the existing public `PublicLayout` block).
- `/admin/docs` → admin `DocsPage` (inside the `AdminRoute` block).

### 4. Design / UX (design.md compliance)

- Violet `#702DFF` is the only accent; "PDF" chip is a violet pill.
- Inter type ladder, radius 12 for the viewer panel, one product-shadow style.
- No inline hex — Tailwind tokens only.
- Reuse `DocsIndexPage`'s existing card classes for consistency.

---

## Error handling

| Case | Behavior |
|------|----------|
| `GET /api/docs/pdfs` fails on index | MDX docs still render; quiet inline notice. |
| PDF slug not found on `PdfDocPage` | Not-found panel + "← All docs" link (like `DocPage`). |
| Cross-origin embed blocked by object host | "Open in new tab ↗" fallback always present. |
| Invalid URL / non-http(s) on create | `400 { error }` → inline form message. |
| Duplicate title → slug collision | Auto-suffixed slug; no error surfaced. |

---

## Testing

**Backend (`backend/test/`, vitest — matches existing route/model tests):**
- Slug derivation + collision-suffixing (unit).
- `POST /api/admin/docs` validation: rejects empty title, non-http url,
  non-integer order; accepts valid; assigns unique slug.
- `GET /api/docs/pdfs` returns sorted public list, no auth required.
- RBAC: `/api/admin/docs` rejects non-admin (extend `rbac-guards.test.ts`
  pattern).

**Frontend (vitest):**
- `DocsIndexPage` merge+sort of MDX + PDF entries; non-fatal fetch-failure path.
- `PdfDocPage` not-found state.
- Keep clear of the 7 pre-existing frozen-surface failures (mdx/landing/nav/routing).

---

## Files touched

**New**
- `backend/src/models/PdfDoc.ts`
- `backend/src/routes/docs.ts`
- `backend/src/routes/admin/docs.ts`
- `backend/src/services/pdfDocs.ts` (slug derivation + list/create/update/delete helpers)
- `frontend/src/pages/docs/PdfDocPage.tsx`
- `frontend/src/pages/admin/DocsPage.tsx`
- tests as above

**Modified**
- `backend/src/app.ts` (mount two routers)
- `frontend/src/lib/api.ts` (DTO + helpers)
- `frontend/src/pages/docs/DocsIndexPage.tsx` (merge PDF docs)
- `frontend/src/pages/admin/adminNav.tsx` (nav item)
- `frontend/src/App.tsx` (two routes)

## Success criteria

1. Admin can register a PDF (title + summary + url) at `/admin/docs`; it persists.
2. The PDF appears in the public `/docs` index, correctly ordered among MDX docs,
   with a "PDF" chip.
3. Clicking it opens `/docs/pdf/:slug` with the PDF embedded in-app and a working
   "Open in new tab" link.
4. Invalid url / empty title is rejected with an inline error.
5. `/api/admin/docs` is admin-only; `/api/docs/pdfs` is public.
6. `npm run typecheck` + `npm run test` pass in both packages (excluding the 7
   known pre-existing frontend failures).
