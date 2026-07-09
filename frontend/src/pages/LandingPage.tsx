import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { BrowserMockup } from '@/components/site/BrowserMockup'

export function LandingPage() {
  return (
    <>
      {/* Hero — black stage: the terminal demo IS the pitch */}
      <section className="bg-surface-black px-lg py-section text-center text-on-dark">
        <div className="mx-auto max-w-[820px]">
          <p className="font-text text-caption-strong tracking-[0.08em] text-primary-on-dark uppercase">
            Nutanix NKP · Hands-on Workshop
          </p>
          <h1 className="mt-sm font-display text-hero-display text-on-dark">
            Learn Kubernetes on real infrastructure.
          </h1>
          <p className="mt-md font-display text-lead text-body-muted">
            No installs, no simulators — every lab boots a real cluster and hands
            you a live terminal, right in the browser.
          </p>
          <div className="mt-xl flex items-center justify-center gap-md">
            <Button asChild variant="primary">
              <Link to="/lab-access">Lab access</Link>
            </Button>
            <Button asChild variant="secondary-dark">
              <Link to="/docs">Read the docs →</Link>
            </Button>
          </div>
          <div className="mt-section">
            <BrowserMockup />
          </div>
        </div>
      </section>

      {/* Tile 2 — light: the remote desktop story */}
      <section className="bg-canvas px-lg py-section text-center">
        <div className="mx-auto max-w-[820px]">
          <h2 className="font-display text-display-lg text-ink">
            A full Linux desktop. In your browser.
          </h2>
          <p className="mt-md font-display text-lead text-ink-muted-80">
            No installs, no SSH keys. Click your lab and you are on the machine —
            a real RDP desktop streamed to a browser tab.
          </p>
        </div>
      </section>

      {/* Tile 3 — dark: the guided labs story */}
      <section className="bg-surface-tile-1 px-lg py-section text-center text-on-dark">
        <div className="mx-auto max-w-[820px]">
          <h2 className="font-display text-display-lg text-on-dark">Guided labs, step by step.</h2>
          <p className="mt-md font-display text-lead text-body-muted">
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
