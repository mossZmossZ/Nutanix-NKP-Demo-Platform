# design-v2.md — Nutanix Prism-aligned design system (source of truth)

> **This file supersedes `design.md`.** The old violet spec is kept for reference only.
> Every UI decision maps here. Never inline hex in components — tokens only.
> Aligned with ds.nutanix.design (Prism): token hierarchy, type scale, component voice.

## 0. Identity

**Story.** Nutanix's product design language is *Prism*; the brand promise is
"infrastructure invisibility" — complexity fades, clarity remains. The platform reads as a
calm, light, dense enterprise console in Prism's own colors. The one expressive device is
the **prism edge**: a refraction gradient from interactive blue into iris.

**Feel.** Light-first on a cool `#ECF0F3` body, white working surfaces, compact Prism
density (14px body). Dark surfaces exist only where the product world demands them (RDP
desktop, terminals) and are indigo-tinted midnight, never generic near-black.

## 1. Color tokens

### 1.1 Raw palette (`:root`)

| Token | Value | Notes |
|---|---|---|
| `--color-iris-600` | `#7855FA` | **Primary.** Prism iris — buttons, focus ring, active states. |
| `--color-iris-700` | `#6344D6` | Primary hover/pressed. |
| `--color-iris-100` | `#EAE4FE` | Tint fill — selected rows, active nav bg, tab list bg. |
| `--color-iris-50`  | `#F5F2FF` | Faintest wash — inline code bg, callouts. |
| `--color-blue-600` | `#1B6EC5` | Interactive blue — links, tertiary/text buttons, info accents. |
| `--color-blue-100` | `#E1EDF9` | Info tint (banners, info badges). |
| `--color-ink-900`  | `#1F2532` | Primary text, headings. |
| `--color-ink-500`  | `#5F6B7E` | Muted text, helper copy, metadata. |
| `--color-line-200` | `#DCE1E8` | Borders, dividers, input outlines. |
| `--color-canvas`   | `#ECF0F3` | App page background (Prism body). |
| `--color-surface`  | `#FFFFFF` | Cards, panels, inputs, bars (`background-base`). |
| `--color-navy-900` | `#14192E` | Dark surface: RDP pane, terminals, hero mockup chrome. |
| `--color-navy-800` | `#1D2440` | Dark surface raised: terminal title bars, status strips. |
| `--color-navy-fg`  | `#C9CFE8` | Default text on dark surfaces. |
| `--color-success`  | `#188A42` | Functional only. |
| `--color-warning`  | `#F4B324` | Nutanix Yellow — functional warning/pending. |
| `--color-danger`   | `#AF2549` | Prism error crimson — destructive, offline, errors. |

### 1.2 Semantic mapping (`@theme`)

Same semantic token names as today — only values change:

| Semantic | Maps to |
|---|---|
| `--background` | `--color-canvas` |
| `--foreground` | `--color-ink-900` |
| `--card` / `--popover` | `--color-surface` |
| `--primary` | `--color-iris-600` (`--primary-foreground` stays `#FFFFFF`) |
| `--muted-foreground` | `--color-ink-500` |
| `--accent` | `--color-iris-100` |
| `--accent-foreground` | `--color-iris-600` |
| `--destructive` | `--color-danger` |
| `--border` / `--input` | `--color-line-200` |
| `--ring` | `--color-iris-600` |

Links and text-style buttons use `--color-blue-600` (Prism `color-text-link`), not iris —
iris is reserved for fills/active states; blue is the inline-interactive color.

Class-level fallout (implementers): `violet-*` utilities → `iris-*` equivalents
(`bg-violet-50` → `bg-iris-50`, `hover:bg-violet-700` → `hover:bg-iris-700`); markdown/
MDX link classes move to `text-blue-600`; `bg-ink-900` dark surfaces → `bg-navy-900`.

### 1.3 The prism edge (signature)

```css
--gradient-prism: linear-gradient(90deg, #1B6EC5 0%, #7855FA 100%);
```

Exactly **four sanctioned uses** — nowhere else:
1. **Active nav indicator** — 3px left bar (admin sidebar) / 2px underline (GlobalNav).
2. **Hero artifact edge** — 3px top border of the landing BrowserMockup frame.
3. **Progress bars** — lab progress fills (lab cards, GuidePane header bar).
4. **Live status accent** — 2px top edge of the RDP status strip when state=connected.

