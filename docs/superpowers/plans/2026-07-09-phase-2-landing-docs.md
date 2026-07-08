# Phase 2 — Landing + Docs (MDX) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the public marketing landing page and a public MDX-powered docs section, standing up the MDX pipeline the rest of the platform's lab guides will reuse.

**Architecture:** A **two-layout split** — a `PublicLayout` (black global-nav + footer) wraps the public routes (`/` landing, `/docs`, `/docs/:slug`); the authenticated app keeps its own chrome, with the Phase-1 home moved from `/` to `/home`. MDX compiles at build via `@mdx-js/rollup`; a build-time `import.meta.glob` over the repo-root `/docs-content` folder produces a slug→component registry with YAML frontmatter for the index. MDX is styled by an explicit `mdx-components.tsx` map wired to the existing DESIGN.md tokens (no `@tailwindcss/typography`). Landing "product" visuals are pure CSS/HTML chrome mockups (no screenshots exist yet).

**Tech Stack:** React 19 · react-router-dom v7 · Tailwind v4 (CSS-first `@theme`) · Vite 8 · `@mdx-js/rollup` + `@mdx-js/react` · `remark-frontmatter` + `remark-mdx-frontmatter` · `@fontsource-variable/inter` · Vitest + @testing-library/react + jsdom.

## Global Constraints

- **DESIGN.md is a spec.** Single accent = Action Blue `#0066cc` only. No second accent color. (verbatim: DESIGN.md "Don't introduce a second accent color".)
- **Never inline hex.** Reference DESIGN.md tokens as Tailwind utilities (`bg-primary`, `text-ink`, `rounded-pill`, `p-section`, `font-display`). All tokens already exist in `frontend/src/index.css`.
- **Font-weight ladder is 300 / 400 / 600 / 700 — weight 500 is deliberately absent.**
- **Exactly one shadow** (`--shadow-product`, utility `shadow-product`), reserved for the product mockup imagery — never on cards, buttons, or text.
- **Alternating full-bleed tiles** (light/parchment ↔ near-black), `rounded-none`, `p-section` (80px) vertical — the color change is the divider.
- **Pill CTAs only for actions** (`rounded-pill`). Two button grammars exist: `Button variant="primary"` and `variant="secondary"`.
- **Body copy is 17px / 400 / 1.47** (`text-body`), not 16px. Headlines are `font-display` 600 with negative tracking.
- **TypeScript strict.** Share DTO types where practical.
- **Version floors (do not downgrade):** React `^19.2.7`, react-router-dom `^7.18.1`, Tailwind `^4.3.2`, Vite `^8.1.1`.
- **Docs are public.** `/docs` and `/docs/:slug` live under `PublicLayout`, reachable logged-out.
- **`/docs-content` lives at repo root** (shared with Phase-4 lab guides via `Lab.mdxPath`).
- **Karpathy guidelines:** minimum code that solves the task; no speculative abstraction.

---

## File Structure

**Created:**
- `docs-content/getting-started.mdx` — the seeded doc (proves the pipeline).
- `frontend/src/docs/registry.ts` — build-time glob → `{ slug, meta, loader }[]` registry + `getDoc(slug)`.
- `frontend/src/docs/mdx-components.tsx` — element→token map + `Callout`, `Steps` authoring components; exported `mdxComponents`.
- `frontend/src/mdx.d.ts` — `declare module '*.mdx'` so TS understands MDX imports.
- `frontend/src/layouts/PublicLayout.tsx` — global-nav + `<Outlet/>` + footer.
- `frontend/src/components/site/GlobalNav.tsx` — black nav, Docs link, auth-state affordance.
- `frontend/src/components/site/Footer.tsx` — parchment footer.
- `frontend/src/components/site/BrowserMockup.tsx` — reusable CSS chrome mockup for landing tiles.
- `frontend/src/pages/LandingPage.tsx` — hero + 3 tiles.
- `frontend/src/pages/docs/DocsIndexPage.tsx` — lists registry entries.
- `frontend/src/pages/docs/DocPage.tsx` — renders one MDX doc, 404 fallback.
- `frontend/test/setup.ts` — jest-dom matchers.
- Test files under `frontend/test/` (one per logic task).

**Modified:**
- `frontend/package.json` — deps + `test` script.
- `frontend/vite.config.ts` — MDX plugin, react include, `server.fs.allow`, Vitest `test` block.
- `frontend/src/main.tsx` — import Inter font.
- `frontend/src/index.css` — Inter `ss03` feature setting (DESIGN.md tuning).
- `frontend/src/App.tsx` — new routes + PublicLayout + `/home`.
- `frontend/src/pages/HomePage.tsx` — logout redirect target `/home`; label stays.
- `frontend/src/pages/LoginPage.tsx` — post-login + already-authed redirect → `/home`.
- `TASKS.md` — check off Phase 2 items.

---

