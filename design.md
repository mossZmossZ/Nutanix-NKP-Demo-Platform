# design.md — NKP Workshop Platform Design System

**Single source of truth for all UI.** This file supersedes the previous Apple / Action-Blue
`DESIGN.md`. Everything visual — tokens, components, layout — derives from here. Never inline
a hex value in a component; map these tokens into the Tailwind theme and theme shadcn
components from them.

> **Precedence.** The per-page files in `design/` are *layout references only* — they show
> section rhythm and component grouping extracted from Figma kits. Their **token values
> (colors, fonts, radii) are overridden by this file.** When a page reference disagrees with a
> token here, this file wins.
>
> - [design/homepage.md](design/homepage.md) — public landing / marketing page layout
> - [design/login.md](design/login.md) — login page layout
> - [design/admin.md](design/admin.md) — admin dashboard shell + tables layout
> - [design/users.md](design/users.md) — user (Lab Access) dashboard layout

---

## 0. Identity in one line

A serious, modern developer-infrastructure product — a hands-on NKP lab platform in the
lineage of killer.sh / KodeKloud / Linux Foundation exams. It should read as **precise,
confident, and technical**, not playful. One decisive violet accent on a calm neutral canvas
does the identity work; everything else stays quiet.

**One accent rule.** Violet `#702DFF` is the *only* brand accent. Status colors (success /
warning / danger) exist for functional state only (lab online/offline, form errors) — never
as decoration or as a second CTA color.

---

## 1. Color

### Raw palette

| Token | Hex | Role |
|-------|-----|------|
| `violet-600` | `#702DFF` | **The** accent — primary buttons, active nav, focus rings, links |
| `violet-700` | `#6529E6` | Primary hover / pressed |
| `violet-100` | `#F0E5FC` | Accent tint — selected rows, active-nav background, subtle fills |
| `violet-50`  | `#F7F2FF` | Faintest accent wash — hero/section backgrounds |
| `ink-900`    | `#1C1C24` | Primary text, headings |
| `ink-500`    | `#6B6B78` | Muted text, helper copy, metadata |
| `line-200`   | `#E4E4EA` | Borders, dividers, input outlines |
| `canvas`     | `#F4F5F9` | App/dashboard page background |
| `surface`    | `#FFFFFF` | Cards, panels, inputs, top bar |
| `white`      | `#FFFFFF` | Marketing page background, text on accent |

### Status (functional only — not brand accents)

| Token | Hex | Use |
|-------|-----|-----|
| `success` | `#22C55E` | Lab/machine online, success toasts |
| `warning` | `#F59E0B` | Provisioning / pending state |
| `danger`  | `#EF4444` | Errors, destructive actions, offline |

### Semantic tokens (map these into Tailwind `@theme` / shadcn CSS vars)

```
--background          canvas   #F4F5F9   (app)   |  surface #FFFFFF (marketing)
--foreground          ink-900  #1C1C24
--card                surface  #FFFFFF
--card-foreground     ink-900  #1C1C24
--muted-foreground    ink-500  #6B6B78
--border              line-200 #E4E4EA
--input               line-200 #E4E4EA
--primary             violet-600 #702DFF
--primary-foreground  white    #FFFFFF
--accent              violet-100 #F0E5FC   (subtle tint surface)
--accent-foreground   violet-600 #702DFF
--ring                violet-600 #702DFF
--destructive         danger   #EF4444
--destructive-foreground white  #FFFFFF
```

> Every value above is a semantic token so a dark theme can be added later by re-pointing the
> variables — components must never hardcode the raw hex. Light-only for now.

---

## 2. Typography

**Inter** for everything (already installed — no new dependency). One family, carried by weight
and scale, keeps the product coherent and technical.

- **Weights:** 400 (body) · 500 (labels, buttons) · 600 (subheads) · 700 (headings/display).
- **Numerals:** use tabular figures (`font-variant-numeric: tabular-nums`) in tables, stats,
  and credential/monospace-adjacent contexts.
- **Code / credentials:** a monospace stack (`ui-monospace, "JetBrains Mono", monospace`) for
  RDP hosts, commands, and lab guide code blocks.

### Type ladder

| Role | Size / line-height | Weight | Where |
|------|--------------------|--------|-------|
| Display | 48 / 56 | 700 | Marketing hero only |
| H1 | 40 / 48 | 700 | Page titles |
| H2 | 32 / 40 | 700 | Section headers |
| H3 | 24 / 32 | 600 | Card / subsection titles |
| H4 | 20 / 28 | 600 | Small headers, dialog titles |
| Body-lg | 18 / 28 | 400 | Lead paragraphs, marketing body |
| Body | 16 / 24 | 400 | Default UI text |
| Body-sm | 14 / 20 | 400 | Table cells, secondary UI |
| Label | 13 / 16 | 500 | Form labels, eyebrows, badges (letter-spacing +0.02em, uppercase for eyebrows only) |
| Button | 16 / 20 | 500 | Button text |

