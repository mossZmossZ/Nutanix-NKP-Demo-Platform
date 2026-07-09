import { Link } from 'react-router-dom'

// design.md footer: quiet — muted-foreground text on white surface, border-border divider.
export function Footer() {
  return (
    <footer className="border-t border-border bg-surface px-lg py-[64px] text-muted-foreground">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-lg">
        <div className="flex gap-lg text-body-sm">
          <Link to="/docs" className="text-primary">Docs</Link>
          <Link to="/login" className="text-primary">Sign in</Link>
        </div>
        <p className="text-body-sm text-muted-foreground">
          Nutanix NKP Workshop Platform. For authorized workshop use only.
        </p>
      </div>
    </footer>
  )
}
