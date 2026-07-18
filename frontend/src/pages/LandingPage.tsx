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
      {/* Hero — light stage: copy left, the terminal demo artifact right */}
      <section className="bg-canvas px-lg py-section">
        <div className="mx-auto grid max-w-[1100px] items-center gap-xl lg:grid-cols-2">
          <div className="text-center lg:text-left">
            <p
              ref={eyebrow.ref}
              style={revealDelay(0)}
              className={`text-label uppercase tracking-[0.08em] text-iris-600 ${revealClass(eyebrow.visible)}`}
            >
              Nutanix NKP · Hands-on Workshop
            </p>
            <h1
              ref={heroTitle.ref}
              style={revealDelay(1)}
              className={`mt-sm text-display text-foreground ${revealClass(heroTitle.visible)}`}
            >
              Production-grade Kubernetes.
              <br />
              <span className="text-iris-600">Zero setup required.</span>
            </h1>
            <p
              ref={heroLead.ref}
              style={revealDelay(2)}
              className={`mt-md text-body-lg text-muted-foreground ${revealClass(heroLead.visible)}`}
            >
              Run enterprise Kubernetes on <strong className="text-foreground">real Nutanix infrastructure</strong>.
              Full multi-node NKP clusters, live terminals, and complete RDP desktops —
              all streaming to your browser in seconds.
            </p>
            <div
              ref={heroCta.ref}
              style={revealDelay(3)}
              className={`mt-xl flex items-center justify-center gap-md lg:justify-start ${revealClass(heroCta.visible)}`}
            >
              <Button asChild variant="primary" className="rounded-full">
                <Link to="/lab-access">Lab access</Link>
              </Button>
              <Button asChild variant="secondary" className="rounded-full">
                <Link to="/docs">Read the docs →</Link>
              </Button>
            </div>
          </div>
          <div
            ref={heroMockup.ref}
            style={revealDelay(4)}
            className={`${revealClass(heroMockup.visible)}`}
          >
            <BrowserMockup />
          </div>
        </div>
      </section>

      {/* Tile 2 — white: the remote desktop story */}
      <section className="bg-surface px-lg py-section text-center">
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