Never as text fill, button fill, large background, or borders of ordinary cards.

## 2. Typography (Prism scale)

Prism uses **one typeface** (Nutanix Soft, a Proxima Nova evolution — proprietary).
Free stand-in: **Mulish** (`@fontsource-variable/mulish`), the standard Proxima Nova
substitute. No italics anywhere (Prism rule). Mono: **Menlo stack** (system) — no package.

- `--font-sans: "Mulish Variable", "Mulish", system-ui, -apple-system, sans-serif`
- `--font-mono: Menlo, ui-monospace, "SF Mono", monospace`

| Token | Size/Line | Weight | Usage |
|---|---|---|---|
| `--text-display` | 40/48 | 700 | Marketing hero only. |
| `--text-h1` | 32/40 | 600 | Page titles. |
| `--text-h2` | 24/32 | 600 | Section headers, card titles. |
| `--text-h3` | 20/28 | 500 | Subsections. |
| `--text-h4` | 16/24 | 500 | Minor titles, list headers. |
| `--text-h5` | 14/20 | 600 | Small emphasized titles. |
| `--text-body-lg` | 16/24 | 400 | Primary/marketing copy. |
| `--text-body` | 14/21 | 400 | **Default UI text (Prism density).** |
| `--text-body-sm` | 12/18 | 400 | Secondary info, table meta. |
| `--text-label` | 12/16 | 500 | Form labels, eyebrows (uppercase + `tracking-[0.08em]`). |
| `--text-caption` | 10/14 | 400 | Timestamps, metadata. |
| `--text-button` | 14/20 | 500 | Buttons are always Medium 500 (Prism rule). |
| `--text-code` | 13/20 | 400 | Code blocks, terminal, credentials (mono). |

Stat numerals (dashboard hero): 600–700 weight, `font-variant-numeric: tabular-nums`.

## 3. Space, radius, elevation, motion

- Spacing ladder unchanged (4/8/12/17/24/32/48/80). Never `max-w-sm/md/lg/xl`
  (spacing-token collision) — use `max-w-[Nrem]`.
- **Radius (Prism-compact):** `--radius-sm: 4px` (buttons, inputs, badges/tags, chips),
  `--radius-md: 8px` (cards), `--radius-lg: 12px` (modals, hero panels), `--radius-full`
  (avatars, status dots, marketing hero CTAs only).
- Shadows: keep the four existing product shadows.
- Motion tokens and `prefers-reduced-motion` handling unchanged.

## 4. Components (shadcn, retinted not rebuilt)

- **Button** (Prism voice): label always Medium 500; **one primary action per page** —
  audit each surface, demote extra primaries to secondary. Primary
  `bg-primary hover:bg-iris-700`; secondary = white bg + `border-line-200`; ghost/tertiary
  = text-only in `text-blue-600`; destructive `bg-danger`. Radius 4px; compact height
  (32px default, 36px marketing).
- **Badge/tags**: radius 4px (not pill), status at 12% bg + solid text; warning-foreground
  `#8A6106` on the yellow tint; info badges use blue-100/blue-600.
- **Tabs / nav actives**: `bg-iris-100 text-iris-600`; prism indicator per §1.3.
- **Dialog overlay**: `bg-navy-900/40` (Prism `opacity-modal-underlay` 40%).
- **Inputs/Select**: white on canvas, 4px radius, focus = ring `--ring` + border-active.
- **SweetAlert2** (UsersPage, MachinesPage): confirm `#7855FA`, cancel `#5F6B7E`,
  destructive `#AF2549`.
- **xterm theme** (ConsoleTerminal): background `#14192E`, foreground `#C9CFE8`,
  cursor `#7855FA`.
- **Toasts (sonner)**: unchanged placement (top-right, max 3), retinted borders.
- **Tables (Entity Browser pattern)**: header row = label style uppercase muted; row
  hover `bg-iris-50`; expanded row `bg-canvas`; toolbar row above table (count + primary
  action right-aligned).

## 5. Per-surface direction

