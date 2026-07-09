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
            Production-Grade Kubernetes.
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              Zero Setup Required.
            </span>
          </h1>
          <p
            ref={heroLead.ref}
            style={revealDelay(2)}
            className={`mt-md text-body-lg text-primary-foreground/70 ${revealClass(heroLead.visible)}`}
          >
            Experience enterprise Kubernetes on <strong className="text-primary-foreground">real Nutanix infrastructure</strong>.
            Full multi-node NKP clusters, live terminals, and complete RDP desktops —
            all streaming to your browser in seconds.
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

    </>
  )
}