---

## 3. Spacing, radius, elevation

**Spacing — 8px base.** `xs 4 · sm 8 · md 16 · lg 24 · xl 32 · 2xl 48 · 3xl 64`. Marketing
sections breathe wider (64–96px vertical); app/dashboard density is tighter (16–24px).

**Radius.** `sm 6` (chips, badges) · `md 8` (buttons, inputs, cards — the default) ·
`lg 12` (large panels, modals, dialogs) · `full 9999` (avatars, status pills, and marketing
hero CTAs only). App buttons use `md 8`; the pill is reserved for chips/avatars and the
marketing hero.

**Elevation — gentle, diffused, single-source.** Do not mix shadow styles.
- `shadow-sm` — buttons, chips, small overlays
- `shadow` — cards, dropdowns, standard floating surfaces
- `shadow-md` — elevated cards, side panels
- `shadow-lg` — modals, high-priority overlays

Cards on the dashboard sit on `canvas` and get a `line-200` border **or** `shadow`, not both
unless a hover raise is intended.

---

## 4. Components

All states below use semantic tokens; hex shown for reference only.

### Buttons

- **Primary** — `primary` fill, `primary-foreground` text, no border, radius `md`.
  Hover `violet-700`. Focus: 3px `ring` at 12% (`#702DFF1F`). Disabled: 40% opacity.
- **Secondary** — transparent fill, `foreground` text, 1px `border`, radius `md`.
  Hover `foreground`@4% fill. Focus: 1px `primary` border + 3px ring.
- **Ghost** — transparent, `muted-foreground` text, no border. Hover `foreground`@6% fill.
- **Destructive** — `destructive` fill, white text (confirm-delete only; never a primary path).

### Cards

- **Default** — `surface` fill, 1px `border`, radius `md`.
- **Elevated** — `surface` fill, `shadow`, radius `md` (hover raise for interactive cards).
- **Panel** — `surface` fill, subtle border, radius `lg` (large regions, modals).

### Inputs

- **Default** — `surface` fill, 1px `border`, `foreground` text, radius `md`.
- **Hover** — border darkens one step.
- **Focus** — 1px `primary` border + 3px `ring`@12%.
- **Error** — 1px `danger` border + 3px `danger`@12% ring; helper text in `danger`.
- **Disabled** — muted fill, `muted-foreground` text, 40% opacity.

### Badges / status pills

Radius `full`, `sm` label type. `success`/`warning`/`danger` tinted background (@12%) with the
solid color as text/dot. Used for lab & machine state.

### App shell (dashboard surfaces — Lab Access + Admin)

- Persistent **left sidebar** (`surface`, 1px right `border`); active item = `violet-100`
  background + `violet-600` text/indicator.
- **Top bar** (`surface`, 1px bottom `border`) with page title left, profile dropdown right.
- Content on `canvas` with `lg`/`xl` gutters; cards and tables grouped on `surface`.

### Tables (admin)

`surface` container, `line-200` row dividers, `body-sm` cells, tabular numerals, header row in
`label` type / `muted-foreground`. Row hover `foreground`@3%.

---

## 5. Layout principles

- Generous whitespace between sections; card-based grouping for related content.
- Maintain the 8px rhythm everywhere; don't invent one-off spacing.
- Keep `canvas` (page) and `surface` (card) visually distinct so grouping reads.
- Marketing homepage keeps an **alternating full-bleed tile** rhythm (light `white` / faint
  `violet-50` sections) as a layout device — this is independent of any dark theme.
- Reuse shared shell/components; new surfaces (Phase 4+) inherit this system rather than
  inventing their own look.

## 6. Motion

Professional-SaaS motion is **quiet, fast, and purposeful** — it confirms an action or guides
the eye, never decorates. When in doubt, less. One orchestrated moment (a page-load reveal)
beats scattered effects everywhere.

### Motion tokens

| Token | Duration | Use |
|-------|----------|-----|
| `fast` | 120ms | Hover, press, focus ring, small state flips |
| `base` | 200ms | Default — most enter/exit, dropdowns, tabs, toggles |
| `slow` | 320ms | Larger surfaces — modals, drawers, side panels |
| `page` | 400ms | Route change, hero/section reveals |

