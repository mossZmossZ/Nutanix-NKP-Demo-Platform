# PDF Documentation on the Docs Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admins register S3-hosted (Nutanix Objects) PDFs by URL so they appear in the public `/docs` index alongside MDX docs and open in an embedded in-app viewer.

**Architecture:** A `PdfDoc` Mongo model stores metadata only (title, summary, url, slug, order) — no upload, no S3 SDK, no presigning; the pasted URL is stored as plain text. A public `GET /api/docs/pdfs` feeds the `/docs` index; admin CRUD lives under `/api/admin/docs`. The frontend merges PDF entries with the build-time MDX `docsIndex` and renders PDFs via an `<iframe>` with an "Open in new tab" fallback.

**Tech Stack:** Express + Mongoose (backend), React + Vite + TypeScript + Tailwind + shadcn/ui (frontend), vitest + supertest (tests).

**Spec:** `docs/superpowers/specs/2026-07-17-pdf-docs-viewer-design.md`

## Global Constraints

- **Design tokens only — never inline hex.** Accent is violet via `text-primary`/`bg-primary`. Spacing `xxs/xs/sm/md/lg/xl`, radius `rounded-md`/`rounded-lg`/`rounded-full`, type `text-h1/h2/h4/body/body-sm`, `bg-surface`, `border-border`, `text-muted-foreground`, `text-destructive` are the available tokens (defined in `frontend/src/index.css`).
- **RBAC:** `/api/admin/*` guarded by `requireAuth, requireAdmin`. `/api/docs/pdfs` is public (matches the public `/docs` page).
- **TypeScript strict.** No `any` that trips lint; type route bodies as `Record<string, unknown>`.
- **URLs stored as plain text.** No S3 credentials, no presigning.
- **Do not modify the 7 known-flaky frozen frontend tests** (mdx/landing/nav/routing). Prefer pure-function unit tests over jsdom render tests for new frontend logic.
- **Commit after each task.** End commit messages with the `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` trailer.

---

## File Structure

**New (backend)**
- `backend/src/models/PdfDoc.ts` — Mongoose model.
- `backend/src/services/pdfDocs.ts` — `slugifyTitle` (pure) + `deriveUniqueSlug` (DB).
- `backend/src/routes/docs.ts` — public list route.
- `backend/src/routes/admin/docs.ts` — admin CRUD.
- `backend/test/pdf-slug.test.ts`, `backend/test/pdf-docs.test.ts`.

**New (frontend)**
- `frontend/src/pages/docs/mergeDocEntries.ts` — pure merge/sort helper.
- `frontend/src/pages/docs/mergeDocEntries.test.ts`.
- `frontend/src/pages/docs/PdfDocPage.tsx` — embedded viewer.
- `frontend/src/pages/admin/DocsPage.tsx` — admin CRUD page.

**Modified**
- `backend/src/app.ts` — mount two routers.
- `frontend/src/lib/api.ts` — `PdfDoc` DTO + helpers.
- `frontend/src/pages/docs/DocsIndexPage.tsx` — merge PDF docs.
- `frontend/src/pages/admin/adminNav.tsx` — nav item.
- `frontend/src/App.tsx` — two routes.

---

## Task 1: Backend — PdfDoc model + slug service

**Files:**
- Create: `backend/src/models/PdfDoc.ts`
- Create: `backend/src/services/pdfDocs.ts`
- Test: `backend/test/pdf-slug.test.ts`

**Interfaces:**
- Produces: `PdfDocModel` (Mongoose model); `slugifyTitle(title: string): string`; `deriveUniqueSlug(title: string, excludeId?: string): Promise<string>`.

