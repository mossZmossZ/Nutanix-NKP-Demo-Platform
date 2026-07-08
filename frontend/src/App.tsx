import { Button } from "@/components/ui/button"

// Phase 0 proof-of-theme: a single full-bleed hero tile in the
// DESIGN.md `product-tile-parchment` grammar. Not the real landing page —
// just enough to prove the Tailwind theme mapping (color, type, radius,
// spacing tokens) renders correctly end to end.
function App() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-canvas-parchment px-lg py-section text-center">
      <h1 className="max-w-3xl font-display text-hero-display text-ink">
        Hands-on Kubernetes labs, live in your browser.
      </h1>
      <p className="mt-lg max-w-xl font-display text-lead text-ink-muted-80">
        Spin up a real NKP environment and start the exercise in seconds.
      </p>
      <Button variant="primary" className="mt-xl">
        Start a lab
      </Button>
    </main>
  )
}

export default App
