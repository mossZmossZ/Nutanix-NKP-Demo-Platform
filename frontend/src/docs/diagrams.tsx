import type { ReactNode } from 'react'

// In-doc SVG diagrams for the lab guides. Every color comes from a design-v2.md
// token via a Tailwind utility (fill-*/stroke-*) — no inline hex — so the figures
// stay on-brand and theme-consistent. Font-size/geometry use plain SVG attributes.

function Figure({ label, children }: { label: string; children: ReactNode }) {
  return (
    <figure className="my-lg">
      <div className="overflow-x-auto rounded-md border border-border bg-canvas p-lg">
        {children}
      </div>
      <figcaption className="mt-sm text-body-sm text-muted-foreground">{label}</figcaption>
    </figure>
  )
}

// All twelve factors at a glance — a numbered 3×4 grid, the overview companion
// to the detailed list below it in the doc.
export function TwelveFactorsGrid() {
  const factors = [
    'Codebase',
    'Dependencies',
    'Config',
    'Backing services',
    'Build, release, run',
    'Processes',
    'Port binding',
    'Concurrency',
    'Disposability',
    'Dev/prod parity',
    'Logs',
    'Admin processes',
  ] as const
  const cols = 3
  const cellW = 200
  const cellH = 56
  const gap = 10
  return (
    <Figure label="The twelve factors at a glance — each one is unpacked below.">
      <svg
        role="img"
        aria-label="A numbered grid of all twelve factors"
        viewBox="0 0 640 274"
        className="w-full max-w-full"
      >
        {factors.map((name, i) => {
          const col = i % cols
          const row = Math.floor(i / cols)
          const x = 10 + col * (cellW + gap)
          const y = 10 + row * (cellH + gap)
          return (
            <g key={name}>
              <rect x={x} y={y} width={cellW} height={cellH} rx="6" className="fill-card stroke-border" strokeWidth="1.5" />
              <circle cx={x + 26} cy={y + 28} r="14" className="fill-accent stroke-primary" strokeWidth="1.5" />
              <text x={x + 26} y={y + 32} textAnchor="middle" fontSize="12" fontWeight="600" className="fill-primary">
                {i + 1}
              </text>
              <text x={x + 50} y={y + 32} fontSize="12" className="fill-foreground">
                {name}
              </text>
            </g>
          )
        })}
      </svg>
    </Figure>
  )
}

// Config lives outside the app: one immutable build gets different values
// injected per environment — never a code change to move between them.
export function ConfigInEnvironment() {
  const envs = [
    ['Development', 'DATABASE_URL=localhost'],
    ['Staging', 'DATABASE_URL=stg.internal'],
    ['Production', 'DATABASE_URL=prod.internal'],
  ] as const
  return (
    <Figure label="One build, three environments — only the injected config differs, never the code.">
      <svg
        role="img"
        aria-label="A single build artifact feeding three environments that each inject different config"
        viewBox="0 0 640 220"
        className="w-full max-w-full"
      >
        <defs>
          <marker id="arrow-config" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" className="fill-muted-foreground" />
          </marker>
        </defs>

        <rect x="20" y="82" width="170" height="56" rx="6" className="fill-accent stroke-primary" strokeWidth="1.5" />
        <text x="105" y="106" textAnchor="middle" fontSize="12" fontWeight="600" className="fill-foreground">
          Same build
        </text>
        <text x="105" y="123" textAnchor="middle" fontSize="10" className="fill-muted-foreground">
          no config baked in
        </text>

        {envs.map(([env, cfg], i) => {
          const y = 16 + i * 68
          return (
            <g key={env}>
              <line x1="190" y1="110" x2="242" y2={y + 24} className="stroke-muted-foreground" strokeWidth="1.5" markerEnd="url(#arrow-config)" />
              <rect x="246" y={y} width="374" height="48" rx="6" className="fill-card stroke-border" strokeWidth="1.5" />
              <text x="264" y={y + 21} fontSize="12" fontWeight="600" className="fill-foreground">
                {env}
              </text>
              <text x="264" y={y + 38} fontSize="11" className="fill-primary font-mono">
                {cfg}
              </text>
            </g>
          )
        })}
      </svg>
    </Figure>
  )
}