## Task 1: Tooling, dependencies & font wiring

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/vite.config.ts`
- Modify: `frontend/src/main.tsx`
- Modify: `frontend/src/index.css:250-254`
- Create: `frontend/src/mdx.d.ts`
- Create: `frontend/test/setup.ts`
- Test: `frontend/test/smoke.test.tsx`

**Interfaces:**
- Produces: a working `npm test` (Vitest + jsdom + testing-library), MDX compilation in Vite/Vitest, `server.fs.allow` widened to repo root, Inter loaded. Later tasks consume all of this.

- [ ] **Step 1: Install dependencies**

Run (from `frontend/`):
```bash
npm install @mdx-js/rollup @mdx-js/react remark-frontmatter remark-mdx-frontmatter @fontsource-variable/inter
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @types/mdx
```
Expected: both complete; `package.json` gains the deps.

- [ ] **Step 2: Add the `test` script**

In `frontend/package.json` `scripts`, add:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Wire vite.config.ts (MDX plugin + fs.allow + Vitest block)**

Replace `frontend/vite.config.ts` with:
```ts
/// <reference types="vitest/config" />
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import mdx from '@mdx-js/rollup'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // MDX must run before the React plugin so JSX it emits gets transformed.
    { enforce: 'pre', ...mdx({
      providerImportSource: '@mdx-js/react',
      remarkPlugins: [remarkFrontmatter, [remarkMdxFrontmatter, { name: 'frontmatter' }]],
    }) },
    react({ include: /\.(jsx|tsx|js|ts|mdx)$/ }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Single-origin dev: proxy the API so the auth cookie is first-party.
    proxy: {
      '/api': 'http://localhost:4000',
    },
    // Allow importing MDX from the repo-root /docs-content (outside the Vite root).
    fs: {
      allow: [path.resolve(__dirname, '..')],
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    css: false,
  },
})
```

- [ ] **Step 4: Create the test setup + MDX type declaration**

`frontend/test/setup.ts`:
```ts
import '@testing-library/jest-dom/vitest'
```

`frontend/src/mdx.d.ts`:
```ts
declare module '*.mdx' {
  import type { ComponentType } from 'react'
  export const frontmatter: Record<string, unknown>
  const MDXComponent: ComponentType<Record<string, unknown>>
  export default MDXComponent
}
```

- [ ] **Step 5: Import Inter and apply the DESIGN.md `ss03` tuning**

In `frontend/src/main.tsx`, add as the first import:
```ts
import '@fontsource-variable/inter'
```

In `frontend/src/index.css`, replace the trailing `body { … }` block (lines ~250-254) with:
```css
body {
  margin: 0;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /* DESIGN.md "Note on Font Substitutes": Inter ss03 approximates SF Pro's rounded a. */
  font-feature-settings: "ss03";
}
```

- [ ] **Step 6: Write the infra smoke test**

`frontend/test/smoke.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

test('testing-library + jsdom render an existing component', () => {
  render(<Button>Hello</Button>)
  expect(screen.getByRole('button', { name: 'Hello' })).toBeInTheDocument()
})
```

- [ ] **Step 7: Run the smoke test — verify infra boots**

Run: `npm test`
Expected: PASS (1 test). Proves Vitest + jsdom + jest-dom + the `@` alias all work.

- [ ] **Step 8: Verify build compiles with the MDX plugin**

Run: `npm run build`
Expected: succeeds (no MDX files yet, but the plugin chain must not break the build).

- [ ] **Step 9: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/vite.config.ts frontend/src/main.tsx frontend/src/index.css frontend/src/mdx.d.ts frontend/test/setup.ts frontend/test/smoke.test.tsx
git commit -m "chore(frontend): add MDX pipeline, Inter font, and Vitest infra"
```

---

## Task 2: Seed doc + docs registry (the loader logic)

**Files:**
- Create: `docs-content/getting-started.mdx`
- Create: `frontend/src/docs/registry.ts`
- Test: `frontend/test/docs-registry.test.ts`

**Interfaces:**
- Produces:
  - `type DocMeta = { title: string; summary: string; order: number }`
  - `type DocEntry = { slug: string; meta: DocMeta; load: () => Promise<{ default: React.ComponentType }> }`
  - `docsIndex: DocEntry[]` — sorted by `meta.order` then `slug`.
  - `getDoc(slug: string): DocEntry | undefined`
- Consumed by Task 6 (DocsIndexPage, DocPage).

- [ ] **Step 1: Create the seeded MDX doc**

`docs-content/getting-started.mdx`:
```mdx
---
title: Getting Started
summary: Set up your first NKP lab and connect to a remote desktop.
order: 1
---

# Getting Started

Welcome to the **Nutanix NKP Workshop Platform**. This guide walks you through
your first hands-on lab.

## Sign in

Your instructor creates your account. Sign in with the username and password you
were given — there is no public self-signup.

<Callout type="note">
Labs run entirely in your browser. You do not need to install anything locally.
</Callout>

## Open your lab

<Steps>
1. Open your assigned lab from the home page.
2. Read the guide in the left pane.
3. Switch to the **Remote** tab to reach the Linux desktop.
</Steps>

When you are done, use the **Credentials** tab to review your RDP details.
```

- [ ] **Step 2: Write the failing registry test**