- [ ] **Step 1: Write the failing test** — `backend/test/pdf-slug.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { slugifyTitle } from "../src/services/pdfDocs";

describe("slugifyTitle", () => {
  it("kebab-cases a title", () => {
    expect(slugifyTitle("NKP Install Guide")).toBe("nkp-install-guide");
  });
  it("strips punctuation and collapses separators", () => {
    expect(slugifyTitle("  Day-2 Ops: Backup & Restore!  ")).toBe("day-2-ops-backup-restore");
  });
  it("returns empty string when nothing survives", () => {
    expect(slugifyTitle("!!!")).toBe("");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run test/pdf-slug.test.ts`
Expected: FAIL — cannot resolve `../src/services/pdfDocs`.

- [ ] **Step 3: Write the model** — `backend/src/models/PdfDoc.ts`

```ts
import { Schema, model, type InferSchemaType } from "mongoose";

// PDF documentation entry (Phase 6). Metadata only — the PDF binary lives on an
// S3-compatible store (Nutanix Objects); `url` is the directly-loadable object
// URL, stored as plain text. No upload/presigning happens here.
const pdfDocSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    summary: { type: String, default: "", trim: true },
    url: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type PdfDoc = InferSchemaType<typeof pdfDocSchema>;
export const PdfDocModel = model("PdfDoc", pdfDocSchema);
```

- [ ] **Step 4: Write the service** — `backend/src/services/pdfDocs.ts`

```ts
import { PdfDocModel } from "../models/PdfDoc";

// Pure: title -> kebab slug. Empty string if nothing survives (caller supplies a fallback).
export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// DB-aware: returns a slug unique across PdfDocs. Appends -2, -3, ... on collision.
// `excludeId` lets an update keep its own slug.
export async function deriveUniqueSlug(title: string, excludeId?: string): Promise<string> {
  const base = slugifyTitle(title) || "doc";
  let slug = base;
  let n = 2;
  for (;;) {
    const existing = await PdfDocModel.findOne({ slug }).lean();
    if (!existing || (excludeId && String(existing._id) === excludeId)) return slug;
    slug = `${base}-${n++}`;
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd backend && npx vitest run test/pdf-slug.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Typecheck**

Run: `cd backend && npm run typecheck`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add backend/src/models/PdfDoc.ts backend/src/services/pdfDocs.ts backend/test/pdf-slug.test.ts
git commit -m "$(cat <<'EOF'
feat(backend): add PdfDoc model + slug service

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Backend — public list + admin CRUD routes

**Files:**
- Create: `backend/src/routes/docs.ts`
- Create: `backend/src/routes/admin/docs.ts`
- Modify: `backend/src/app.ts` (add two imports + two `app.use` mounts near lines 22-30)
- Test: `backend/test/pdf-docs.test.ts`

**Interfaces:**
- Consumes: `PdfDocModel`, `deriveUniqueSlug` (Task 1); `requireAuth`, `requireAdmin` from `../../middleware/auth`.
- Produces HTTP API:
  - `GET /api/docs/pdfs` → `200 [{ slug, title, summary, url, order }]` (public).
  - `GET /api/admin/docs` → `200 [{ id, slug, title, summary, url, order }]` (admin).
  - `POST /api/admin/docs` `{ title, summary?, url, order? }` → `201 {id,...}` | `400 {error}`.
  - `PATCH /api/admin/docs/:id` (partial) → `200 {id,...}` | `400` | `404`.
  - `DELETE /api/admin/docs/:id` → `204` | `404`.

- [ ] **Step 1: Write the failing test** — `backend/test/pdf-docs.test.ts`

```ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { Express } from "express";
import type { Agent } from "supertest";
import request from "supertest";
import { setup, teardown, loginAs, createUser, ADMIN } from "./helpers/harness";

let app: Express;
let adminAgent: Agent;

beforeAll(async () => {
  app = await setup();
  adminAgent = await loginAs(app, ADMIN.username, ADMIN.password);
});

afterAll(async () => {
  await teardown();
});