**Easing** (define as named CSS vars):
- `ease-standard` `cubic-bezier(0.2, 0, 0, 1)` — decelerate; default for enter/move.
- `ease-exit` `cubic-bezier(0.4, 0, 1, 1)` — accelerate; for exits/dismissals.
- `ease-emphasized` `cubic-bezier(0.2, 0, 0, 1.2)` — a subtle overshoot; primary CTA press,
  toast-in only. Use sparingly.

### Rules

- **Animate only `opacity` and `transform`** (GPU-composited). Never animate `width`,
  `height`, `top`, `left`, or box-shadow spread in loops — they cause layout thrash.
- **Distance is small:** reveals rise/settle **8–12px**, never more. This is a settle, not a fly-in.
- **Always respect `prefers-reduced-motion: reduce`** — collapse to an instant opacity fade
  (≤80ms) or no motion. This is a quality-floor requirement, not optional.
- **Enter decelerates, exit accelerates.** Exits are faster than enters.

### Where motion applies

| Surface | Motion |
|---------|--------|
| Buttons | `fast` — bg color + 1px press translate; focus ring fades in |
| Cards (interactive) | `fast` — `shadow` raise + 1px lift on hover |
| Nav / tabs | `base` — active indicator slides; row bg tint fades |
| Dropdowns / menus | `base` — scale `0.96→1` + fade, origin at trigger |
| Modals / drawers | `slow` — backdrop fade + panel rise/slide; exit on `ease-exit` |
| Toasts | `base` — slide-in + fade (`ease-emphasized`), auto-dismiss fade-out |
| Route change | `page` — outgoing fade-out, incoming fade + 8px rise |
| Marketing homepage | `page` — scroll-triggered reveal (fade + 12px rise), **staggered ~60ms**, plays **once** per element (IntersectionObserver, not scroll-jacking) |

> Library: prefer CSS transitions/keyframes and the View Transitions API for route changes.
> Reach for a JS animation lib only if a specific orchestration needs it — don't add one by default.

## 7. Performance & loading

A pro SaaS app feels instant because it ships little up front and never blocks on a spinner
that could be a skeleton. This is part of the design, not an afterthought.

### Code splitting / lazy loading

- **Route-level `React.lazy` + `Suspense`** for every top-level route (Login, Home, Lab Access,
  Admin, Docs). The initial bundle carries only the shell + current route.
- **MDX docs** load per-page (lazy), never all guides in the main bundle.
- **Heavy, rarely-first-paint modules load lazily** — e.g. the Guacamole client (Phase 5),
  charts, and any large admin table libs — behind their own `Suspense` boundary.
- **Prefetch on intent** (optional, light): warm a route's chunk on nav-link hover/focus so the
  click feels instant.

### Loading states

- **Skeletons over spinners** for content that has a known shape (dashboard cards, tables, lab
  lists). Skeleton = `line-200`/`canvas` blocks with a gentle shimmer (`base`×~7 loop,
  reduced-motion → static). Reserve the spinner for indeterminate, shapeless waits.
- **Suspense fallbacks are branded** — a shell with skeletons, not a blank screen or a raw
  spinner. The sidebar/top bar stay put; only the content region swaps.
- **No layout shift (CLS):** images and media carry explicit `width`/`height` (or aspect-ratio);
  skeletons occupy the final element's dimensions.

### Media

- Below-the-fold images `loading="lazy"` + `decoding="async"`; hero/LCP image eager.
- Prefer SVG/inline for icons and illustrations; compress raster assets.

## 8. Do / Don't

1. **Do** use `#702DFF` for key interactive emphasis only — one accent.
2. **Do** keep app backgrounds on `canvas` and cards on `surface`.
3. **Do** preserve strong readability with `ink-900` for core reading content.
4. **Do** keep radius/spacing rhythm consistent across repeated UI.
5. **Do** route every color/type/radius decision through a semantic token.
6. **Do** animate only `opacity`/`transform`, keep it fast, and honor `prefers-reduced-motion`.
7. **Do** lazy-load routes and show skeletons (not spinners) for known-shape content.
8. **Don't** introduce a second accent color or promote a status color to a CTA.
9. **Don't** inline hex in components — map tokens into the theme.
10. **Don't** mix shadow styles or double up border + shadow without a reason.
11. **Don't** over-animate — no long durations, big travel, scroll-jacking, or effects that
    replay on every scroll. One signature reveal, then calm.
12. **Don't** treat the `design/` page files as token sources — this file owns tokens.

---

*Derived by synthesizing the four `design/` Figma references into one coherent system:
accent unified to violet `#702DFF`, neutrals to a single ramp, type to Inter, radii to 8/12/pill;
motion + performance layered on for a professional-SaaS feel.*