`frontend/test/docs-registry.test.ts`:
```ts
import { docsIndex, getDoc } from '@/docs/registry'

test('registry lists the seeded getting-started doc with frontmatter', () => {
  const entry = docsIndex.find((d) => d.slug === 'getting-started')
  expect(entry).toBeDefined()
  expect(entry!.meta.title).toBe('Getting Started')
  expect(entry!.meta.summary).toMatch(/NKP lab/)
  expect(entry!.meta.order).toBe(1)
})

test('docsIndex is sorted by order then slug', () => {
  const orders = docsIndex.map((d) => d.meta.order)
  expect(orders).toEqual([...orders].sort((a, b) => a - b))
})

test('getDoc returns the entry for a known slug and undefined otherwise', () => {
  expect(getDoc('getting-started')?.slug).toBe('getting-started')
  expect(getDoc('does-not-exist')).toBeUndefined()
})

test('getDoc entry exposes a lazy component loader', async () => {
  const mod = await getDoc('getting-started')!.load()
  expect(typeof mod.default).toBe('function')
})
```

- [ ] **Step 3: Run it — verify it fails**

Run: `npx vitest run docs-registry`
Expected: FAIL — cannot resolve `@/docs/registry`.

- [ ] **Step 4: Implement the registry**

`frontend/src/docs/registry.ts`:
```ts
import type { ComponentType } from 'react'

export type DocMeta = { title: string; summary: string; order: number }
export type DocEntry = {
  slug: string
  meta: DocMeta
  load: () => Promise<{ default: ComponentType }>
}

// Build-time globs over the repo-root /docs-content folder (see vite fs.allow).
// One eager glob pulls ONLY the frontmatter export (for the index); a second
// lazy glob provides the compiled component on demand.
const metas = import.meta.glob<DocMeta>('../../../docs-content/*.mdx', {
  eager: true,
  import: 'frontmatter',
})
const loaders = import.meta.glob<{ default: ComponentType }>(
  '../../../docs-content/*.mdx',
)

function slugOf(path: string): string {
  return path.split('/').pop()!.replace(/\.mdx$/, '')
}

export const docsIndex: DocEntry[] = Object.entries(metas)
  .map(([path, meta]) => ({
    slug: slugOf(path),
    meta,
    load: loaders[path] as () => Promise<{ default: ComponentType }>,
  }))
  .sort((a, b) => a.meta.order - b.meta.order || a.slug.localeCompare(b.slug))

export function getDoc(slug: string): DocEntry | undefined {
  return docsIndex.find((d) => d.slug === slug)
}
```

- [ ] **Step 5: Run it — verify it passes**

Run: `npx vitest run docs-registry`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add docs-content/getting-started.mdx frontend/src/docs/registry.ts frontend/test/docs-registry.test.ts
git commit -m "feat(docs): add getting-started MDX and build-time docs registry"
```

---

## Task 3: MDX component map + authoring components

**Files:**
- Create: `frontend/src/docs/mdx-components.tsx`
- Test: `frontend/test/mdx-components.test.tsx`

**Interfaces:**
- Consumes: DESIGN.md token utilities (existing).
- Produces:
  - `mdxComponents` — an MDX `components` map (`h1`, `h2`, `h3`, `p`, `a`, `ul`, `ol`, `li`, `code`, `pre`, `strong`, `Callout`, `Steps`).
  - `Callout: ({ type?: 'note' | 'warning', children }) => JSX` — `type` defaults to `'note'`.
  - `Steps: ({ children }) => JSX`.
- Consumed by Task 6 (DocPage wraps MDX in `<MDXProvider components={mdxComponents}>`).

- [ ] **Step 1: Write the failing test**

`frontend/test/mdx-components.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { mdxComponents, Callout } from '@/docs/mdx-components'

test('h1 maps to the display token classes', () => {
  const H1 = mdxComponents.h1!
  render(<H1>Title</H1>)
  const h = screen.getByRole('heading', { level: 1, name: 'Title' })
  expect(h.className).toContain('font-display')
  expect(h.className).toContain('text-display-lg')
})

test('anchor maps to the single Action Blue text-link', () => {
  const A = mdxComponents.a!
  render(<A href="/x">link</A>)
  expect(screen.getByRole('link', { name: 'link' }).className).toContain('text-primary')
})

test('Callout defaults to note and renders its children', () => {
  render(<Callout>Heads up</Callout>)
  const box = screen.getByText('Heads up')
  expect(box).toBeInTheDocument()
})

