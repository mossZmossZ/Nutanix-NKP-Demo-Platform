# Phase 4c Lab View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the participant-facing "My Labs" list and a killer.sh-style split lab view
(guide left, tabbed Remote/Credentials panel right) against the already-complete `/api/me`
backend, with Guacamole deliberately deferred to Phase 5.

**Architecture:** Pure frontend addition. `LabAccessPage` swaps its mock array for
`GET /me/labs`. A new `/lab-access/:slug` route renders `LabViewPage`, which fetches
`GET /me/labs/:slug` and composes three new leaf components inside a resizable two-pane
layout: `GuidePane` (page list + markdown reader + progress), `CredentialsPanel` (RDP fields
+ copy), and `RemotePanel` (static placeholder). No backend changes.

**Tech Stack:** React 19 + TS + Tailwind (design.md tokens) + shadcn/radix primitives +
`react-markdown`/`remark-gfm`/`rehype-highlight` (new) + `react-resizable-panels` (new) +
Vitest + Testing Library (existing setup, no config changes beyond a ResizeObserver stub).

## Global Constraints

- **No inline hex, violet-only accent** (`design.md`) — every new class uses the existing
  Tailwind theme tokens (`text-foreground`, `bg-surface`, `text-primary`, spacing scale
  `xxs/xs/sm/md/lg/xl/xxl/section`, `text-h1..h4/body/body-sm/label/button`). Functional
  status colors (`success`/`warning`/`danger`) are reserved for genuine state, never
  decoration — syntax highlighting uses only `primary`/`foreground`/`muted-foreground`.
- **TypeScript strict** — no `any`, no unchecked casts beyond what existing code already does
  (e.g. the `Machine`-populate cast pattern in `me.ts`, which is backend and out of scope
  here).
- **No backend changes.** All required `/api/me/*` endpoints already exist and are correct
  for this scope (verified by reading `backend/src/routes/me.ts` during design).
- **Guacamole is out of scope.** The Remote tab is a static placeholder only — no `guacd`
  calls, no canvas, no new backend endpoint.
- **RBAC**: every new route sits inside the existing `<ProtectedRoute>` wrapper in
  `frontend/src/App.tsx` — do not add a new top-level unauthenticated route.
- Follow existing conventions: `api<T>()` wrapper from `frontend/src/lib/api.ts` for all
  requests (throws `ApiError` with `.status` on non-2xx), lazy-loaded routes via
  `React.lazy` + `Suspense` matching `App.tsx`'s existing pattern, tests live under
  `frontend/test/*.test.tsx` (not colocated under `src/`), mock `@/lib/api` via the
  `importOriginal` factory form (not blanket `vi.mock('@/lib/api')`) so `ApiError` stays a
  real class in tests.

---

### Task 1: Add frontend dependencies for markdown rendering and resizable panes

**Files:**
- Modify: `frontend/package.json`

**Interfaces:**
- Produces: `react-markdown` (default export `ReactMarkdown`, named type `Components`),
  `remark-gfm` (default export, remark plugin), `rehype-highlight` (default export, rehype
  plugin), `react-resizable-panels` (named exports `Panel`, `PanelGroup`,
  `PanelResizeHandle`) — all consumed by later tasks.

- [ ] **Step 1: Install the packages**

Run:
```bash
cd frontend && npm install react-markdown@^10.1.0 remark-gfm@^4.0.1 rehype-highlight@^7.0.2 react-resizable-panels@^4.12.1
```
Expected: `package.json` and `package-lock.json` gain the four new entries; install exits 0.

- [ ] **Step 2: Verify the existing build still passes**

Run: `cd frontend && npm run typecheck && npm run build`
Expected: both exit 0 (new deps don't touch any existing file yet, so this just confirms a
clean baseline before changes begin).

- [ ] **Step 3: Commit**

```bash
cd frontend && git add package.json package-lock.json
git commit -m "chore(frontend): add react-markdown, rehype-highlight, react-resizable-panels for Phase 4c lab view"
```

---

### Task 2: Shared CopyButton component

**Files:**
- Create: `frontend/src/components/CopyButton.tsx`
- Test: `frontend/test/copy-button.test.tsx`

**Interfaces:**
- Consumes: `Button` from `@/components/ui/button` (existing, `variant`/`className`/`onClick`
  props as read in `frontend/src/components/ui/button.tsx`).
- Produces: `CopyButton({ value: string; label: string })` — a button that copies `value` to
  the clipboard and briefly reflects a copied state. Used by Task 3 (code blocks) and Task 7
  (credential fields).

- [ ] **Step 1: Write the failing test**

```tsx
// frontend/test/copy-button.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { CopyButton } from '@/components/CopyButton'

test('copies the value to the clipboard and shows a confirmation state', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined)
  Object.assign(navigator, { clipboard: { writeText } })
  const user = userEvent.setup()

  render(<CopyButton value="secret-password" label="password" />)
  const button = screen.getByRole('button', { name: /copy password/i })

  expect(button.querySelector('[data-testid="copy-icon-state"]')).toHaveAttribute('data-copied', 'false')

  await user.click(button)

  expect(writeText).toHaveBeenCalledWith('secret-password')
  await waitFor(() =>
    expect(button.querySelector('[data-testid="copy-icon-state"]')).toHaveAttribute('data-copied', 'true'),
  )
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd frontend && npx vitest run test/copy-button.test.tsx`
Expected: FAIL — `Cannot find module '@/components/CopyButton'`.

- [ ] **Step 3: Write the implementation**