### Landing (`/`) — light hero, dark artifact
- Flip dark hero → light: canvas bg, ink headline (Mulish 700 display).
- Headline key phrase in `--color-iris-600`; **no gradient text** (old cyan→purple
  gradient title is retired).
- Split hero ≥1024px: copy left (eyebrow, display, lead, CTAs), BrowserMockup right;
  stacked below. Mockup chrome navy-900 + prism top edge (§1.3.2). Keep `useReveal`
  staggers and all BrowserMockup timing constants/state machine; terminal text colors
  move to navy palette.
- Section 2 stays quiet: white band, h2 + lead, generous `py-section`.

### Login (`/login`)
- Canvas bg, centered card `max-w-[24rem]`, radius-lg, shadow-md. Wordmark above card:
  8px prism-gradient square (part of the logo, not a fifth prism use).
- Keep: autoComplete attrs, `aria-invalid`, error `role="alert"`, authed redirect.

### Docs (`/docs`, `/docs/:slug`)
- Index cards: white surface, hover shadow-md lift. Doc/PDF viewer chrome bar navy-900
  with navy-fg text; keep lazy loading, iframe title, MDXProvider wiring.

### Lab access (`/lab-access`)
- Card grid unchanged structurally; progress fill = prism gradient (§1.3.3); difficulty
  badge per §4.

### Lab view (`/lab-access/:slug`) — "the console"
- **Do not restructure the pane tree.** Resizable split, lifted state, tab fallback,
  `session.attach` ref, localStorage persistence stay byte-compatible.
- GuidePane: light; sticky header surface bg + line border; progress bar = prism.
- RemotePanel: `bg-navy-900`; status strip `bg-navy-800`, machine name in mono;
  connected state shows prism top edge (§1.3.4); status dots keep semantic colors.
- CredentialsPanel: light card list; values in mono; YAML pre on `iris-50`.

### Admin (AppShell + 7 pages)
- **AppShell sidebar**: white surface, line-200 right border; active item =
  `bg-iris-100 text-iris-600` + 3px prism left bar (§1.3.1); "Workspace" label in
  eyebrow style. Topbar: white, h4-weight title.
- **Dashboard**: violet/purple hero gradient card → **navy-900 card**, navy-fg text,
  concurrent-users numeral 40px/700 tabular, iris "live" dot. Stat cards white with
  icon in iris-100 chip. Keep 30s polling untouched.
- **Users / Machines / tables**: Entity Browser voice per §4; keep table + expandable-row
  mechanics, Swal per §4. Machines in-card terminal mockups: navy palette.
- **Lab Management**: keep nested dialog stack exactly; pages editor textarea mono on
  `iris-50`.
- **Settings**: hero band gradient → flat navy-900 band; sticky save bar mechanics
  unchanged, white surface + shadow-lg.

## 6. Hard guardrails (redesign must not break)

1. Guacamole `session.attach` ref div (absolute inset-0) — unmount = disconnect.
2. react-resizable-panels v4: string `minSize` ("29%"/"33%"), manual localStorage
   persistence, keyboard-resize disabled, `defaultLayout` from `loadSplit()`.
3. Lifted `selectedFile` / `sessionTab` / `session` state in LabViewPage.
4. ConsoleTerminal WebSocket + FitAddon + ResizeObserver lifecycle.
5. Radix Dialog must close before SweetAlert2 opens; nested dialog stacking on Labs page.
6. 30s polling intervals (dashboard, machine health) — do not change cadence.
7. RBAC: AdminRoute/ProtectedRoute guards; role-conditional menus.
8. Login autoComplete/aria attributes; password generator (`crypto.getRandomValues`).
9. GuidePane `zoom` font scaling (12–24px), container queries, reloadKey retry.
10. Toaster config (top-right, `visibleToasts={3}`); dynamic footer year.
11. `prefers-reduced-motion` collapse stays global.

## 7. Copy voice

Prism content rules: plain verbs, sentence case, no filler, user-focused and concise.
Buttons state the action ("Save changes", "Assign machine"). Errors say what happened
and the next step; empty states invite the first action ("No machines yet — import one
to get started."). Consistent nouns: *lab*, *machine*, *assignment*, *credentials*.
