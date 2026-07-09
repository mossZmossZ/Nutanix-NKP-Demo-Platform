import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { BrowserMockup } from '@/components/site/BrowserMockup'
import { revealClass, revealDelay, useReveal } from '@/lib/useReveal'

export function LandingPage() {
  // Hero — staggered reveal for the eyebrow/title/lead/CTA/mockup group.
  const eyebrow = useReveal<HTMLParagraphElement>()
  const heroTitle = useReveal<HTMLHeadingElement>()
  const heroLead = useReveal<HTMLParagraphElement>()
  const heroCta = useReveal<HTMLDivElement>()
  const heroMockup = useReveal<HTMLDivElement>()

  const tile2Title = useReveal<HTMLHeadingElement>()
  const tile2Lead = useReveal<HTMLParagraphElement>()

  const tile3Title = useReveal<HTMLHeadingElement>()
  const tile3Lead = useReveal<HTMLParagraphElement>()

  const tile4Title = useReveal<HTMLHeadingElement>()
  const tile4Lead = useReveal<HTMLParagraphElement>()

  return (
    <>
      {/* Hero — dark stage: the terminal demo IS the pitch */}
      <section className="bg-ink-900 px-lg py-section text-center">
        <div className="mx-auto max-w-[820px]">
          <p
            ref={eyebrow.ref}
            style={revealDelay(0)}
            className={`text-label uppercase tracking-[0.08em] text-primary-foreground/70 ${revealClass(eyebrow.visible)}`}
          >
            Nutanix NKP · Hands-on Workshop
          </p>
          <h1
            ref={heroTitle.ref}
            style={revealDelay(1)}
            className={`mt-sm text-display text-primary-foreground ${revealClass(heroTitle.visible)}`}
          >
            Learn Kubernetes on real infrastructure.
          </h1>
          <p
            ref={heroLead.ref}
            style={revealDelay(2)}
            className={`mt-md text-body-lg text-primary-foreground/70 ${revealClass(heroLead.visible)}`}
          >
            No installs, no simulators — every lab boots a real cluster and hands
            you a live terminal, right in the browser.
          </p>
          <div
            ref={heroCta.ref}
            style={revealDelay(3)}
            className={`mt-xl flex items-center justify-center gap-md ${revealClass(heroCta.visible)}`}
          >
            <Button asChild variant="primary" className="rounded-full">
              <Link to="/lab-access">Lab access</Link>
            </Button>
            <Button asChild variant="secondary-dark">
              <Link to="/docs">Read the docs →</Link>
            </Button>
          </div>
          <div
            ref={heroMockup.ref}
            style={revealDelay(4)}
            className={`mt-section ${revealClass(heroMockup.visible)}`}
          >
            <BrowserMockup />
          </div>
        </div>
      </section>

      {/* Tile 2 — white: the remote desktop story */}
      <section className="bg-white px-lg py-section text-center">
        <div className="mx-auto max-w-[820px]">
          <h2
            ref={tile2Title.ref}
            style={revealDelay(0)}
            className={`text-h2 text-foreground ${revealClass(tile2Title.visible)}`}
          >
            A full Linux desktop. In your browser.
          </h2>
          <p
            ref={tile2Lead.ref}
            style={revealDelay(1)}
            className={`mt-md text-body-lg text-muted-foreground ${revealClass(tile2Lead.visible)}`}
          >
            No installs, no SSH keys. Click your lab and you are on the machine —
            a real RDP desktop streamed to a browser tab.
          </p>
        </div>
      </section>

      {/* Tile 3 — violet-50: the guided labs story */}
      <section className="bg-violet-50 px-lg py-section text-center">
        <div className="mx-auto max-w-[820px]">
          <h2
            ref={tile3Title.ref}
            style={revealDelay(0)}
            className={`text-h2 text-foreground ${revealClass(tile3Title.visible)}`}
          >
            Guided labs, step by step.
          </h2>
          <p
            ref={tile3Lead.ref}
            style={revealDelay(1)}
            className={`mt-md text-body-lg text-muted-foreground ${revealClass(tile3Lead.visible)}`}
          >
            Every lab pairs a written guide with the live machine beside it —
            read on the left, do on the right.
          </p>
        </div>
      </section>

      {/* Tile 4 — white: the provisioning story */}
      <section className="bg-white px-lg py-section text-center">
        <div className="mx-auto max-w-[820px]">
          <h2
            ref={tile4Title.ref}
            style={revealDelay(0)}
            className={`text-h2 text-foreground ${revealClass(tile4Title.visible)}`}
          >
            Provisioned on demand.
          </h2>
          <p
            ref={tile4Lead.ref}
            style={revealDelay(1)}
            className={`mt-md text-body-lg text-muted-foreground ${revealClass(tile4Lead.visible)}`}
          >
            Instructors spin up machines on Nutanix with Terraform and Ansible,
            then hand each learner their own credentials.
          </p>
        </div>
      </section>
    </>
  )
}
