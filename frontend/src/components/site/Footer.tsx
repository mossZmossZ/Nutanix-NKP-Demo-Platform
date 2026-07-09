import { Link } from 'react-router-dom'

// DESIGN.md component.footer: parchment, ink-muted-80, fine-print legal row.
export function Footer() {
  return (
    <footer className="bg-canvas-parchment px-lg py-[64px] text-ink-muted-80">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-lg">
        <div className="flex gap-lg font-text text-caption">
          <Link to="/docs" className="text-primary">Docs</Link>
          <Link to="/login" className="text-primary">Sign in</Link>
        </div>
        <p className="font-text text-fine-print text-ink-muted-48">
          Nutanix NKP Workshop Platform. For authorized workshop use only.
        </p>
      </div>
    </footer>
  )
}