```tsx
// frontend/src/components/CopyButton.tsx
import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Button
      type="button"
      variant="ghost"
      aria-label={`Copy ${label}`}
      className="size-7 shrink-0 p-0"
      onClick={handleCopy}
    >
      <span data-testid="copy-icon-state" data-copied={copied}>
        {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
      </span>
    </Button>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd frontend && npx vitest run test/copy-button.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/CopyButton.tsx frontend/test/copy-button.test.tsx
git commit -m "feat(frontend): add shared CopyButton component"
```

---

### Task 3: Markdown rendering — component map + token-based code highlighting

**Files:**
- Create: `frontend/src/lib/markdown-components.tsx`
- Modify: `frontend/src/index.css` (append `.hljs-*` token mapping)
- Test: `frontend/test/markdown-components.test.tsx`

**Interfaces:**
- Consumes: `CopyButton` from `@/components/CopyButton` (Task 2).
- Produces: `markdownComponents: Components` (react-markdown's `Components` type) — consumed
  by `GuidePane` (Task 6) as the `components` prop of `<ReactMarkdown>`.

- [ ] **Step 1: Write the failing test**

```tsx
// frontend/test/markdown-components.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { vi } from 'vitest'
import { markdownComponents } from '@/lib/markdown-components'

const sample = '# Title\n\nSome *text*.\n\n```yaml\nkey: value\n```\n'

test('renders headings/paragraphs on design tokens and a copyable fenced code block', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined)
  Object.assign(navigator, { clipboard: { writeText } })

  render(
    <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
      {sample}
    </ReactMarkdown>,
  )

  const heading = screen.getByRole('heading', { level: 1, name: 'Title' })
  expect(heading).toHaveClass('text-h1')

  await userEvent.click(screen.getByRole('button', { name: /copy code/i }))
  expect(writeText).toHaveBeenCalledWith(expect.stringContaining('key: value'))
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd frontend && npx vitest run test/markdown-components.test.tsx`
Expected: FAIL — `Cannot find module '@/lib/markdown-components'`.

- [ ] **Step 3: Write the implementation**

```tsx
// frontend/src/lib/markdown-components.tsx
import type { ReactNode } from "react"
import type { Components } from "react-markdown"
import { CopyButton } from "@/components/CopyButton"

// Flattens a react-markdown element tree back to plain text so the copy
// button can copy the raw fenced-code content (rehype-highlight wraps
// tokens in nested <span>s, so children isn't already a plain string).
function textContent(node: ReactNode): string {
  if (typeof node === "string") return node
  if (typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(textContent).join("")
  if (node && typeof node === "object" && "props" in node) {
    const props = (node as { props?: { children?: ReactNode } }).props
    return textContent(props?.children)
  }
  return ""
}

// Same element-to-token mapping as frontend/src/docs/mdx-components.tsx (the
// build-time MDX pipeline), adapted for react-markdown's runtime `components`
// prop since guide pages are raw markdown fetched over HTTP, not compiled MDX.
export const markdownComponents: Components = {
  h1: (props) => <h1 className="mt-section first:mt-0 mb-lg text-h1 text-foreground" {...props} />,
  h2: (props) => <h2 className="mt-xl mb-md text-h2 text-foreground" {...props} />,
  h3: (props) => <h3 className="mt-lg mb-sm text-h3 text-foreground" {...props} />,
  p: (props) => <p className="my-md text-body text-foreground" {...props} />,
  a: (props) => <a className="text-primary underline-offset-2 hover:underline" {...props} />,
  ul: (props) => <ul className="my-md list-disc pl-lg text-body text-foreground [&_li]:mt-xs" {...props} />,
  ol: (props) => <ol className="my-md list-decimal pl-lg text-body text-foreground [&_li]:mt-xs" {...props} />,
  strong: (props) => <strong className="text-body font-semibold text-foreground" {...props} />,
  code: ({ className, ...props }) => (
    <code
      className={`rounded-sm bg-violet-50 px-xxs py-[2px] font-mono text-body-sm text-foreground ${className ?? ""}`}
      {...props}
    />
  ),
  pre: ({ children, ...props }) => (
    <pre
      className="group relative my-lg overflow-x-auto rounded-md border border-border bg-canvas p-lg font-mono text-body-sm text-foreground [&>code]:bg-transparent [&>code]:p-0 [&>code]:rounded-none [&>code]:text-inherit"
      {...props}
    >
      <span className="absolute right-sm top-sm opacity-0 transition-opacity duration-[var(--duration-fast)] ease-standard group-hover:opacity-100">
        <CopyButton value={textContent(children)} label="code" />
      </span>
      {children}
    </pre>
  ),
}
```

- [ ] **Step 4: Add token-based syntax highlight colors**

Append to the end of `frontend/src/index.css`:

```css

/* Phase 4c guide reader — rehype-highlight token colors. design.md is
   violet-only; syntax highlighting stays within primary/foreground/
   muted-foreground so it never reads as a second accent. */
.hljs-keyword,
.hljs-selector-tag,
.hljs-literal,
.hljs-title.function_ {
  color: var(--color-primary);
  font-weight: 600;
}
.hljs-string,
.hljs-attr,
.hljs-attribute {
  color: var(--color-foreground);
}
.hljs-comment {
  color: var(--color-muted-foreground);
  font-style: italic;
}
.hljs-number,
.hljs-symbol {
  color: var(--color-foreground);
  font-weight: 600;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd frontend && npx vitest run test/markdown-components.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/lib/markdown-components.tsx frontend/src/index.css frontend/test/markdown-components.test.tsx
git commit -m "feat(frontend): add runtime markdown renderer with token-based code highlighting"
```

---

### Task 4: Wire "My Labs" list to real data

**Files:**
- Modify: `frontend/src/pages/LabAccessPage.tsx` (full rewrite of the mock-data body)
- Test: `frontend/test/lab-access-page.test.tsx`

**Interfaces:**
- Consumes: `api<T>()` / `ApiError` from `@/lib/api`; `GET /me/labs` →
  `{id, lab:{slug,title,summary,difficulty,duration}, pageCount, completedCount}[]` (per
  `backend/src/routes/me.ts`).
- Produces: `LabAccessPage` — no exported types needed by other tasks (routing target
  `/lab-access/:slug` is a plain string literal, not an imported constant).

- [ ] **Step 1: Write the failing test**

```tsx
// frontend/test/lab-access-page.test.tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { LabAccessPage } from '@/pages/LabAccessPage'
import { api } from '@/lib/api'

vi.mock('@/auth/AuthContext', () => ({
  useAuth: () => ({ user: { username: 'alice', role: 'user' }, logout: vi.fn() }),
}))
vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>()
  return { ...actual, api: vi.fn() }
})

test('renders assigned labs with a progress label and a link into the lab view', async () => {
  vi.mocked(api).mockResolvedValueOnce([
    {
      id: 'a1',
      lab: { slug: 'nkp-basics', title: 'NKP Basics', summary: 'Intro lab', difficulty: 'Beginner', duration: '30 min' },
      pageCount: 4,
      completedCount: 1,
    },
  ])

  render(<MemoryRouter><LabAccessPage /></MemoryRouter>)

  expect(await screen.findByText('NKP Basics')).toBeInTheDocument()
  expect(screen.getByText('1 of 4 pages')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /open lab/i })).toHaveAttribute('href', '/lab-access/nkp-basics')
})

test('shows an empty state when there are no assigned labs', async () => {
  vi.mocked(api).mockResolvedValueOnce([])
  render(<MemoryRouter><LabAccessPage /></MemoryRouter>)
  expect(await screen.findByText(/no labs assigned yet/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd frontend && npx vitest run test/lab-access-page.test.tsx`
Expected: FAIL — the mock `labs` array in the current `LabAccessPage.tsx` always renders 3
hardcoded cards, so neither assertion matches (`api` is never called, so `mockResolvedValueOnce`
doesn't apply, and "1 of 4 pages" / "NKP Basics" text don't exist yet).

- [ ] **Step 3: Rewrite the implementation**

```tsx
// frontend/src/pages/LabAccessPage.tsx
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { AppShell, type NavItem } from "@/layouts/AppShell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ArrowRight, Clock, FlaskConical, Gauge } from "lucide-react"
import { api, ApiError } from "@/lib/api"

const nav: NavItem[] = [{ label: "My Labs", to: "/lab-access", icon: <FlaskConical /> }]

type LabSummary = {
  id: string
  lab: {
    slug: string
    title: string
    summary: string
    difficulty: "Beginner" | "Intermediate" | "Advanced"
    duration: string
  }
  pageCount: number
  completedCount: number
}

export function LabAccessPage() {
  const [labs, setLabs] = useState<LabSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api<LabSummary[]>("/me/labs")
      .then(setLabs)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load labs"))
  }, [])

  return (
    <AppShell nav={nav} title="Lab Access">
      {error ? (
        <p role="alert" className="text-body text-danger">
          {error}
        </p>
      ) : labs === null ? (
        <div className="grid gap-lg sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      ) : labs.length === 0 ? (
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-col items-center rounded-lg border border-border bg-surface px-xl py-xxl text-center shadow-sm">
            <h2 className="text-h3 text-foreground">No labs assigned yet</h2>
            <p className="mt-xs max-w-md text-body text-muted-foreground">
              Your labs will appear here once an admin assigns you a machine.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-xl">
          <div>
            <p className="text-label uppercase tracking-wide text-primary">Your workshops</p>
            <h2 className="mt-xxs text-h2 text-foreground">Available labs</h2>
            <p className="mt-xs text-body text-muted-foreground">
              Pick up where you left off or start a new hands-on lab.
            </p>
          </div>

          <div className="grid gap-lg sm:grid-cols-2 lg:grid-cols-3">
            {labs.map(({ id, lab, pageCount, completedCount }) => (
              <Card
                key={id}
                className="shadow-sm transition-[box-shadow,transform] duration-[var(--duration-fast)] ease-standard hover:-translate-y-px hover:shadow-md"
              >
                <CardHeader>
                  <div className="flex items-center gap-xs">
                    <FlaskConical className="size-4 shrink-0 text-muted-foreground" />
                    <CardTitle>{lab.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-sm">
                  <CardDescription>{lab.summary}</CardDescription>
                  <div className="flex flex-wrap items-center gap-sm text-body-sm text-muted-foreground">
                    <span className="flex items-center gap-xxs">
                      <Clock className="size-3.5 text-muted-foreground" />
                      {lab.duration}
                    </span>
                    <span className="flex items-center gap-xxs">
                      <Gauge className="size-3.5 text-muted-foreground" />
                      {lab.difficulty}
                    </span>
                  </div>
                  <div className="flex flex-col gap-xxs">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-accent">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: pageCount === 0 ? "0%" : `${(completedCount / pageCount) * 100}%` }}
                      />
                    </div>
                    <Badge variant="neutral">
                      {completedCount} of {pageCount} pages
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter className="justify-end">
                  <Button variant="primary" asChild>
                    <Link to={`/lab-access/${lab.slug}`}>
                      Open lab
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd frontend && npx vitest run test/lab-access-page.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/LabAccessPage.tsx frontend/test/lab-access-page.test.tsx
git commit -m "feat(frontend): wire My Labs list to GET /me/labs"
```

---

### Task 5: Tabs and Resizable UI primitives

**Files:**
- Create: `frontend/src/components/ui/tabs.tsx`
- Create: `frontend/src/components/ui/resizable.tsx`
- Modify: `frontend/test/setup.ts` (add a `ResizeObserver` stub — jsdom has none, and
  `react-resizable-panels` requires it)
- Test: `frontend/test/lab-view-primitives.test.tsx`

**Interfaces:**
- Consumes: `Tabs` (from the bundled `radix-ui` package — already a dependency, exports
  `Tabs`, confirmed via `node -e "console.log(Object.keys(require('radix-ui')))"`) for
  `tabs.tsx`; `react-resizable-panels` (Task 1) for `resizable.tsx`.
- Produces: `Tabs, TabsList, TabsTrigger, TabsContent` and `ResizablePanelGroup,
  ResizablePanel, ResizableHandle` — consumed by `LabViewPage` (Task 8).

- [ ] **Step 1: Add the ResizeObserver stub to test setup**

```ts
// frontend/test/setup.ts
import '@testing-library/jest-dom/vitest'

// jsdom has no ResizeObserver; react-resizable-panels needs one to mount.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}
```

- [ ] **Step 2: Write the failing test**

```tsx
// frontend/test/lab-view-primitives.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'

test('Tabs switches content when a trigger is clicked', async () => {
  render(
    <Tabs defaultValue="a">
      <TabsList>
        <TabsTrigger value="a">A</TabsTrigger>
        <TabsTrigger value="b">B</TabsTrigger>
      </TabsList>
      <TabsContent value="a">Content A</TabsContent>
      <TabsContent value="b">Content B</TabsContent>
    </Tabs>,
  )
  expect(screen.getByText('Content A')).toBeInTheDocument()
  await userEvent.setup().click(screen.getByRole('tab', { name: 'B' }))
  expect(screen.getByText('Content B')).toBeInTheDocument()
})

test('ResizablePanelGroup renders both panels and a drag handle', () => {
  render(
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={40}>Left</ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={60}>Right</ResizablePanel>
    </ResizablePanelGroup>,
  )
  expect(screen.getByText('Left')).toBeInTheDocument()
  expect(screen.getByText('Right')).toBeInTheDocument()
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `cd frontend && npx vitest run test/lab-view-primitives.test.tsx`
Expected: FAIL — `Cannot find module '@/components/ui/tabs'`.

- [ ] **Step 4: Write `tabs.tsx`**

```tsx
// frontend/src/components/ui/tabs.tsx
import * as React from "react"
import { Tabs as TabsPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

// design.md §4 — pill radius for the tab switcher, single accent on the
// active state. Mirrors dialog.tsx's pattern of wrapping the bundled
// `radix-ui` package's primitive rather than a per-primitive npm package.
function Tabs(props: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root data-slot="tabs" {...props} />
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn("inline-flex h-10 items-center gap-xxs rounded-full bg-accent p-[3px]", className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex items-center justify-center rounded-full px-md py-xs text-button text-muted-foreground outline-none transition-colors duration-[var(--duration-fast)] ease-standard",
        "data-[state=active]:bg-surface data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        "focus-visible:ring-[3px] focus-visible:ring-primary/12",
        className,
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content data-slot="tabs-content" className={cn("outline-none", className)} {...props} />
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
```

- [ ] **Step 5: Write `resizable.tsx`**

```tsx
// frontend/src/components/ui/resizable.tsx
import * as React from "react"
import * as ResizablePrimitive from "react-resizable-panels"
import { GripVertical } from "lucide-react"

import { cn } from "@/lib/utils"

function ResizablePanelGroup({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) {
  return (
    <ResizablePrimitive.PanelGroup
      data-slot="resizable-panel-group"
      className={cn("flex h-full w-full data-[panel-group-direction=vertical]:flex-col", className)}
      {...props}
    />
  )
}

function ResizablePanel(props: React.ComponentProps<typeof ResizablePrimitive.Panel>) {
  return <ResizablePrimitive.Panel data-slot="resizable-panel" {...props} />
}

function ResizableHandle({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle>) {
  return (
    <ResizablePrimitive.PanelResizeHandle
      data-slot="resizable-handle"
      className={cn(
        "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-4 after:-translate-x-1/2",
        "data-[resize-handle-state=hover]:bg-primary data-[resize-handle-state=drag]:bg-primary",
        className,
      )}
      {...props}
    >
      <div className="z-10 flex h-8 w-3.5 items-center justify-center rounded-sm border border-border bg-surface">
        <GripVertical className="size-3 text-muted-foreground" />
      </div>
    </ResizablePrimitive.PanelResizeHandle>
  )
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `cd frontend && npx vitest run test/lab-view-primitives.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/ui/tabs.tsx frontend/src/components/ui/resizable.tsx frontend/test/setup.ts frontend/test/lab-view-primitives.test.tsx
git commit -m "feat(frontend): add Tabs and Resizable UI primitives for the lab view"
```

---

### Task 6: GuidePane — page list, markdown reader, progress, navigation

**Files:**
- Create: `frontend/src/pages/lab-view/GuidePane.tsx`
- Test: `frontend/test/guide-pane.test.tsx`

**Interfaces:**
- Consumes: `api<T>()`/`ApiError` from `@/lib/api`; `markdownComponents` from
  `@/lib/markdown-components` (Task 3); `Button`/`Skeleton` from `@/components/ui/*`;
  `GET /me/labs/:slug/pages/:file` → `{file, content}`; `POST /me/labs/:slug/progress
  {file, completed}` → `{completedPages}` (both per `backend/src/routes/me.ts`).
- Produces: `GuidePane({ slug: string; pages: {file:string; order:number; title:string}[];
  completedPages: string[]; onProgressChange: (completedPages: string[]) => void })` —
  consumed by `LabViewPage` (Task 8).

- [ ] **Step 1: Write the failing test**

```tsx
// frontend/test/guide-pane.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { GuidePane } from '@/pages/lab-view/GuidePane'
import { api } from '@/lib/api'

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>()
  return { ...actual, api: vi.fn() }
})

const pages = [
  { file: '01-intro.md', order: 1, title: 'Introduction' },
  { file: '02-setup.md', order: 2, title: 'Setup' },
]

test('loads the first page, then navigates to the next page on click', async () => {
  vi.mocked(api)
    .mockResolvedValueOnce({ file: '01-intro.md', content: '# Introduction\n\nWelcome.' })
    .mockResolvedValueOnce({ file: '02-setup.md', content: '# Setup\n\nInstall things.' })

  render(<GuidePane slug="nkp-basics" pages={pages} completedPages={[]} onProgressChange={vi.fn()} />)

  expect(await screen.findByText('Welcome.')).toBeInTheDocument()
  expect(api).toHaveBeenCalledWith('/me/labs/nkp-basics/pages/01-intro.md')

  await userEvent.click(screen.getByRole('button', { name: /next/i }))

  expect(await screen.findByText('Install things.')).toBeInTheDocument()
  expect(api).toHaveBeenCalledWith('/me/labs/nkp-basics/pages/02-setup.md')
})

test('marking a page complete posts progress and reflects the returned state', async () => {
  vi.mocked(api)
    .mockResolvedValueOnce({ file: '01-intro.md', content: '# Introduction\n\nWelcome.' })
    .mockResolvedValueOnce({ completedPages: ['01-intro.md'] })

  const onProgressChange = vi.fn()
  render(<GuidePane slug="nkp-basics" pages={pages} completedPages={[]} onProgressChange={onProgressChange} />)

  await screen.findByText('Welcome.')
  await userEvent.click(screen.getByRole('button', { name: /mark complete/i }))

  await waitFor(() =>
    expect(api).toHaveBeenCalledWith('/me/labs/nkp-basics/progress', {
      method: 'POST',
      body: JSON.stringify({ file: '01-intro.md', completed: true }),
    }),
  )
  expect(onProgressChange).toHaveBeenCalledWith(['01-intro.md'])
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd frontend && npx vitest run test/guide-pane.test.tsx`
Expected: FAIL — `Cannot find module '@/pages/lab-view/GuidePane'`.

- [ ] **Step 3: Write the implementation**

```tsx
// frontend/src/pages/lab-view/GuidePane.tsx
import { useEffect, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import { Check, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { api, ApiError } from "@/lib/api"
import { markdownComponents } from "@/lib/markdown-components"

type Page = { file: string; order: number; title: string }

export function GuidePane({
  slug,
  pages,
  completedPages,
  onProgressChange,
}: {
  slug: string
  pages: Page[]
  completedPages: string[]
  onProgressChange: (completedPages: string[]) => void
}) {
  const [selectedFile, setSelectedFile] = useState<string | null>(pages[0]?.file ?? null)
  const [content, setContent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    if (!selectedFile) return
    setContent(null)
    setError(null)
    api<{ file: string; content: string }>(`/me/labs/${slug}/pages/${selectedFile}`)
      .then((res) => setContent(res.content))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load page"))
  }, [slug, selectedFile])

  const index = pages.findIndex((p) => p.file === selectedFile)
  const isComplete = selectedFile ? completedPages.includes(selectedFile) : false

  async function toggleComplete() {
    if (!selectedFile) return
    setToggling(true)
    try {
      const res = await api<{ completedPages: string[] }>(`/me/labs/${slug}/progress`, {
        method: "POST",
        body: JSON.stringify({ file: selectedFile, completed: !isComplete }),
      })
      onProgressChange(res.completedPages)
    } finally {
      setToggling(false)
    }
  }

  return (
    <div className="flex h-full">
      <nav className="w-48 shrink-0 overflow-y-auto border-r border-border bg-surface p-sm">
        <span className="block px-sm pt-xs pb-xxs text-label uppercase tracking-wide text-muted-foreground">
          Guide
        </span>
        {pages.map((page) => (
          <button
            key={page.file}
            type="button"
            onClick={() => setSelectedFile(page.file)}
            className={`flex w-full items-center gap-xs rounded-md px-sm py-xs text-left text-body-sm font-medium transition-colors duration-[var(--duration-base)] ease-standard ${
              page.file === selectedFile
                ? "bg-violet-100 text-violet-600"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            {completedPages.includes(page.file) ? (
              <Check className="size-3.5 shrink-0 text-success" />
            ) : (
              <span className="size-3.5 shrink-0" />
            )}
            <span className="truncate">{page.title}</span>
          </button>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto px-xl py-lg">
        {error ? (
          <p role="alert" className="text-body text-danger">
            {error}
          </p>
        ) : content === null ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <>
            <ReactMarkdown
              components={markdownComponents}
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
            >
              {content}
            </ReactMarkdown>

            <div className="mt-xl flex items-center justify-between gap-sm border-t border-border pt-lg">
              <Button
                type="button"
                variant="secondary"
                disabled={index <= 0}
                onClick={() => setSelectedFile(pages[index - 1].file)}
              >
                <ChevronLeft className="size-4" />
                Back
              </Button>
              <Button
                type="button"
                variant={isComplete ? "secondary" : "primary"}
                disabled={toggling}
                onClick={toggleComplete}
              >
                <Check className="size-4" />
                {isComplete ? "Completed" : "Mark complete"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={index === -1 || index >= pages.length - 1}
                onClick={() => setSelectedFile(pages[index + 1].file)}
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd frontend && npx vitest run test/guide-pane.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/lab-view/GuidePane.tsx frontend/test/guide-pane.test.tsx
git commit -m "feat(frontend): add GuidePane (page list, markdown reader, progress, next/back)"
```

---

### Task 7: CredentialsPanel and RemotePanel

**Files:**
- Create: `frontend/src/pages/lab-view/CredentialsPanel.tsx`
- Create: `frontend/src/pages/lab-view/RemotePanel.tsx`
- Test: `frontend/test/lab-view-panels.test.tsx`

**Interfaces:**
- Consumes: `CopyButton` from `@/components/CopyButton` (Task 2).
- Produces: `CredentialsPanel({ connection: {rdpHost, rdpPort, rdpUser, rdpPassword} })` and
  `RemotePanel()` — consumed by `LabViewPage` (Task 8).

- [ ] **Step 1: Write the failing test**

```tsx
// frontend/test/lab-view-panels.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { CredentialsPanel } from '@/pages/lab-view/CredentialsPanel'
import { RemotePanel } from '@/pages/lab-view/RemotePanel'

test('CredentialsPanel shows connection fields and copies a value on click', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined)
  Object.assign(navigator, { clipboard: { writeText } })

  render(
    <CredentialsPanel
      connection={{ rdpHost: '10.0.0.5', rdpPort: 3389, rdpUser: 'trainee', rdpPassword: 'hunter2' }}
    />,
  )

  expect(screen.getByText('10.0.0.5:3389')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: /copy password/i }))
  expect(writeText).toHaveBeenCalledWith('hunter2')
})

test('RemotePanel shows a coming-soon placeholder', () => {
  render(<RemotePanel />)
  expect(screen.getByText(/coming soon/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd frontend && npx vitest run test/lab-view-panels.test.tsx`
Expected: FAIL — `Cannot find module '@/pages/lab-view/CredentialsPanel'`.

- [ ] **Step 3: Write `CredentialsPanel.tsx`**

```tsx
// frontend/src/pages/lab-view/CredentialsPanel.tsx
import { CopyButton } from "@/components/CopyButton"

export function CredentialsPanel({
  connection,
}: {
  connection: { rdpHost: string; rdpPort: number; rdpUser: string; rdpPassword: string }
}) {
  const fields = [
    { label: "Host", value: `${connection.rdpHost}:${connection.rdpPort}` },
    { label: "Username", value: connection.rdpUser },
    { label: "Password", value: connection.rdpPassword },
  ]

  return (
    <div className="flex flex-col gap-md p-xl">
      <div>
        <h3 className="text-h4 text-foreground">Connection details</h3>
        <p className="mt-xxs text-body-sm text-muted-foreground">
          Use these credentials with your own RDP client to reach the lab desktop.
        </p>
      </div>
      {fields.map((field) => (
        <div key={field.label} className="flex flex-col gap-xxs rounded-md border border-border bg-surface p-md">
          <span className="text-label text-muted-foreground">{field.label}</span>
          <div className="flex items-center justify-between gap-sm">
            <span className="font-mono text-body tabular-nums text-foreground">{field.value}</span>
            <CopyButton value={field.value} label={field.label.toLowerCase()} />
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Write `RemotePanel.tsx`**

```tsx
// frontend/src/pages/lab-view/RemotePanel.tsx
import { MonitorOff } from "lucide-react"

export function RemotePanel() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-sm px-xl py-xxl text-center">
      <MonitorOff className="size-8 text-muted-foreground" />
      <h3 className="text-h4 text-foreground">Live desktop is coming soon</h3>
      <p className="max-w-sm text-body-sm text-muted-foreground">
        In-browser remote access lands in a later phase. In the meantime, connect with your own
        RDP client using the credentials on the Credentials tab.
      </p>
    </div>
  )
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd frontend && npx vitest run test/lab-view-panels.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/lab-view/CredentialsPanel.tsx frontend/src/pages/lab-view/RemotePanel.tsx frontend/test/lab-view-panels.test.tsx
git commit -m "feat(frontend): add CredentialsPanel and the Remote-tab placeholder"
```

---

### Task 8: LabViewPage shell — route, fetch, resizable split, tab composition

**Files:**
- Create: `frontend/src/pages/LabViewPage.tsx`
- Modify: `frontend/src/App.tsx` (add the lazy import + route)
- Test: `frontend/test/lab-view-page.test.tsx`

**Interfaces:**
- Consumes: `GuidePane` (Task 6), `CredentialsPanel`/`RemotePanel` (Task 7),
  `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` and
  `ResizablePanelGroup`/`ResizablePanel`/`ResizableHandle` (Task 5), `api<T>()`/`ApiError`
  from `@/lib/api`; `GET /me/labs/:slug` →
  `{id, lab:{slug,title,summary,difficulty,duration}, pages:{file,order,title}[],
  completedPages:string[], connection:{rdpHost,rdpPort,rdpUser,rdpPassword}}` (per
  `backend/src/routes/me.ts`), 404 on unassigned/unknown slug.
- Produces: `LabViewPage` — routed at `/lab-access/:slug` inside `<ProtectedRoute>`.

- [ ] **Step 1: Write the failing test**

```tsx
// frontend/test/lab-view-page.test.tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { vi } from 'vitest'
import { LabViewPage } from '@/pages/LabViewPage'
import { api, ApiError } from '@/lib/api'

vi.mock('@/auth/AuthContext', () => ({
  useAuth: () => ({ user: { username: 'alice', role: 'user' }, logout: vi.fn() }),
}))
vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>()
  return { ...actual, api: vi.fn() }
})

function renderAt(slug: string) {
  render(
    <MemoryRouter initialEntries={[`/lab-access/${slug}`]}>
      <Routes>
        <Route path="/lab-access/:slug" element={<LabViewPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

test('renders the guide rail and both tabs once the lab loads', async () => {
  vi.mocked(api).mockResolvedValueOnce({
    id: 'a1',
    lab: { slug: 'nkp-basics', title: 'NKP Basics', summary: '', difficulty: 'Beginner', duration: '30 min' },
    pages: [],
    completedPages: [],
    connection: { rdpHost: '10.0.0.5', rdpPort: 3389, rdpUser: 'trainee', rdpPassword: 'hunter2' },
  })

  renderAt('nkp-basics')

  expect(await screen.findByText('NKP Basics')).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: /remote/i })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: /credentials/i })).toBeInTheDocument()
})

test('shows a not-assigned message on 404', async () => {
  vi.mocked(api).mockRejectedValueOnce(new ApiError(404, 'lab not found'))
  renderAt('someone-elses-lab')
  expect(await screen.findByText(/lab not available/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd frontend && npx vitest run test/lab-view-page.test.tsx`
Expected: FAIL — `Cannot find module '@/pages/LabViewPage'`.

- [ ] **Step 3: Write the implementation**

```tsx
// frontend/src/pages/LabViewPage.tsx
import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { AppShell, type NavItem } from "@/layouts/AppShell"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { FlaskConical } from "lucide-react"
import { api, ApiError } from "@/lib/api"
import { GuidePane } from "./lab-view/GuidePane"
import { CredentialsPanel } from "./lab-view/CredentialsPanel"
import { RemotePanel } from "./lab-view/RemotePanel"

const nav: NavItem[] = [{ label: "My Labs", to: "/lab-access", icon: <FlaskConical /> }]

type LabDetail = {
  id: string
  lab: { slug: string; title: string; summary: string; difficulty: string; duration: string }
  pages: { file: string; order: number; title: string }[]
  completedPages: string[]
  connection: { rdpHost: string; rdpPort: number; rdpUser: string; rdpPassword: string }
}

export function LabViewPage() {
  const { slug } = useParams<{ slug: string }>()
  const [detail, setDetail] = useState<LabDetail | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    setDetail(null)
    setNotFound(false)
    setError(null)
    api<LabDetail>(`/me/labs/${slug}`)
      .then(setDetail)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true)
        } else {
          setError(err instanceof ApiError ? err.message : "Failed to load lab")
        }
      })
  }, [slug])

  function handleProgressChange(completedPages: string[]) {
    setDetail((d) => (d ? { ...d, completedPages } : d))
  }

  return (
    <AppShell nav={nav} title={detail?.lab.title ?? "Lab"}>
      <div className="-mx-xl -my-lg h-[calc(100vh-4rem)]">
        {notFound ? (
          <div className="mx-auto max-w-3xl px-xl py-xxl text-center">
            <h2 className="text-h3 text-foreground">Lab not available</h2>
            <p className="mt-xs text-body text-muted-foreground">
              You aren't assigned to this lab, or it doesn't exist.
            </p>
            <Link to="/lab-access" className="mt-lg inline-block text-body text-primary">
              ← Back to My Labs
            </Link>
          </div>
        ) : error ? (
          <p role="alert" className="p-xl text-body text-danger">
            {error}
          </p>
        ) : detail === null ? (
          <div className="flex h-full items-center justify-center">
            <Skeleton className="h-3/4 w-11/12" />
          </div>
        ) : (
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={40} minSize={25}>
              <GuidePane
                slug={detail.lab.slug}
                pages={detail.pages}
                completedPages={detail.completedPages}
                onProgressChange={handleProgressChange}
              />
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={60} minSize={30}>
              <Tabs defaultValue="remote" className="flex h-full flex-col">
                <TabsList className="m-sm w-fit shrink-0">
                  <TabsTrigger value="remote">Remote</TabsTrigger>
                  <TabsTrigger value="credentials">Credentials</TabsTrigger>
                </TabsList>
                <TabsContent value="remote" className="flex-1 overflow-y-auto">
                  <RemotePanel />
                </TabsContent>
                <TabsContent value="credentials" className="flex-1 overflow-y-auto">
                  <CredentialsPanel connection={detail.connection} />
                </TabsContent>
              </Tabs>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
    </AppShell>
  )
}
```

- [ ] **Step 4: Wire the route into `App.tsx`**

In `frontend/src/App.tsx`, add the lazy import next to the existing `LabAccessPage` one:

```tsx
const LabViewPage = lazy(() => import("@/pages/LabViewPage").then((m) => ({ default: m.LabViewPage })));
```

And add the route inside the existing `<ProtectedRoute />` block, directly after `/lab-access`:

```tsx
      <Route element={<ProtectedRoute />}>
        <Route path="/lab-access" element={<Suspense fallback={<AppFallback />}><LabAccessPage /></Suspense>} />
        <Route path="/lab-access/:slug" element={<Suspense fallback={<AppFallback />}><LabViewPage /></Suspense>} />
      </Route>
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd frontend && npx vitest run test/lab-view-page.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 6: Run the full frontend test suite and typecheck/build**

Run: `cd frontend && npm run test && npm run typecheck && npm run build`
Expected: all green — this is the first point every new file has been imported together, so
it also catches any cross-task wiring mistakes (e.g. a prop name mismatch between `GuidePane`
and `LabViewPage`).

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/LabViewPage.tsx frontend/src/App.tsx frontend/test/lab-view-page.test.tsx
git commit -m "feat(frontend): add LabViewPage split view and wire /lab-access/:slug route"
```

---

### Task 9: Manual end-to-end verification and TASKS.md update

**Files:**
- Modify: `TASKS.md` (check off the completed Phase 4c items)

No new code — this task exercises the real backend (the `/me/*` endpoints already existed
before this plan; this is the first time they're driven from a real UI) and closes out the
phase per `TASKS.md`'s stated checkpoint.

- [ ] **Step 1: Start dev infra and both apps**

```bash
docker compose -f deploy/docker-compose.dev.yml up -d
cd backend && npm run dev
```
In a second terminal:
```bash
cd frontend && npm run dev
```
Expected: backend on `:4000`, frontend dev server proxying `/api` to it (per
`frontend/vite.config.ts`).

- [ ] **Step 2: Seed data as the admin**

Log in as the seeded admin (`ADMIN_USER`/`ADMIN_PASSWORD` from `backend/.env`). In the admin
UI: create a lab (`/admin/labs`), import/create a machine (`/admin/machine-pool`), assign that
machine to a `user`-role account for the new lab (`/admin/lab-credentials`).

- [ ] **Step 3: Verify as the assigned user**

Log out, log in as that `user` account, go to `/lab-access`.
Expected: exactly the one assigned lab shows as a card with a `0 of N pages` progress badge
and an "Open lab" link.

- [ ] **Step 4: Verify the lab view**

Click "Open lab" → `/lab-access/<slug>`.
Expected: guide pane on the left lists the lab's pages and renders the first page's markdown;
clicking "Mark complete" shows a checkmark next to that page in the sidebar and persists
across a page reload (re-fetch `/lab-access/<slug>` — the checkmark should still be there,
proving the `POST /progress` call landed); Next/Back cycle through pages; the right panel
shows **Remote** (a "coming soon" placeholder, no console errors about guacd) and
**Credentials** (the real `rdpHost:rdpPort` / `rdpUser` / `rdpPassword`, each with a working
copy button — check the OS clipboard after clicking).

- [ ] **Step 5: Verify the unassigned case**

While still logged in as that user, navigate directly to a different, unassigned lab's slug
(`/lab-access/some-other-slug`).
Expected: "Lab not available" message, not a crash or an empty guide pane.

- [ ] **Step 6: Update `TASKS.md`**

In the "Phase 4 — Labs, Assignments & the participant experience" section, under **4c — User:
My Labs + killer.sh-style lab view**, check off:
```markdown
- [x] `LabAccessPage` (My Labs) wired to real assignments (replace mock array)
- [x] In-lab page (net-new): split view — guide left / desktop right; top tabs
      Remote | Credentials
- [x] Guide reader: file-backed multi-page, section rail, next/back, scroll,
      mark-as-complete per page, react-markdown, code + YAML highlight, copy buttons,
      image support
- [x] Credentials tab — the user's own RDP host/user/password with copy
- [x] ✅ Checkpoint: assigned user sees only their labs + creds; guide pages render with
      progress; unassigned user sees nothing
```
Add a note directly under the 4c heading that the **Remote** tab is a placeholder pending
Phase 5 (Guacamole), so the checkpoint's "guide pages render with progress" wording isn't
misread later as claiming a live desktop.

- [ ] **Step 7: Commit**

```bash
git add TASKS.md
git commit -m "docs: mark Phase 4c complete (guide/progress/credentials UI; Guacamole remains Phase 5)"
```

---

## Self-Review Notes

- **Spec coverage:** every "In" item from the design spec has a task — My Labs list (Task 4),
  routing (Task 8), split shell (Task 8), guide pane incl. page list/markdown/copy/mark-complete/
  next-back (Tasks 2, 3, 6), Credentials tab (Task 7), Remote placeholder (Task 7), new deps
  (Task 1), no backend changes (verified during design, not a task). Error/empty states from
  the spec's table are covered: no labs (Task 4), unassigned slug (Task 8), page fetch failure
  (Task 6), mark-complete failure (Task 6 — the `finally` resets `toggling`; an actual thrown
  error surfaces via the existing unhandled-rejection path same as `LabCredentialsPage`'s
  pattern, consistent with how the rest of the codebase handles action-button failures).
- **Placeholder scan:** no TBD/TODO left in any step; every code block is complete, not a
  sketch.
- **Type consistency:** `Page` (`GuidePane.tsx`) and the inline `pages` shape in
  `LabDetail` (`LabViewPage.tsx`) are structurally identical (`{file, order, title}`) —
  intentionally not a shared imported type, to avoid a forward dependency from Task 6 (built
  before Task 8's `LabViewPage` exists); TypeScript's structural typing makes this safe.
  `connection` shape matches between `LabViewPage`'s `LabDetail` and `CredentialsPanel`'s prop
  type. `onProgressChange(completedPages: string[])` signature matches between `GuidePane`'s
  prop declaration and `LabViewPage`'s `handleProgressChange`.