describe("admin PDF docs CRUD", () => {
  it("creates a doc with a derived slug", async () => {
    const res = await adminAgent
      .post("/api/admin/docs")
      .send({ title: "NKP Install Guide", url: "https://objects.example.com/a.pdf", order: 1 });
    expect(res.status).toBe(201);
    expect(res.body.slug).toBe("nkp-install-guide");
    expect(res.body.id).toBeTruthy();
  });

  it("suffixes the slug on a title collision", async () => {
    const res = await adminAgent
      .post("/api/admin/docs")
      .send({ title: "NKP Install Guide", url: "https://objects.example.com/b.pdf" });
    expect(res.status).toBe(201);
    expect(res.body.slug).toBe("nkp-install-guide-2");
  });

  it("rejects an empty title", async () => {
    const res = await adminAgent
      .post("/api/admin/docs")
      .send({ title: "   ", url: "https://objects.example.com/c.pdf" });
    expect(res.status).toBe(400);
  });

  it("rejects a non-http(s) url", async () => {
    const res = await adminAgent
      .post("/api/admin/docs")
      .send({ title: "Bad", url: "ftp://nope" });
    expect(res.status).toBe(400);
  });

  it("deletes a doc", async () => {
    const created = await adminAgent
      .post("/api/admin/docs")
      .send({ title: "Temp Doc", url: "https://objects.example.com/d.pdf" });
    const del = await adminAgent.delete(`/api/admin/docs/${created.body.id}`);
    expect(del.status).toBe(204);
    const missing = await adminAgent.delete(`/api/admin/docs/${created.body.id}`);
    expect(missing.status).toBe(404);
  });
});

describe("public PDF docs list", () => {
  it("GET /api/docs/pdfs is public and sorted by order", async () => {
    const res = await request(app).get("/api/docs/pdfs");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const orders = res.body.map((d: { order: number }) => d.order);
    expect([...orders]).toEqual([...orders].sort((a, b) => a - b));
    // public DTO carries no id
    expect(res.body[0]).not.toHaveProperty("id");
  });
});