// Build → Release → Run: three strictly separate, repeatable stages, so any
// release can be rolled back or re-run exactly as it was.
export function BuildReleaseRun() {
  const stages = [
    ['Build', 'code + deps → artifact'],
    ['Release', 'artifact + config'],
    ['Run', 'execute in the environment'],
  ] as const
  return (
    <Figure label="Build, release, and run are separate, repeatable stages — a release is a fixed artifact you can re-run or roll back.">
      <svg
        role="img"
        aria-label="A three-stage pipeline: build, then release, then run"
        viewBox="0 0 640 140"
        className="w-full max-w-full"
      >
        <defs>
          <marker id="arrow-brr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" className="fill-primary" />
          </marker>
        </defs>

        {stages.map(([name, note], i) => {
          const x = 30 + i * 215
          return (
            <g key={name}>
              <rect x={x} y="38" width="150" height="64" rx="6" className={i === 1 ? 'fill-accent stroke-primary' : 'fill-card stroke-border'} strokeWidth="1.5" />
              <text x={x + 75} y="66" textAnchor="middle" fontSize="13" fontWeight="600" className="fill-foreground">
                {name}
              </text>
              <text x={x + 75} y="84" textAnchor="middle" fontSize="10" className="fill-muted-foreground">
                {note}
              </text>
              {i < stages.length - 1 && (
                <line x1={x + 150} y1="70" x2={x + 213} y2="70" className="stroke-primary" strokeWidth="1.5" markerEnd="url(#arrow-brr)" />
              )}
            </g>
          )
        })}
      </svg>
    </Figure>
  )
}

// A monolith (one deployable, shared database) contrasted with several
// independently deployable services, each owning its own data.
export function MonolithVsMicroservices() {
  return (
    <Figure label="One deployable that scales as a whole, versus small services you build, ship, and scale on their own.">
      <svg
        role="img"
        aria-label="A single monolith box beside three independent services, each with its own database"
        viewBox="0 0 640 300"
        className="w-full max-w-full"
      >
        {/* ---- Monolith ---- */}
        <text x="130" y="24" textAnchor="middle" fontSize="14" fontWeight="600" className="fill-foreground">
          Monolith
        </text>
        <text x="130" y="42" textAnchor="middle" fontSize="12" className="fill-muted-foreground">
          one deployable
        </text>
        <rect x="30" y="56" width="200" height="196" rx="8" className="fill-card stroke-border" strokeWidth="1.5" />
        {(['User Interface', 'Business Logic', 'Data Access'] as const).map((t, i) => (
          <g key={t}>
            <rect x="50" y={76 + i * 48} width="160" height="36" rx="4" className="fill-accent stroke-primary" strokeWidth="1" />
            <text x="130" y={98 + i * 48} textAnchor="middle" fontSize="12" className="fill-foreground">
              {t}
            </text>
          </g>
        ))}
        {/* shared database cylinder */}
        <ellipse cx="130" cy="228" rx="46" ry="8" className="fill-accent stroke-primary" strokeWidth="1" />
        <path d="M84 228 v10 a46 8 0 0 0 92 0 v-10" className="fill-accent stroke-primary" strokeWidth="1" />
        <text x="130" y="234" textAnchor="middle" fontSize="11" className="fill-muted-foreground">
          one shared DB
        </text>

        {/* ---- divider ---- */}
        <text x="320" y="150" textAnchor="middle" fontSize="13" className="fill-muted-foreground">
          vs
        </text>

        {/* ---- Microservices ---- */}
        <text x="500" y="24" textAnchor="middle" fontSize="14" fontWeight="600" className="fill-foreground">
          Microservices
        </text>
        <text x="500" y="42" textAnchor="middle" fontSize="12" className="fill-muted-foreground">
          many small deployables
        </text>
        {(['Orders', 'Users', 'Billing'] as const).map((t, i) => {
          const x = 386 + i * 84
          return (
            <g key={t}>
              <rect x={x} y="72" width="72" height="52" rx="6" className="fill-card stroke-border" strokeWidth="1.5" />
              <text x={x + 36} y="102" textAnchor="middle" fontSize="12" className="fill-foreground">
                {t}
              </text>
              {/* its own database */}
              <ellipse cx={x + 36} cy="150" rx="24" ry="5" className="fill-accent stroke-primary" strokeWidth="1" />
              <path d={`M${x + 12} 150 v22 a24 5 0 0 0 48 0 v-22`} className="fill-accent stroke-primary" strokeWidth="1" />
              <text x={x + 36} y="168" textAnchor="middle" fontSize="9" className="fill-muted-foreground">
                own DB
              </text>
              {/* link from service down to its DB */}
              <line x1={x + 36} y1="124" x2={x + 36} y2="145" className="stroke-border" strokeWidth="1.5" />
            </g>
          )
        })}
      </svg>
    </Figure>
  )
}