test('Callout warning still uses only the primary accent family (no second color)', () => {
  const { container } = render(<Callout type="warning">Careful</Callout>)
  expect(container.innerHTML).not.toMatch(/#[0-9a-f]{6}/i) // no inline hex
})
```

- [ ] **Step 2: Run it — verify it fails**

Run: `npx vitest run mdx-components`
Expected: FAIL — cannot resolve `@/docs/mdx-components`.

- [ ] **Step 3: Implement the component map**

`frontend/src/docs/mdx-components.tsx`:
```tsx
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

// Every element maps to a DESIGN.md token — no inline hex, no weight 500.
export function Callout({
  type = 'note',
  children,
}: {
  type?: 'note' | 'warning'
  children: ReactNode
}) {
  // Single-accent system: both variants use the primary family; warning is
  // distinguished by a stronger left border weight, not a second color.
  const border = type === 'warning' ? 'border-l-[6px]' : 'border-l-[3px]'
  return (
    <div
      role="note"
      className={`my-lg ${border} border-primary bg-canvas-parchment rounded-sm px-lg py-md font-text text-body text-ink`}
    >
      {children}
    </div>
  )
}

export function Steps({ children }: { children: ReactNode }) {
  return (
    <div className="my-lg [&_ol]:list-decimal [&_ol]:pl-lg [&_li]:mt-xs font-text text-body text-ink">
      {children}
    </div>
  )
}

export const mdxComponents = {
  h1: (p: ComponentPropsWithoutRef<'h1'>) => (
    <h1 className="mt-section first:mt-0 mb-lg font-display text-display-lg text-ink" {...p} />
  ),
  h2: (p: ComponentPropsWithoutRef<'h2'>) => (
    <h2 className="mt-xl mb-md font-display text-display-md text-ink" {...p} />
  ),
  h3: (p: ComponentPropsWithoutRef<'h3'>) => (
    <h3 className="mt-lg mb-sm font-text text-tagline text-ink" {...p} />
  ),
  p: (p: ComponentPropsWithoutRef<'p'>) => (
    <p className="my-md font-text text-body text-ink" {...p} />
  ),
  a: (p: ComponentPropsWithoutRef<'a'>) => (
    <a className="text-primary underline-offset-2 hover:underline" {...p} />
  ),
  ul: (p: ComponentPropsWithoutRef<'ul'>) => (
    <ul className="my-md list-disc pl-lg font-text text-body text-ink [&_li]:mt-xs" {...p} />
  ),
  ol: (p: ComponentPropsWithoutRef<'ol'>) => (
    <ol className="my-md list-decimal pl-lg font-text text-body text-ink [&_li]:mt-xs" {...p} />
  ),
  strong: (p: ComponentPropsWithoutRef<'strong'>) => (
    <strong className="font-text text-body-strong text-ink" {...p} />
  ),
  code: (p: ComponentPropsWithoutRef<'code'>) => (
    <code className="rounded-xs bg-canvas-parchment px-xxs py-[2px] font-mono text-caption text-ink" {...p} />
  ),
  pre: (p: ComponentPropsWithoutRef<'pre'>) => (
    <pre className="my-lg overflow-x-auto rounded-md bg-surface-tile-1 p-lg font-mono text-caption text-on-dark" {...p} />
  ),
  Callout,
  Steps,
}
```

- [ ] **Step 4: Run it — verify it passes**

Run: `npx vitest run mdx-components`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/docs/mdx-components.tsx frontend/test/mdx-components.test.tsx
git commit -m "feat(docs): add DESIGN.md-tokened MDX component map + Callout/Steps"
```

---

## Task 4: Site chrome — GlobalNav, Footer, PublicLayout

**Files:**
- Create: `frontend/src/components/site/GlobalNav.tsx`
- Create: `frontend/src/components/site/Footer.tsx`
- Create: `frontend/src/layouts/PublicLayout.tsx`
- Test: `frontend/test/global-nav.test.tsx`

**Interfaces:**
- Consumes: `useAuth()` from `@/auth/AuthContext` (`{ user, logout }`).
- Produces: `GlobalNav`, `Footer`, `PublicLayout` (default-less named exports). `PublicLayout` renders `<GlobalNav/> <main><Outlet/></main> <Footer/>`.
- Consumed by Task 5 (routing).

- [ ] **Step 1: Write the failing nav auth-state test**

`frontend/test/global-nav.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { GlobalNav } from '@/components/site/GlobalNav'

const mockAuth = vi.fn()
vi.mock('@/auth/AuthContext', () => ({ useAuth: () => mockAuth() }))

function renderNav() {
  render(<MemoryRouter><GlobalNav /></MemoryRouter>)
}

test('shows a Sign in action linking to /login when logged out', () => {
  mockAuth.mockReturnValue({ user: null, logout: vi.fn() })
  renderNav()
  const signIn = screen.getByRole('link', { name: /sign in/i })
  expect(signIn).toHaveAttribute('href', '/login')
  expect(screen.queryByRole('button', { name: /sign out/i })).not.toBeInTheDocument()
})

test('shows the username and a Sign out action when logged in', () => {
  mockAuth.mockReturnValue({ user: { username: 'alice', role: 'user' }, logout: vi.fn() })
  renderNav()
  expect(screen.getByText('alice')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  expect(screen.queryByRole('link', { name: /^sign in$/i })).not.toBeInTheDocument()
})

test('always exposes a Docs link', () => {
  mockAuth.mockReturnValue({ user: null, logout: vi.fn() })
  renderNav()
  expect(screen.getByRole('link', { name: /docs/i })).toHaveAttribute('href', '/docs')
})
```

- [ ] **Step 2: Run it — verify it fails**

Run: `npx vitest run global-nav`
Expected: FAIL — cannot resolve `@/components/site/GlobalNav`.

- [ ] **Step 3: Implement GlobalNav**

`frontend/src/components/site/GlobalNav.tsx`:
```tsx
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'

// DESIGN.md component.global-nav: black bar, 44px, nav-link 12px.
export function GlobalNav() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function onSignOut() {
    await logout()
    navigate('/', { replace: true })
  }

  return (
    <header className="sticky top-0 z-50 h-[44px] bg-surface-black text-on-dark">
      <nav className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-lg">
        <div className="flex items-center gap-lg">
          <Link to="/" className="font-text text-nav-link text-on-dark">
            NKP Workshop
          </Link>
          <Link to="/docs" className="font-text text-nav-link text-on-dark hover:text-body-muted">
            Docs
          </Link>
        </div>

        <div className="flex items-center gap-md">
          {user ? (
            <>
              <span className="font-text text-nav-link text-body-muted">{user.username}</span>
              <button
                onClick={onSignOut}
                className="rounded-sm bg-ink px-[15px] py-[6px] font-text text-button-utility text-on-dark transition-transform active:scale-95"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-pill bg-primary px-[22px] py-[6px] font-text text-button-utility text-on-primary transition-transform active:scale-95"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}
```

- [ ] **Step 4: Implement Footer**

`frontend/src/components/site/Footer.tsx`:
```tsx
import { Link } from 'react-router-dom'

// DESIGN.md component.footer: parchment, ink-muted-80, fine-print legal row.
export function Footer() {
  return (
    <footer className="bg-canvas-parchment px-lg py-[64px] text-ink-muted-80">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-lg">
        <div className="flex gap-lg font-text text-caption">
          <Link to="/docs" className="text-primary">Docs</Link>
          <Link to="/login" className="text-primary">Sign in</Link>
        </div>
        <p className="font-text text-fine-print text-ink-muted-48">
          Nutanix NKP Workshop Platform. For authorized workshop use only.
        </p>
      </div>
    </footer>
  )
}
```

- [ ] **Step 5: Implement PublicLayout**

`frontend/src/layouts/PublicLayout.tsx`:
```tsx
import { Outlet } from 'react-router-dom'
import { GlobalNav } from '@/components/site/GlobalNav'
import { Footer } from '@/components/site/Footer'

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <GlobalNav />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
```

- [ ] **Step 6: Run it — verify it passes**

Run: `npx vitest run global-nav`
Expected: PASS (3 tests).

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/site/GlobalNav.tsx frontend/src/components/site/Footer.tsx frontend/src/layouts/PublicLayout.tsx frontend/test/global-nav.test.tsx
git commit -m "feat(site): add GlobalNav (auth-aware), Footer, and PublicLayout"
```

---

## Task 5: Routing — two-layout split, move authed home to /home

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/pages/HomePage.tsx:9-12`
- Modify: `frontend/src/pages/LoginPage.tsx:19,27`
- Test: `frontend/test/routing.test.tsx`

**Interfaces:**
- Consumes: `PublicLayout` (Task 4), `LandingPage`/`DocsIndexPage`/`DocPage` (Tasks 6–7). **NOTE:** this task imports pages built in Tasks 6–7. If executing strictly in order, create minimal placeholder page stubs first (Step 3a) and let Tasks 6–7 replace them; the placeholders keep the app buildable and this task's routing tests meaningful.
- Produces: route table — `/` (landing, public), `/docs`, `/docs/:slug`, `/home` (authed), `/login`, `/admin/users`.

- [ ] **Step 1: Write the failing routing test**

`frontend/test/routing.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import App from '@/App'

const mockAuth = vi.fn()
vi.mock('@/auth/AuthContext', () => ({
  useAuth: () => mockAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}))

function renderAt(path: string) {
  render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>)
}

test('logged-out visitor at / sees the public landing (Sign in present)', () => {
  mockAuth.mockReturnValue({ user: null, loading: false, logout: vi.fn() })
  renderAt('/')
  expect(screen.getAllByRole('link', { name: /sign in/i }).length).toBeGreaterThan(0)
})

test('authenticated visitor at / is redirected to /home', () => {
  mockAuth.mockReturnValue({ user: { username: 'alice', role: 'user' }, loading: false, logout: vi.fn() })
  renderAt('/')
  expect(screen.getByText(/signed in as alice/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run it — verify it fails**

Run: `npx vitest run routing`
Expected: FAIL — landing route/redirect not yet wired.

- [ ] **Step 3: Rewrite App.tsx with the two-layout split**

`frontend/src/App.tsx`:
```tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { AdminRoute, ProtectedRoute } from "@/components/RouteGuards";
import { PublicLayout } from "@/layouts/PublicLayout";
import { LandingPage } from "@/pages/LandingPage";
import { DocsIndexPage } from "@/pages/docs/DocsIndexPage";
import { DocPage } from "@/pages/docs/DocPage";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";
import { UsersPage } from "@/pages/admin/UsersPage";

function App() {
  return (
    <Routes>
      {/* Public marketing + docs share the PublicLayout chrome. */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/docs" element={<DocsIndexPage />} />
        <Route path="/docs/:slug" element={<DocPage />} />
      </Route>

      <Route path="/login" element={<LoginPage />} />

      {/* Authenticated app keeps its own chrome (AppLayout arrives in Phase 3). */}
      <Route element={<ProtectedRoute />}>
        <Route path="/home" element={<HomePage />} />
      </Route>

      <Route element={<AdminRoute />}>
        <Route path="/admin/users" element={<UsersPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
```

- [ ] **Step 3a (only if Tasks 6–7 not yet done): create placeholder stubs**

If `LandingPage`/`DocsIndexPage`/`DocPage` don't exist yet, create minimal stubs so the app builds; Tasks 6–7 overwrite them. Example `frontend/src/pages/LandingPage.tsx`:
```tsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
export function LandingPage() {
  const { user } = useAuth()
  if (user) return <Navigate to="/home" replace />
  return <a href="/login">Sign in</a>
}
```
And trivial stubs exporting `DocsIndexPage` / `DocPage` returning `null`.

- [ ] **Step 4: Point HomePage's logout at /home context and LoginPage redirects at /home**

In `frontend/src/pages/HomePage.tsx`, the logout already navigates to `/login` — leave it. No change required to HomePage logic; it now simply lives at `/home`. (Verify by reading; if any hard-coded `to="/"` home link exists, leave the "Manage users" link as-is.)

In `frontend/src/pages/LoginPage.tsx`:
- Line 19: change `if (user) return <Navigate to="/" replace />;` → `if (user) return <Navigate to="/home" replace />;`
- Line 27: change `navigate("/", { replace: true });` → `navigate("/home", { replace: true });`

- [ ] **Step 5: Run it — verify it passes**

Run: `npx vitest run routing`
Expected: PASS (2 tests). (Requires Task 6/7 real pages, or the Step 3a stubs.)

- [ ] **Step 6: Commit**

```bash
git add frontend/src/App.tsx frontend/src/pages/LoginPage.tsx frontend/test/routing.test.tsx
git commit -m "feat(routing): public landing/docs via PublicLayout; authed home -> /home"
```

---

## Task 6: Docs pages — index + single-doc renderer

**Files:**
- Create: `frontend/src/pages/docs/DocsIndexPage.tsx`
- Create: `frontend/src/pages/docs/DocPage.tsx`
- Test: `frontend/test/doc-page.test.tsx`

**Interfaces:**
- Consumes: `docsIndex`, `getDoc` (Task 2); `mdxComponents` (Task 3); `MDXProvider` from `@mdx-js/react`.
- Produces: `DocsIndexPage`, `DocPage`. `DocPage` reads `:slug`; unknown slug renders a "Not found" message (heading text `Doc not found`).

- [ ] **Step 1: Write the failing docs test**

`frontend/test/doc-page.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { DocsIndexPage } from '@/pages/docs/DocsIndexPage'
import { DocPage } from '@/pages/docs/DocPage'

test('docs index lists the getting-started entry', () => {
  render(<MemoryRouter><DocsIndexPage /></MemoryRouter>)
  expect(screen.getByRole('link', { name: /getting started/i }))
    .toHaveAttribute('href', '/docs/getting-started')
})

test('unknown slug renders a not-found message', () => {
  render(
    <MemoryRouter initialEntries={['/docs/nope']}>
      <Routes><Route path="/docs/:slug" element={<DocPage />} /></Routes>
    </MemoryRouter>,
  )
  expect(screen.getByRole('heading', { name: /doc not found/i })).toBeInTheDocument()
})

test('known slug lazy-renders the MDX content', async () => {
  render(
    <MemoryRouter initialEntries={['/docs/getting-started']}>
      <Routes><Route path="/docs/:slug" element={<DocPage />} /></Routes>
    </MemoryRouter>,
  )
  expect(await screen.findByRole('heading', { name: /getting started/i })).toBeInTheDocument()
})
```

- [ ] **Step 2: Run it — verify it fails**

Run: `npx vitest run doc-page`
Expected: FAIL — cannot resolve the docs pages.

- [ ] **Step 3: Implement DocsIndexPage**

`frontend/src/pages/docs/DocsIndexPage.tsx`:
```tsx
import { Link } from 'react-router-dom'
import { docsIndex } from '@/docs/registry'

export function DocsIndexPage() {
  return (
    <div className="mx-auto max-w-[700px] px-lg py-section">
      <h1 className="font-display text-display-lg text-ink">Documentation</h1>
      <ul className="mt-xl flex flex-col gap-lg">
        {docsIndex.map((doc) => (
          <li key={doc.slug}>
            <Link to={`/docs/${doc.slug}`} className="font-text text-body-strong text-primary">
              {doc.meta.title}
            </Link>
            <p className="mt-xxs font-text text-body text-ink-muted-80">{doc.meta.summary}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 4: Implement DocPage**

`frontend/src/pages/docs/DocPage.tsx`:
```tsx
import { Suspense, lazy, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MDXProvider } from '@mdx-js/react'
import { getDoc } from '@/docs/registry'
import { mdxComponents } from '@/docs/mdx-components'

export function DocPage() {
  const { slug } = useParams()
  const entry = slug ? getDoc(slug) : undefined

  const Doc = useMemo(
    () => (entry ? lazy(() => entry.load()) : null),
    [entry],
  )

  if (!entry || !Doc) {
    return (
      <div className="mx-auto max-w-[700px] px-lg py-section">
        <h1 className="font-display text-display-md text-ink">Doc not found</h1>
        <p className="mt-md font-text text-body text-ink-muted-80">
          No document matches “{slug}”.
        </p>
        <Link to="/docs" className="mt-lg inline-block font-text text-body text-primary">
          ← All docs
        </Link>
      </div>
    )
  }

  return (
    <article className="mx-auto max-w-[700px] px-lg py-section">
      <MDXProvider components={mdxComponents}>
        <Suspense fallback={<p className="font-text text-body text-ink-muted-48">Loading…</p>}>
          <Doc />
        </Suspense>
      </MDXProvider>
    </article>
  )
}
```

- [ ] **Step 5: Run it — verify it passes**

Run: `npx vitest run doc-page`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/docs/DocsIndexPage.tsx frontend/src/pages/docs/DocPage.tsx frontend/test/doc-page.test.tsx
git commit -m "feat(docs): docs index + MDX doc renderer with 404 fallback"
```

---

## Task 7: Landing page — hero + tiles + CSS chrome mockup

**Files:**
- Create: `frontend/src/components/site/BrowserMockup.tsx`
- Create/replace: `frontend/src/pages/LandingPage.tsx` (replaces Task 5 stub)
- Test: `frontend/test/landing.test.tsx`

**Interfaces:**
- Consumes: `useAuth()`; `Button` from `@/components/ui/button`; `Navigate`/`Link`.
- Produces: `LandingPage` — redirects authed users to `/home`; otherwise renders hero + 3 alternating tiles. `BrowserMockup` is a presentational CSS chrome component.

- [ ] **Step 1: Write the failing landing test**

`frontend/test/landing.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { LandingPage } from '@/pages/LandingPage'

const mockAuth = vi.fn()
vi.mock('@/auth/AuthContext', () => ({ useAuth: () => mockAuth() }))

test('renders the hero with a Sign in CTA to /login when logged out', () => {
  mockAuth.mockReturnValue({ user: null })
  render(<MemoryRouter><LandingPage /></MemoryRouter>)
  expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login')
})

test('redirects an authenticated user away from the landing', () => {
  mockAuth.mockReturnValue({ user: { username: 'alice', role: 'user' } })
  const { container } = render(<MemoryRouter><LandingPage /></MemoryRouter>)
  // Navigate renders nothing; the hero heading must be absent.
  expect(container.querySelector('h1')).toBeNull()
})
```

- [ ] **Step 2: Run it — verify it fails**

Run: `npx vitest run landing`
Expected: FAIL — real LandingPage not yet implemented (or stub lacks the hero).

- [ ] **Step 3: Implement BrowserMockup**

`frontend/src/components/site/BrowserMockup.tsx`:
```tsx
// Pure CSS "product" visual — a browser window showing the split lab UI
// (guide | terminal). Carries the single system shadow (DESIGN.md).
export function BrowserMockup() {
  return (
    <div className="mx-auto w-full max-w-[820px] overflow-hidden rounded-lg bg-canvas shadow-product">
      {/* title bar */}
      <div className="flex items-center gap-xs border-b border-hairline bg-canvas-parchment px-md py-sm">
        <span className="size-[10px] rounded-full bg-hairline" />
        <span className="size-[10px] rounded-full bg-hairline" />
        <span className="size-[10px] rounded-full bg-hairline" />
      </div>
      {/* split panes */}
      <div className="grid grid-cols-2">
        <div className="border-r border-hairline p-lg">
          <p className="font-display text-tagline text-ink">Lab 1 · Deploy NKP</p>
          <div className="mt-md space-y-xs">
            <div className="h-[8px] w-full rounded-pill bg-canvas-parchment" />
            <div className="h-[8px] w-4/5 rounded-pill bg-canvas-parchment" />
            <div className="h-[8px] w-3/5 rounded-pill bg-canvas-parchment" />
          </div>
        </div>
        <div className="bg-surface-tile-1 p-lg font-mono text-caption text-on-dark">
          <p>$ kubectl get nodes</p>
          <p className="text-body-muted">NAME STATUS ROLES</p>
          <p className="text-body-muted">nkp-1 Ready control-plane</p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Implement LandingPage**

`frontend/src/pages/LandingPage.tsx`:
```tsx
import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { Button } from '@/components/ui/button'
import { BrowserMockup } from '@/components/site/BrowserMockup'

export function LandingPage() {
  const { user } = useAuth()
  if (user) return <Navigate to="/home" replace />

  return (
    <>
      {/* Hero — parchment */}
      <section className="bg-canvas-parchment px-lg py-section text-center">
        <div className="mx-auto max-w-[820px]">
          <h1 className="font-display text-hero-display text-ink">Nutanix NKP Workshop</h1>
          <p className="mt-md font-display text-lead text-ink-muted-80">
            Hands-on Kubernetes labs, running in your browser.
          </p>
          <div className="mt-xl flex items-center justify-center gap-md">
            <Button asChild variant="primary">
              <Link to="/login">Sign in</Link>
            </Button>
            <Link to="/docs" className="font-text text-body text-primary">
              Read the docs →
            </Link>
          </div>
          <div className="mt-section">
            <BrowserMockup />
          </div>
        </div>
      </section>

      {/* Tile 2 — dark: the remote desktop story */}
      <section className="bg-surface-tile-1 px-lg py-section text-center text-on-dark">
        <div className="mx-auto max-w-[820px]">
          <h2 className="font-display text-display-lg text-on-dark">
            A full Linux desktop. In your browser.
          </h2>
          <p className="mt-md font-display text-lead text-body-muted">
            No installs, no SSH keys. Click your lab and you are on the machine —
            a real RDP desktop streamed to a browser tab.
          </p>
        </div>
      </section>

      {/* Tile 3 — light: the guided labs story */}
      <section className="bg-canvas px-lg py-section text-center">
        <div className="mx-auto max-w-[820px]">
          <h2 className="font-display text-display-lg text-ink">Guided labs, step by step.</h2>
          <p className="mt-md font-display text-lead text-ink-muted-80">
            Every lab pairs a written guide with the live machine beside it —
            read on the left, do on the right.
          </p>
        </div>
      </section>

      {/* Tile 4 — parchment: the provisioning story */}
      <section className="bg-canvas-parchment px-lg py-section text-center">
        <div className="mx-auto max-w-[820px]">
          <h2 className="font-display text-display-lg text-ink">Provisioned on demand.</h2>
          <p className="mt-md font-display text-lead text-ink-muted-80">
            Instructors spin up machines on Nutanix with Terraform and Ansible,
            then hand each learner their own credentials.
          </p>
        </div>
      </section>
    </>
  )
}
```

- [ ] **Step 5: Run it — verify it passes**

Run: `npx vitest run landing`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/site/BrowserMockup.tsx frontend/src/pages/LandingPage.tsx frontend/test/landing.test.tsx
git commit -m "feat(landing): Apple-style hero + alternating tiles with CSS mockup"
```

---

## Task 8: Full-suite verification, visual pass, TASKS.md

**Files:**
- Modify: `TASKS.md:25-28`

- [ ] **Step 1: Run the whole frontend test suite**

Run (from `frontend/`): `npm test`
Expected: PASS — all tests (smoke + registry + mdx-components + global-nav + routing + doc-page + landing), no failures.

- [ ] **Step 2: Typecheck + build (proves MDX pipeline end-to-end)**

Run: `npm run typecheck && npm run build`
Expected: both succeed; `dist/` produced; the getting-started MDX compiles as part of the build.

- [ ] **Step 3: Manual DESIGN.md visual pass**

Run: `npm run dev`, open the app, and check against this DESIGN.md do/don't checklist:
- [ ] `/` (logged out) shows the hero + 3 alternating tiles (parchment → dark → white → parchment); the color change is the only divider (no borders between tiles).
- [ ] The only accent color anywhere is Action Blue `#0066cc` (Sign in pill, links). No second accent.
- [ ] The `BrowserMockup` carries the one soft product shadow; no other element has a shadow.
- [ ] Headlines render in Inter (not a serif/Arial fallback) with tight tracking; body is 17px.
- [ ] Global nav is the black bar; logged out → "Sign in" pill; after login → username + "Sign out".
- [ ] `/docs` lists "Getting Started"; `/docs/getting-started` renders styled MDX incl. the `<Callout>` and `<Steps>`; `/docs/bogus` shows "Doc not found".
- [ ] Logging in redirects to `/home` (the "Signed in as …" page); visiting `/` while logged in redirects to `/home`.

- [ ] **Step 4: Update TASKS.md**

In `TASKS.md`, under `## Phase 2`, check the four items and drop the `◀◀◀ NEXT` marker:
```markdown
## Phase 2 — Landing + Docs (MDX)
- [x] MDX pipeline (`@mdx-js/rollup`) + shadcn typography
- [x] Apple-style landing page (DESIGN.md tiles/accent/pills)
- [x] Docs page rendering `/docs-content/*.mdx` + nav entry
- [x] ✅ Checkpoint: landing follows DESIGN.md rules; MDX renders styled
```
Move the `◀◀◀ NEXT` marker to the `## Phase 3` heading.

- [ ] **Step 5: Commit**

```bash
git add TASKS.md
git commit -m "docs: mark Phase 2 (landing + docs MDX) complete"
```

---

## Self-Review

**Spec coverage (PLAN.md Phase 2):**
- "MDX pipeline (`@mdx-js/rollup`) + shadcn typography" → Task 1 (plugin) + Task 3 (token'd component map, the "shadcn typography" equivalent). ✓
- "Apple-style landing page (DESIGN.md tiles/accent/pills)" → Task 7. ✓
- "Docs page rendering `.mdx` from `/docs-content` + nav entry" → Task 2 (registry from repo-root `/docs-content`) + Task 6 (pages) + Task 4 (Docs nav link). ✓
- "Checkpoint: landing matches DESIGN.md; MDX renders styled" → Task 8 visual pass + build. ✓
- Decisions from grilling — public landing at `/`, authed home → `/home`, two-layout split, Inter self-host, tier-B verification — all mapped to Tasks 1/4/5/8. ✓

**Placeholder scan:** No TBD/TODO. Every code step shows full content. The only intentional stub is Task 5 Step 3a (explicitly a temporary buildability bridge if executing out of order), overwritten by Tasks 6–7.

**Type consistency:** `DocEntry.load` / `DocMeta` (Task 2) used identically in Tasks 6. `mdxComponents` / `Callout` (Task 3) consumed in Task 6. `useAuth()` shape `{ user, logout }` matches `AuthContext.tsx`. `Button variant` values (`primary`/`secondary`) match `button.tsx`. Redirect target `/home` consistent across App/LoginPage/LandingPage.

**Note on execution order:** Tasks 6 and 7 provide pages that Task 5 imports. Recommended order if strict: 1 → 2 → 3 → 4 → 6 → 7 → 5 → 8, OR keep 1→8 and use the Task 5 Step 3a stubs. Subagent-driven execution should prefer the reordered sequence.
