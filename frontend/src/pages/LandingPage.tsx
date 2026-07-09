import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { Button } from '@/components/ui/button'
import { BrowserMockup } from '@/components/site/BrowserMockup'

export function LandingPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function onSignOut() {
    await logout()
    navigate('/', { replace: true })
  }

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
              <Link to="/lab-access">Lab access</Link>
            </Button>
            {user ? (
              <Button variant="secondary" onClick={onSignOut}>
                Sign out
              </Button>
            ) : (
              <Button asChild variant="secondary">
                <Link to="/login">Sign in</Link>
              </Button>
            )}
            <Button asChild variant="secondary">
              <Link to="/docs">Read the docs →</Link>
            </Button>
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