// A stateless process is just a template: run one copy or a hundred behind a
// load balancer, and add/remove copies freely because none holds local state.
export function StatelessScaling() {
  return (
    <Figure label="Because a stateless process keeps no local state, you scale by simply running more identical copies.">
      <svg
        role="img"
        aria-label="A load balancer fanning traffic out to three identical stateless replicas"
        viewBox="0 0 640 210"
        className="w-full max-w-full"
      >
        <defs>
          <marker id="arrow-scale" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" className="fill-muted-foreground" />
          </marker>
        </defs>

        {/* incoming requests */}
        <text x="70" y="100" textAnchor="middle" fontSize="12" className="fill-muted-foreground">
          requests
        </text>
        <line x1="112" y1="105" x2="176" y2="105" className="stroke-muted-foreground" strokeWidth="1.5" markerEnd="url(#arrow-scale)" />

        {/* load balancer */}
        <rect x="180" y="82" width="120" height="46" rx="6" className="fill-accent stroke-primary" strokeWidth="1.5" />
        <text x="240" y="103" textAnchor="middle" fontSize="12" fontWeight="600" className="fill-foreground">
          Load balancer
        </text>
        <text x="240" y="119" textAnchor="middle" fontSize="10" className="fill-muted-foreground">
          spreads traffic
        </text>

        {/* three identical replicas */}
        {[0, 1, 2].map((i) => {
          const y = 30 + i * 60
          return (
            <g key={i}>
              <line x1="300" y1="105" x2="392" y2={y + 22} className="stroke-muted-foreground" strokeWidth="1.5" markerEnd="url(#arrow-scale)" />
              <rect x="396" y={y} width="150" height="44" rx="6" className="fill-card stroke-border" strokeWidth="1.5" />
              <text x="471" y={y + 20} textAnchor="middle" fontSize="12" className="fill-foreground">
                app process
              </text>
              <text x="471" y={y + 35} textAnchor="middle" fontSize="10" className="fill-muted-foreground">
                identical · stateless
              </text>
            </g>
          )
        })}
        <text x="560" y="105" textAnchor="start" fontSize="11" className="fill-muted-foreground">
          +N…
        </text>
      </svg>
    </Figure>
  )
}

// The twelve-factor rules map almost one-to-one onto container + Kubernetes
// primitives — which is why NKP runs twelve-factor apps so naturally.
export function TwelveFactorToKubernetes() {
  const rows = [
    ['Config in the environment', 'ConfigMaps, Secrets, env vars'],
    ['Stateless processes', 'Pods & Deployment replicas'],
    ['Port binding', 'Service'],
    ['Logs as event streams', 'stdout → kubectl logs'],
    ['Disposability', 'Graceful shutdown & health probes'],
  ] as const
  const rowH = 48
  const top = 56
  return (
    <Figure label="Each twelve-factor rule has a natural home in Kubernetes — the reason NKP runs these apps with so little glue.">
      <svg
        role="img"
        aria-label="Five twelve-factor principles each mapped by an arrow to a Kubernetes primitive"
        viewBox={`0 0 640 ${top + rows.length * rowH + 8}`}
        className="w-full max-w-full"
      >
        <defs>
          <marker id="arrow-k8s" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" className="fill-primary" />
          </marker>
        </defs>

        <text x="150" y="32" textAnchor="middle" fontSize="13" fontWeight="600" className="fill-foreground">
          Twelve-factor rule
        </text>
        <text x="490" y="32" textAnchor="middle" fontSize="13" fontWeight="600" className="fill-foreground">
          Kubernetes / NKP
        </text>

        {rows.map(([factor, k8s], i) => {
          const y = top + i * rowH
          return (
            <g key={factor}>
              <rect x="10" y={y} width="280" height="38" rx="4" className="fill-card stroke-border" strokeWidth="1.5" />
              <text x="150" y={y + 24} textAnchor="middle" fontSize="12" className="fill-foreground">
                {factor}
              </text>
              <line x1="294" y1={y + 19} x2="346" y2={y + 19} className="stroke-primary" strokeWidth="1.5" markerEnd="url(#arrow-k8s)" />
              <rect x="350" y={y} width="280" height="38" rx="4" className="fill-accent stroke-primary" strokeWidth="1.5" />
              <text x="490" y={y + 24} textAnchor="middle" fontSize="12" className="fill-foreground">
                {k8s}
              </text>
            </g>
          )
        })}
      </svg>
    </Figure>
  )
}
