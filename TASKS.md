# Tasks

Living checklist. Mirrors the phases in `PLAN.md`. Check items off as they land; keep this in
sync with reality (it's the "current state" file).

## Phase 0 — Scaffold & dev loop
- [x] Monorepo dirs: `/frontend /backend /deploy` (`/infra`, `/docs-content` land in Phases 2/5)
- [x] Frontend: Vite + React 19 + TS + **Tailwind v4** + shadcn init
- [x] Map `DESIGN.md` tokens → Tailwind theme (via v4 CSS-first `@theme` in `src/index.css`)
- [x] Backend: Express + TS + Mongoose + `/api/health`
- [x] `deploy/docker-compose.dev.yml` (mongo + redis)
- [x] `.env.example` (root, comprehensive) + `backend/.env.example` (backend subset)
- [x] ✅ Checkpoint: frontend/backend typecheck+build green, compose validates, health route wired

## Phase 1 — Auth & RBAC
- [x] `User` model (`username`, `passwordHash`, `role`) — bcryptjs hashing
- [x] Seed static admin from `ADMIN_USER`/`ADMIN_PASSWORD` on boot (upsert every boot — env is source of truth)
- [x] JWT login (httpOnly cookie, 7-day, SameSite=Lax), `requireAuth`, `requireAdmin`; `/api/auth/{login,logout,me}`
- [x] Frontend: login page, auth context (`/me` on load), protected + admin routes, redirect on no JWT (Vite dev proxy → single-origin cookie)
- [x] Admin → Users: full CRUD (list/create/edit role+password/delete) with self-delete + last-admin guards
- [x] ✅ Checkpoint: admin logs in, `user` blocked from `/admin/*` (403), created user logs in — verified end-to-end through the Vite proxy
- [x] Backend test suite: vitest + supertest + mongodb-memory-server (`npm test`), 60 tests — smoke, auth/JWT tampering, RBAC, NoSQL-injection, CRUD guards

## Phase 2 — Landing + Docs (MDX)
- [x] MDX pipeline (`@mdx-js/rollup`) + shadcn typography
- [x] Apple-style landing page (DESIGN.md tiles/accent/pills)
- [x] Docs page rendering `/docs-content/*.mdx` + nav entry
- [x] ✅ Checkpoint: landing follows DESIGN.md rules; MDX renders styled

## Phase 3 — Web Design & UX/UI (the whole-app design pass) ✅ COMPLETE
> This is the **last** phase that designs UI. Phases 4+ are functional and have no design
> plan — they inherit the system this phase establishes. So Phase 3 owns **every existing
> surface** and locks the design system before functional work begins.
>
> **Source of truth: `design.md`** (root) — unified violet SaaS system (accent `#702DFF`,
> Inter, 8/12/pill radii, light-only on semantic tokens). Supersedes the old `DESIGN.md`.
> Per-page layout refs live in `design/`.
>
> **Workflow (human-in-the-loop):** foundation first, then one surface at a time —
> I edit a surface → maintainer reviews → iterate until approved → next surface. A final
> whole-app cohesion sign-off gates entry to Phase 4. **Do not start Phase 4 until the
> maintainer confirms.**

- [x] Design system consolidated: root `design.md` (single source of truth) + `design/` page refs
- [x] Role-based landing stubs: `LabAccessPage`, `AdminPortalPage`, profile dropdown nav
      (replaces old single `HomePage`) — uncommitted, needs a baseline commit
> **Direction (locked 2026-07-10):** ALL app surfaces are **light** (`canvas`/`surface`,
> **violet-only** — no gradient). The **homepage (`LandingPage.tsx`) is FROZEN** — it's an
> approved dark/gradient marketing exception, used only as a *quality* reference; do not edit
> it or the shared shell in a way that changes it. Cadence: foundation → one surface at a time,
> maintainer review between each.

- [x] **Foundation pass** — tokens→`@theme` + motion tokens + `prefers-reduced-motion` were
      already done in `index.css`. **Added 2026-07-10:** `Skeleton`, `Card`, `Input`, `Badge`
      primitives (token-themed, `design.md §4/§7`); route-level `React.lazy` + `Suspense` in
      `App.tsx` with branded fallbacks (`PageFallback` + shell-shaped `AppFallback`). typecheck
      + lint + build green, per-route chunk splitting confirmed. _Awaiting review._
- [x] **Login** — redesigned to `design.md` (light, violet-only): centered `<Card>` +
      `<Input>` primitives + violet brand lockup. Committed `0183785`.
- [x] **Home (landing)** — FROZEN/approved; reference only, do not touch (skipped by direction)
- [x] **Lab Access Portal** (user) — precise-minimal dashboard = hero + "Available labs" card
      grid (mock, mono metadata row, status Badge, "Open lab" CTA) + empty-state fallback.
      Committed `7e3eb68`. NB: the Remote/Credentials tabs live on the **in-lab page**
      (docs + RDP), which is **Phase 5** (needs Guacamole) — **not** this dashboard.
- [x] **Admin Portal** — full 5-surface console **design template** (Dashboard, Users,
      Machines, Lab Credentials, Settings). **Users page is wired to the real API**; the other
      four are **mock/placeholder** awaiting Phase 4 logic. Committed `52cec4c` + local polish.
- [x] **Docs + global shell** — shell + nav/profile dropdown in place across surfaces.
- [x] Mock/placeholder data lives inline per admin page (swapped for real data in Phase 4).
- [x] ✅ **Cohesion sign-off** — maintainer accepts the admin UI as the **final design template**.
> **Admin template is frozen (2026-07-10):** treat the admin surfaces as a finished design
> template — Phase 4 **binds logic / real data** into them, it does **not** restyle them. Any
> *redesign* must be done by a dedicated **Opus agent** and validated as warranted first. NB:
> the admin pages currently use functional status colors + a few gradients/hex that deviate
> from `design.md`'s violet-only rule — **accepted as-is** for the template; revisit only via
> the Opus-agent redesign path. **New** Phase 4 surfaces follow `design.md`.

## Phase 4 — Labs, Assignments & the participant experience (user-first)  ✅ COMPLETE
> **Direction (2026-07-10):** perfect the *participant* experience before automating infra —
> the admin can provision machines by hand, but the participant experience is what scales.
> Admin provisions machines **manually** and pastes RDP creds; there is **no `Machine` model
> yet** (deferred to Phase 6) — creds are typed straight into an `Assignment` (`ARCHITECTURE.md`
> allows "typed by admin"). **Each participant gets their own desktop** (killer.sh-style
> isolation). Real data replaces the admin mock — **except Users, already real**.

> **PIVOT (landed in `2fabd97`/`4a6925a`):** RDP creds are **not** typed into the Assignment.
> The `Machine` model was **pulled forward from Phase 6** into a machine **pool** — creds live
> encrypted on the Machine (`lib/crypto.ts`); an Assignment binds `userId+labId+machineId`. The
> admin manages a pool of machines and picks one when assigning. This supersedes the "typed into
> Assignment" wording below.

**4a — Backend domain (real data)** ✅
- [x] `Lab` model — `slug, title, summary, difficulty, duration, order`; guide content is
      **file-backed** under `wiki/<slug>/NN-*.md` (+ `wiki/<slug>/images/`), **not** in the DB (`lib/wiki.ts`)
- [x] `Assignment` model — `userId, labId, machineId` (unique per machine) + `completedPages`;
      **creds moved to `Machine`** (`rdpHost/Port/User/Password`, password encrypted per `SECURITY.md`)
- [x] Admin API — Lab CRUD (create scaffolds `wiki/<slug>/01-intro.md`; edit reads/writes page
      files); Assignment CRUD (bind user→lab→machine; revoke); **Machine pool CRUD** (`/admin/machines`)
- [x] User API — `GET /api/me/labs`, `GET /api/me/labs/:slug` (pages + creds + my progress),
      `GET …/pages/:file`, `GET …/images/:file`, `POST …/progress` (mark page complete)

**4b — Admin: bind the design template to real data** (no restyle; Opus-agent for any redesign) ✅
- [x] Lab management surface — CRUD labs + page editor, wired to `/admin/labs` (`LabManagementPage`)
- [x] Machine pool surface — CRUD machines, wired to `/admin/machines` (`MachinePoolPage`, new)
- [x] Lab Credentials page — real Assignments; **Lab + Machine dropdowns** from live lists;
      assign form binds a pool machine (`LabCredentialsPage`)
- [x] (Users page already real — leave as-is)

**4c — User: My Labs + killer.sh-style lab view** ✅
> The **Remote** tab is a static "coming soon" placeholder in 4c — the live in-browser
> desktop (Guacamole) is **Phase 5**. The checkpoint's "guide pages render with progress"
> covers the guide/creds surfaces only, not a live desktop.
- [x] `LabAccessPage` (My Labs) wired to real assignments (replace mock array)
- [x] In-lab page (net-new): split view — **guide left / desktop right**; top tabs
      **Remote | Credentials** _(Remote tab is a static Phase-5 placeholder — Guacamole deferred)_
- [x] Guide reader: file-backed **multi-page** (`wiki/<slug>/NN-*.md`), section rail,
      **next/back**, scroll, **mark-as-complete per page** (persisted per-user on the Assignment),
      `react-markdown`, **code + YAML** highlight, **copy** buttons, **image** support
- [x] Credentials tab — the user's own RDP host/user/password with copy
- [x] ✅ Checkpoint: assigned user sees only their labs + creds; guide pages render with
      progress; unassigned user sees nothing _(automated gates green; live-stack E2E is maintainer manual test)_

**4d — Re-optimize the lab workshop page (pre-Phase-5 cleanup)**
> Scope is **only** the lab workshop surface (`LabViewPage` + `lab-view/GuidePane`,
> `RemotePanel`, `CredentialsPanel`) — the page users live in. **Polish/repair, no new
> features.** New features from the original list are split out: **4e** (credentials), **4f**
> (lab authoring), and item 3 (Machine Pool + web terminal) → **Phase 6**.
>
> **Design governance (decided):** keep `design.md` tokens/radii as-is — "sharp / formal /
> minimal" means **tighter, denser, cleaner via spacing + typography**, NOT less-rounded
> corners. **Motion is a first-class goal** here (heavy-focus page); all animation uses the
> existing motion tokens in `index.css` and honors `prefers-reduced-motion`.
> Design floor **1280px**; verify at **13" and 15.6"** laptops.
>
> **Status (2026-07-13):** 4d-1 → 4d-4 all **built + automated gates green** (typecheck / lint /
> build) — marked `[~]` = **awaiting maintainer functional + design confirmation** at 13"/15.6"
> before checking off. Frontend suite now **7 failed / 32 passed** — the 7 are the documented
> Phase-2 frozen-surface set (mdx / landing / nav / routing); the 5 prior lab-view failures were
> **env-caused** (jsdom's `--localstorage-file` misconfig left `localStorage.getItem`/`matchMedia`
> undefined, so `AppShell` `collapsible` + the new split threw) and are now fixed by polyfills in
> `test/setup.ts` (mirrors the existing `ResizeObserver` stub).

- [x] **4d-1 Chrome / focus layout** — make the shared `AppShell` Workspace sidebar
      **collapsible** (slim `w-16` icon rail ⇄ full `w-64`, smooth width animation);
      **default-collapsed on the lab view**, default-expanded elsewhere (admin look unchanged);
      collapsed/expanded choice **persisted** (localStorage).
      _Implemented — **pending maintainer functional + design check.** Deviations agreed in
      grilling: sidebar **fully hides** (`w-64 ⇄ w-0`, reclaims all width) instead of a `w-16`
      rail; **one fixed top-bar toggle** (`PanelLeft`/`PanelLeftClose`, left of title) per
      standard UI convention — not a sidebar-header button. **Hotfix 2026-07-13:** now **always
      hidden on a fresh session** (persistence + `labWorkshop.sidebarHidden` removed per maintainer;
      the toggle still shows it within the session, but the choice isn't remembered across loads).
      Admin untouched. Width animates at `--duration-base`/`--ease-standard`._
- [x] **4d-2 Guide navigation** — remove the `w-48` Guide sub-rail; replace with a **sticky
      top-of-document bar**: section **dropdown** (page titles + completion check + "Section N
      of M · X done") on the left, progress on the right, **thin progress bar** beneath. Keep
      the footer **Back / Mark-complete / Next** (top = jump, footer = sequential flow).
      _Implemented — **pending maintainer functional + design check.** `w-48` rail removed;
      sticky bar = jump **dropdown** (title + "Section N of M", per-page completion checks) left,
      **"X of M done"** count right, **completion** progress bar beneath. Mark-complete stays
      footer-only; dropdown checks are read-only. **Bonus (from scroll request):** lab view is
      now a **locked viewport** — page no longer scrolls globally; only the three sections scroll
      (Docs / Remote / Credentials) via `min-h-0` + `overflow-hidden`; doc padding is responsive._
- [x] **4d-3 Responsive docs ‖ RDP** — resizable split default **45/55** (doc/RDP), **persist
      the split position**; **below 1280px collapse to single-pane tabbed** layout.
      _Implemented — **pending maintainer functional + design check.** Decisions (grilled 2026-07-13):
      the two primaries are **Docs** ‖ **Remote Session**; **Credentials is a nested toggle inside
      Remote Session** (both layouts), not a co-equal primary — "Remote" renamed **"Remote Session"**.
      New `useMediaQuery('(min-width:1280px)')` branches two trees: ≥1280 = resizable split, <1280 =
      `Docs | Remote Session` tabs (Credentials stays nested). `selectedFile`/`sessionTab` **lifted to
      `LabViewPage`** so the current page + session tab survive the breakpoint remount. Persistence uses
      v4 **`defaultLayout` + `onLayoutChanged`** (`labWorkshop.split`), **not** `autoSaveId` (that's the
      v2 API; not in the installed v4)._
      **Hotfix 2026-07-13:** the guide footer **Back / Mark complete / Next** row is now responsive
      via a **container query** (`@container` on the doc pane) — Back/Next collapse to icon-only
      (with `aria-label`s) below a 22rem pane width so they never overflow the narrow docs pane;
      "Mark complete" keeps its label. **Split drag floors tuned to the 1280 design floor:** docs
      `minSize="29%"` (≥~360px), remote `minSize="33%"` (≥~420px) so the slider can't be dragged to
      a lopsided/unusable split (was reaching 5/95). **Gotcha:** in v4 a *numeric* `minSize` is
      **pixels** (a ~30px no-op) — the constraint must be a **string percentage**; verified via the
      imperative `resize()` (string clamps to 29%, numeric doesn't). %s picked for 1280, roomier on
      larger screens._
- [x] **4d-4 Motion & loading** — guide page fade/slide on section change; Remote↔Credentials
      **crossfade**; lazy-load guide images; polished **"Connecting to your desktop…"** resting
      placeholder (visual only — Phase 5 wires the socket).
      _Implemented — **pending maintainer functional + design check.** Guide body does a keyed
      `animate-in fade-in slide-in-from-bottom-1` on page change; Remote/Credentials + the mobile
      tabs `fade-in` crossfade; all via `--duration-base`/`--ease-standard`, frozen by the global
      reduced-motion reset. Guide `<img>` gets `loading="lazy"`. RemotePanel rebuilt as an honest
      resting state (pulsing glyph + truthful "use Credentials meanwhile" subtext). **Prefetch
      dropped by decision (option B)** — no cache today, so a naive prefetch would fetch-and-discard;
      only image lazy-loading shipped. Skeletons: guide already used `<Skeleton>` (no spinners existed)._
- [x] ✅ Checkpoint: **maintainer manual sign-off** at 13"/15.6" (sidebar collapse+persist,
      top dropdown+progress, responsive split + <1280 tabbed fallback, transitions, skeletons,
      prefetch, connecting placeholder, reduced-motion honored) + automated gates green **on Windows**.

**4e — Credentials system** ✅ (built; automated gates green — awaiting maintainer functional check)
> **Grilled + built 2026-07-13.** Resolved model: a **Lab owns a list of credential variables**
> (`Lab.credentialVars: [{_id, label, type}]`, types **endpoint / yaml / text** — password type
> dropped, **all plaintext** per maintainer). Every participant of the lab sees the **same
> variable set**; each **value is per-user**, stored on the **Assignment** (`credentialValues`
> Map keyed by var `_id`) → revoking the assignment clears the values. Unfilled variables are
> **hidden** in the participant Credentials tab.
> - **Backend:** `Lab.credentialVars` + `Assignment.credentialValues`; admin `POST/DELETE
>   /admin/labs/:slug/credential-vars` (add/remove; delete `$unset`s the key from all the lab's
>   assignments); admin `PATCH /admin/assignments/:id/credentials`; `GET /api/me/labs/:slug` now
>   returns `credentials` (this user's **filled** vars). `connection` (RDP) stays in the payload
>   for the Phase-5 Guacamole token but is **no longer shown** in the Credentials tab.
> - **Frontend:** existing machine-assignment page renamed **"Lab Machines"** (`LabMachinesPage`,
>   `/admin/lab-machines`); **new "Lab Credentials"** page (`/admin/lab-credentials`) — pick lab →
>   define vars (add/remove) → pick assigned user → per-field form → save. Participant
>   `CredentialsPanel` rewritten: RDP dropped; renders per-user vars (endpoint=link+copy,
>   yaml=highlighted code block+copy, text=mono+copy) with an empty state.
> - **UX/UI finalizer (2026-07-13):** Lab selector redesigned from bare dropdown → full-width
>   context bar (icon + selected-lab name + search dropdown with title/slug rows). Variables +
>   Participant cards now split at `md:` (768px, was `lg:` 1024px) with matched heights (`flex
>   flex-col`). Empty states centered with icons. Toast notifications (`sonner`, design.md
>   tokens) for save success/failure — slide-in from right at top-right corner. Content fills
>   available width (removed `mx-auto max-w-5xl`).
> - **Gates:** backend typecheck/lint + **129 tests** green; frontend typecheck/lint/build green;
>   suite **7 failed (frozen Phase-2 set) / 33 passed**. Live-stack functional check is maintainer manual.

**4f — Lab authoring (export / import + generator)** _(new feature — grill separately before building)_
> From item 6 + item 7. Export/Import a lab as a single `.md` file (backup + continue dev), and
> a `backend/script` lab generator producing guide markdown with yaml support, credential-copy,
> pictures, and highlighting. Format + tooling not yet resolved — needs its own grilling session.

## Phase 5 — In-browser RDP (Guacamole, lightweight & in-app)  ◀◀◀ NEXT
> **Lightweight, in-app canvas** (not the Java webapp): only `guacd` + a `guacamole-lite` Node
> WS tunnel + `guacamole-common-js` rendering the raw desktop **inside the Remote tab** — no
> Guacamole login/chrome. Token is minted server-side from the user's Assignment; the RDP
> password never reaches the client. **Needs a reachable xrdp host to verify.**
- [ ] `guacd` in **dev** compose + `guacamole-lite` tunnel wired to the backend
- [ ] Backend token endpoint — AES-encrypted connection token from the requesting user's
      Assignment (RBAC: only the assignee)
- [ ] Frontend — `guacamole-common-js` canvas mounts in the **Remote** tab of the in-lab page
- [ ] ✅ Checkpoint (real xrdp host): assigned user reaches their **own** live RDP desktop
      in-browser; unassigned cannot

## Phase 6 — Dynamic provisioning (Terraform + Ansible + BullMQ)
- [x] `Machine` model — **landed early in Phase 4a** (`Machine.ts`) as a static pool; admin
      assigns creds *from a machine*. Phase 6 adds `source: 'dynamic'` + provisioning status on top.
- [ ] **Machine Pool console** (folded in from 4d item 3) — recast the admin Machines page as a
      **Machine Pool** view: Node / vCPU / Memory from the pool record, **Owner → mapped user**,
      status via **health-check ping → UP / DOWN** (replaces Ready/provisioning/issue), and the
      "view log" action → **SSH web terminal (xterm.js)**. Grill separately (needs a live host to verify).
- [ ] BullMQ queue + worker process; `Job` model
- [ ] Provisioning adapter: workdir + `execa` terraform → ansible + log streaming
- [ ] Nutanix Terraform template + Ansible playbook (NKP tooling + xrdp) in `/infra`
- [ ] Admin → Machines → Create (dynamic): job launch + SSE live logs + detail panel
- [ ] ✅ Checkpoint: dynamic create provisions VM, logs stream, status `online`

## Phase 7 — Prod hardening & ship
- [ ] `deploy/docker-compose.prod.yml` (nginx + fe + be + worker + mongo + redis + guac)
- [ ] nginx TLS + routing
- [ ] Secret handling per `SECURITY.md`
- [ ] Admin dashboard counts
- [ ] ✅ Checkpoint: full flow end-to-end over HTTPS on a clean host

## Backlog / later (explicit non-goals for v1)
- [ ] Lab task auto-grading / verification
- [ ] Public self-signup or workshop access codes
- [ ] Auto-wire Terraform output → user credential
- [ ] In-app MDX lab authoring editor
- [ ] Remote Terraform state backend