describe("RBAC on /api/admin/docs", () => {
  it("rejects a user-role account with 403", async () => {
    await createUser(adminAgent, "docs-user", "docsuserpass1", "user");
    const userAgent = await loginAs(app, "docs-user", "docsuserpass1");
    const res = await userAgent
      .post("/api/admin/docs")
      .send({ title: "Nope", url: "https://objects.example.com/e.pdf" });
    expect(res.status).toBe(403);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run test/pdf-docs.test.ts`
Expected: FAIL — routes not mounted (404s).

- [ ] **Step 3: Write the public route** — `backend/src/routes/docs.ts`

```ts
import { Router } from "express";
import { PdfDocModel } from "../models/PdfDoc";

export const docsRouter = Router();

docsRouter.get("/pdfs", async (_req, res) => {
  const docs = await PdfDocModel.find().sort({ order: 1, title: 1 }).lean();
  res.json(
    docs.map((d) => ({
      slug: d.slug,
      title: d.title,
      summary: d.summary,
      url: d.url,
      order: d.order,
    })),
  );
});
```

- [ ] **Step 4: Write the admin route** — `backend/src/routes/admin/docs.ts`

```ts
import { Router } from "express";
import { requireAuth, requireAdmin } from "../../middleware/auth";
import { PdfDocModel } from "../../models/PdfDoc";
import { deriveUniqueSlug } from "../../services/pdfDocs";

export const adminDocsRouter = Router();
adminDocsRouter.use(requireAuth, requireAdmin);

const URL_PATTERN = /^https?:\/\/.+/i;

interface DocFields {
  title?: string;
  summary?: string;
  url?: string;
  order?: number;
}

function toDto(d: { _id: unknown; slug: string; title: string; summary: string; url: string; order: number }) {
  return { id: String(d._id), slug: d.slug, title: d.title, summary: d.summary, url: d.url, order: d.order };
}

// Returns { value } on success or { error } on the first invalid field.
function validate(body: Record<string, unknown>, partial: boolean): { value: DocFields } | { error: string } {
  const out: DocFields = {};
  if (!partial || body.title !== undefined) {
    if (typeof body.title !== "string" || !body.title.trim()) return { error: "title is required" };
    out.title = body.title.trim();
  }
  if (body.summary !== undefined) {
    if (typeof body.summary !== "string") return { error: "summary must be a string" };
    out.summary = body.summary.trim();
  }
  if (!partial || body.url !== undefined) {
    if (typeof body.url !== "string" || !URL_PATTERN.test(body.url.trim())) {
      return { error: "url must be an http(s) URL" };
    }
    out.url = body.url.trim();
  }
  if (body.order !== undefined) {
    if (typeof body.order !== "number" || !Number.isInteger(body.order)) {
      return { error: "order must be an integer" };
    }
    out.order = body.order;
  }
  return { value: out };
}

adminDocsRouter.get("/", async (_req, res) => {
  const docs = await PdfDocModel.find().sort({ order: 1, title: 1 }).lean();
  res.json(docs.map(toDto));
});

adminDocsRouter.post("/", async (req, res) => {
  const result = validate((req.body ?? {}) as Record<string, unknown>, false);
  if ("error" in result) {
    res.status(400).json({ error: result.error });
    return;
  }
  const slug = await deriveUniqueSlug(result.value.title!);
  const doc = await PdfDocModel.create({ ...result.value, slug });
  res.status(201).json(toDto(doc));
});

adminDocsRouter.patch("/:id", async (req, res) => {
  const result = validate((req.body ?? {}) as Record<string, unknown>, true);
  if ("error" in result) {
    res.status(400).json({ error: result.error });
    return;
  }
  const doc = await PdfDocModel.findById(req.params.id);
  if (!doc) {
    res.status(404).json({ error: "not found" });
    return;
  }
  Object.assign(doc, result.value);
  if (result.value.title !== undefined) {
    doc.slug = await deriveUniqueSlug(result.value.title, String(doc._id));
  }
  await doc.save();
  res.json(toDto(doc));
});

adminDocsRouter.delete("/:id", async (req, res) => {
  const doc = await PdfDocModel.findByIdAndDelete(req.params.id);
  if (!doc) {
    res.status(404).json({ error: "not found" });
    return;
  }
  res.status(204).end();
});
```

- [ ] **Step 5: Mount both routers in `backend/src/app.ts`**

Add to the import block near the other route imports:

```ts
import { docsRouter } from "./routes/docs";
import { adminDocsRouter } from "./routes/admin/docs";
```

Add the mounts alongside the existing `app.use(...)` calls (after the `adminSettingsRouter` line, before `meRouter`):

```ts
  app.use("/api/docs", docsRouter);
  app.use("/api/admin/docs", adminDocsRouter);
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd backend && npx vitest run test/pdf-docs.test.ts`
Expected: PASS (all cases).

- [ ] **Step 7: Full backend suite + typecheck (no regressions)**

Run: `cd backend && npm run typecheck && npm test`
Expected: pre-existing tests still pass; new file passes.

- [ ] **Step 8: Commit**

```bash
git add backend/src/routes/docs.ts backend/src/routes/admin/docs.ts backend/src/app.ts backend/test/pdf-docs.test.ts
git commit -m "$(cat <<'EOF'
feat(backend): PDF docs public list + admin CRUD routes

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Frontend — public Docs index merge + embedded viewer

**Files:**
- Modify: `frontend/src/lib/api.ts` (add DTO + `listPdfDocs`)
- Create: `frontend/src/pages/docs/mergeDocEntries.ts`
- Test: `frontend/src/pages/docs/mergeDocEntries.test.ts`
- Modify: `frontend/src/pages/docs/DocsIndexPage.tsx`
- Create: `frontend/src/pages/docs/PdfDocPage.tsx`
- Modify: `frontend/src/App.tsx` (lazy import + `/docs/pdf/:slug` route)

**Interfaces:**
- Consumes: `GET /api/docs/pdfs` (Task 2); `docsIndex`, `DocEntry` from `@/docs/registry`.
- Produces: `PdfDoc` type + `listPdfDocs()` in `api.ts`; `mergeDocEntries(mdx, pdfs)` + `IndexEntry` type.

- [ ] **Step 1: Add DTO + helper to `frontend/src/lib/api.ts`**

Append near the other exported helpers:

```ts
export interface PdfDoc {
  id?: string; // present only on admin responses
  slug: string;
  title: string;
  summary?: string;
  url: string;
  order: number;
}

export const listPdfDocs = () => api<PdfDoc[]>("/docs/pdfs");
```

- [ ] **Step 2: Write the failing test** — `frontend/src/pages/docs/mergeDocEntries.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { mergeDocEntries } from "./mergeDocEntries";
import type { DocEntry } from "@/docs/registry";
import type { PdfDoc } from "@/lib/api";

const mdx: DocEntry[] = [
  { slug: "getting-started", meta: { title: "Getting Started", summary: "Intro", order: 1 }, load: async () => ({ default: () => null }) },
];
const pdfs: PdfDoc[] = [
  { slug: "install", title: "Install Guide", summary: "PDF", url: "https://x/install.pdf", order: 0 },
];

describe("mergeDocEntries", () => {
  it("merges and sorts by order then title", () => {
    const out = mergeDocEntries(mdx, pdfs);
    expect(out.map((e) => e.slug)).toEqual(["install", "getting-started"]);
    expect(out[0].kind).toBe("pdf");
    expect(out[1].kind).toBe("mdx");
  });

  it("defaults a missing pdf summary to empty string", () => {
    const out = mergeDocEntries([], [{ slug: "s", title: "T", url: "https://x/s.pdf", order: 5 }]);
    expect(out[0].summary).toBe("");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/pages/docs/mergeDocEntries.test.ts`
Expected: FAIL — cannot resolve `./mergeDocEntries`.

- [ ] **Step 4: Write the helper** — `frontend/src/pages/docs/mergeDocEntries.ts`

```ts
import type { DocEntry } from "@/docs/registry";
import type { PdfDoc } from "@/lib/api";

export type IndexEntry = {
  kind: "mdx" | "pdf";
  slug: string;
  title: string;
  summary: string;
  order: number;
};

export function mergeDocEntries(mdx: DocEntry[], pdfs: PdfDoc[]): IndexEntry[] {
  return [
    ...mdx.map((d) => ({
      kind: "mdx" as const,
      slug: d.slug,
      title: d.meta.title,
      summary: d.meta.summary,
      order: d.meta.order,
    })),
    ...pdfs.map((d) => ({
      kind: "pdf" as const,
      slug: d.slug,
      title: d.title,
      summary: d.summary ?? "",
      order: d.order,
    })),
  ].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/pages/docs/mergeDocEntries.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Rewrite `frontend/src/pages/docs/DocsIndexPage.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { docsIndex } from '@/docs/registry'
import { listPdfDocs, type PdfDoc } from '@/lib/api'
import { mergeDocEntries } from './mergeDocEntries'

export function DocsIndexPage() {
  const [pdfDocs, setPdfDocs] = useState<PdfDoc[]>([])
  const [pdfError, setPdfError] = useState(false)

  useEffect(() => {
    listPdfDocs()
      .then(setPdfDocs)
      .catch(() => setPdfError(true))
  }, [])

  const entries = mergeDocEntries(docsIndex, pdfDocs)

  return (
    <div className="mx-auto max-w-[700px] px-lg py-section">
      <h1 className="text-h1 text-foreground">Documentation</h1>
      {pdfError && (
        <p className="mt-md text-body-sm text-muted-foreground">Couldn't load PDF documents.</p>
      )}
      <ul className="mt-xl flex flex-col gap-lg">
        {entries.map((doc) => (
          <li key={`${doc.kind}-${doc.slug}`}>
            <Link
              to={doc.kind === 'pdf' ? `/docs/pdf/${doc.slug}` : `/docs/${doc.slug}`}
              className="block rounded-lg border border-border bg-surface p-lg transition-shadow duration-[var(--duration-fast)] ease-standard hover:shadow"
            >
              <div className="flex items-center gap-sm">
                <h2 className="text-h4 text-foreground">{doc.title}</h2>
                {doc.kind === 'pdf' && (
                  <span className="rounded-full bg-primary/10 px-sm py-xxs text-body-sm font-medium text-primary">
                    PDF
                  </span>
                )}
              </div>
              <p className="mt-xxs text-body-sm text-muted-foreground">{doc.summary}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 7: Write the viewer** — `frontend/src/pages/docs/PdfDocPage.tsx`

```tsx
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { listPdfDocs, type PdfDoc } from '@/lib/api'

export function PdfDocPage() {
  const { slug } = useParams()
  const [doc, setDoc] = useState<PdfDoc | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'notfound'>('loading')

  useEffect(() => {
    listPdfDocs()
      .then((docs) => {
        const found = docs.find((d) => d.slug === slug) ?? null
        setDoc(found)
        setStatus(found ? 'ready' : 'notfound')
      })
      .catch(() => setStatus('notfound'))
  }, [slug])

  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-[700px] px-lg py-section">
        <p className="text-body text-muted-foreground">Loading…</p>
      </div>
    )
  }

  if (status === 'notfound' || !doc) {
    return (
      <div className="mx-auto max-w-[700px] px-lg py-section">
        <h1 className="text-h2 text-foreground">Doc not found</h1>
        <p className="mt-md text-body text-muted-foreground">No document matches "{slug}".</p>
        <Link to="/docs" className="mt-lg inline-block text-body text-primary">← All docs</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[900px] px-lg py-section">
      <Link to="/docs" className="text-body-sm text-primary">← All docs</Link>
      <h1 className="mt-md text-h1 text-foreground">{doc.title}</h1>
      {doc.summary && <p className="mt-xs text-body text-muted-foreground">{doc.summary}</p>}
      <a
        href={doc.url}
        target="_blank"
        rel="noreferrer"
        className="mt-lg inline-block text-body-sm text-primary"
      >
        Open in new tab ↗
      </a>
      <div className="mt-sm overflow-hidden rounded-lg border border-border shadow">
        <iframe title={doc.title} src={doc.url} className="h-[calc(100vh-320px)] min-h-[480px] w-full" />
      </div>
    </div>
  )
}
```

- [ ] **Step 8: Add the route in `frontend/src/App.tsx`**

Add the lazy import beside the other docs imports:

```tsx
const PdfDocPage = lazy(() => import("@/pages/docs/PdfDocPage").then((m) => ({ default: m.PdfDocPage })));
```

Inside the `<Route element={<PublicLayout />}>` block, add **before** the `/docs/:slug` route:

```tsx
<Route path="/docs/pdf/:slug" element={<Suspense fallback={<PageFallback />}><PdfDocPage /></Suspense>} />
```

- [ ] **Step 9: Typecheck + run new tests**

Run: `cd frontend && npm run typecheck && npx vitest run src/pages/docs/mergeDocEntries.test.ts`
Expected: typecheck clean; merge tests pass. (The 7 known frozen-surface failures are unrelated and untouched.)

- [ ] **Step 10: Commit**

```bash
git add frontend/src/lib/api.ts frontend/src/pages/docs/mergeDocEntries.ts frontend/src/pages/docs/mergeDocEntries.test.ts frontend/src/pages/docs/DocsIndexPage.tsx frontend/src/pages/docs/PdfDocPage.tsx frontend/src/App.tsx
git commit -m "$(cat <<'EOF'
feat(frontend): PDF docs in /docs index + embedded viewer

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Frontend — admin Documentation page

**Files:**
- Modify: `frontend/src/lib/api.ts` (admin CRUD helpers)
- Create: `frontend/src/pages/admin/DocsPage.tsx`
- Modify: `frontend/src/pages/admin/adminNav.tsx` (nav item)
- Modify: `frontend/src/App.tsx` (lazy import + `/admin/docs` route under `AdminRoute`)

**Interfaces:**
- Consumes: admin CRUD API (Task 2); `PdfDoc`, `ApiError` from `@/lib/api`; `AppShell`, `adminNav`, shadcn `Button`/`Input`/`Card`, `toast`.
- Produces: `listAdminPdfDocs`, `createPdfDoc`, `updatePdfDoc`, `deletePdfDoc` helpers; `DocsPage` component.

- [ ] **Step 1: Add admin CRUD helpers to `frontend/src/lib/api.ts`**

Append below `listPdfDocs`:

```ts
export const listAdminPdfDocs = () => api<PdfDoc[]>("/admin/docs");
export const createPdfDoc = (input: { title: string; summary?: string; url: string; order?: number }) =>
  api<PdfDoc>("/admin/docs", { method: "POST", body: JSON.stringify(input) });
export const updatePdfDoc = (
  id: string,
  input: Partial<{ title: string; summary: string; url: string; order: number }>,
) => api<PdfDoc>(`/admin/docs/${id}`, { method: "PATCH", body: JSON.stringify(input) });
export const deletePdfDoc = (id: string) => api<void>(`/admin/docs/${id}`, { method: "DELETE" });
```

- [ ] **Step 2: Write the admin page** — `frontend/src/pages/admin/DocsPage.tsx`

```tsx
import { useEffect, useState, type FormEvent } from "react";
import { AppShell } from "@/layouts/AppShell";
import { adminNav } from "./adminNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { FileText, Pencil, Trash2 } from "lucide-react";
import {
  listAdminPdfDocs,
  createPdfDoc,
  updatePdfDoc,
  deletePdfDoc,
  ApiError,
  type PdfDoc,
} from "@/lib/api";
import { toast } from "sonner";

type FormState = { title: string; summary: string; url: string; order: string };
const EMPTY: FormState = { title: "", summary: "", url: "", order: "0" };

export function DocsPage() {
  const [docs, setDocs] = useState<PdfDoc[]>([]);
  const [editing, setEditing] = useState<PdfDoc | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setDocs(await listAdminPdfDocs());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load documents");
    }
  }

  useEffect(() => {
    load();
  }, []);

  function startCreate() {
    setEditing(null);
    setForm(EMPTY);
    setError(null);
  }

  function startEdit(doc: PdfDoc) {
    setEditing(doc);
    setForm({ title: doc.title, summary: doc.summary ?? "", url: doc.url, order: String(doc.order) });
    setError(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const order = Number(form.order);
    if (!Number.isInteger(order)) {
      setError("Order must be a whole number");
      return;
    }
    const input = { title: form.title, summary: form.summary, url: form.url, order };
    try {
      if (editing?.id) {
        await updatePdfDoc(editing.id, input);
        toast.success("Document updated");
      } else {
        await createPdfDoc(input);
        toast.success("Document added");
      }
      startCreate();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    }
  }

  async function onDelete(doc: PdfDoc) {
    if (!doc.id) return;
    try {
      await deletePdfDoc(doc.id);
      toast.success("Document removed");
      if (editing?.id === doc.id) startCreate();
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Delete failed");
    }
  }

  return (
    <AppShell nav={adminNav} title="Documentation">
      <div className="mx-auto max-w-[820px] p-lg">
        <Card className="border-border/40 p-5 shadow-sm">
          <form onSubmit={onSubmit} className="flex flex-col gap-sm">
            <h2 className="text-h4 text-foreground">{editing ? "Edit document" : "Add PDF document"}</h2>
            <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Input placeholder="Summary (optional)" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
            <Input placeholder="https://objects.example.com/…/guide.pdf" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
            <Input type="number" placeholder="Order" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
            {error && <p className="text-body-sm text-destructive">{error}</p>}
            <div className="flex gap-sm">
              <Button type="submit">{editing ? "Save" : "Add document"}</Button>
              {editing && (
                <Button type="button" variant="outline" onClick={startCreate}>Cancel</Button>
              )}
            </div>
          </form>
        </Card>

        <ul className="mt-lg flex flex-col gap-sm">
          {docs.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between gap-sm rounded-lg border border-border bg-surface p-md">
              <div className="min-w-0">
                <div className="flex items-center gap-xs">
                  <FileText className="size-4 shrink-0 text-primary" />
                  <span className="truncate text-body font-medium text-foreground">{doc.title}</span>
                </div>
                <a href={doc.url} target="_blank" rel="noreferrer" className="block truncate text-body-sm text-muted-foreground hover:text-primary">
                  {doc.url}
                </a>
              </div>
              <div className="flex shrink-0 gap-xs">
                <Button size="sm" variant="outline" onClick={() => startEdit(doc)} aria-label="Edit">
                  <Pencil className="size-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => onDelete(doc)} aria-label="Delete">
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
```

- [ ] **Step 3: Add the nav item** — `frontend/src/pages/admin/adminNav.tsx`

Add `FileText` to the lucide import and append the nav entry:

```tsx
import { LayoutDashboard, Users, BookOpen, Server, MonitorSmartphone, KeyRound, Settings, FileText } from "lucide-react";
```

```tsx
  { label: "Documentation", to: "/admin/docs", icon: <FileText /> },
```

(Place it after "Labs" or before "Settings" — order is cosmetic.)

- [ ] **Step 4: Add the route in `frontend/src/App.tsx`**

Lazy import beside the other admin imports:

```tsx
const DocsPage = lazy(() => import("@/pages/admin/DocsPage").then((m) => ({ default: m.DocsPage })));
```

Inside the `<Route element={<AdminRoute />}>` block:

```tsx
<Route path="/admin/docs" element={<Suspense fallback={<AppFallback />}><DocsPage /></Suspense>} />
```

- [ ] **Step 5: Typecheck**

Run: `cd frontend && npm run typecheck`
Expected: no errors.

- [ ] **Step 6: Manual end-to-end verification**

Start dev infra + backend + frontend (`docker compose -f deploy/docker-compose.dev.yml up -d`, then `npm run dev` in each). As admin:
1. Go to `/admin/docs`, add a doc with a public PDF URL (any reachable `.pdf`).
2. Confirm it appears at `/docs` with a "PDF" chip, ordered by `order`.
3. Click it → `/docs/pdf/:slug` renders the embedded PDF + a working "Open in new tab" link.
4. Edit the title → slug/label update; delete → it disappears from `/docs`.
5. Log in as a `user`-role account → `/admin/docs` is not reachable (AdminRoute) and `/api/admin/docs` returns 403.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/lib/api.ts frontend/src/pages/admin/DocsPage.tsx frontend/src/pages/admin/adminNav.tsx frontend/src/App.tsx
git commit -m "$(cat <<'EOF'
feat(frontend): admin Documentation page for PDF docs

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Final verification

- [ ] `cd backend && npm run typecheck && npm test` — all green except unrelated pre-existing failures.
- [ ] `cd frontend && npm run typecheck && npm test` — new `mergeDocEntries` test green; the 7 known frozen-surface failures unchanged (do not "fix" them here).
- [ ] Manual flow (Task 4, Step 6) passes.

## Spec coverage check

- Data model → Task 1. Public + admin routes, validation, RBAC, slug uniqueness → Task 2. `/docs` merge + chip + non-fatal fetch failure + embedded viewer + fallback link → Task 3. Admin CRUD page + nav + route → Task 4. All spec success criteria map to a task.
