import { Link } from 'react-router-dom'

// design.md footer: quiet — muted-foreground text on white surface, border-border divider.
export function Footer() {
  return (
    <footer className="border-t border-border bg-surface px-lg py-[64px] text-muted-foreground">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-lg">
        <div className="flex gap-lg text-body-sm">
          <Link to="/docs" className="text-blue-600">Docs</Link>
          <Link to="/login" className="text-blue-600">Sign in</Link>
        </div>
        <div className="flex flex-col gap-xs text-body-sm text-muted-foreground">
          <p>
            Nutanix NKP Workshop Platform. For authorized workshop use only.
          </p>
          <p>
            © {new Date().getFullYear()} Nattavee Narischat. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
