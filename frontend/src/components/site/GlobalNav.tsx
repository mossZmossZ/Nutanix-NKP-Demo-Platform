import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

// Resized from DESIGN.md's original 44px Apple bar to a standard SaaS header height
// (64px, hairline-bordered) to match the dark, dev-tool-coded direction.
export function GlobalNav() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function onLogout() {
    await logout()
    navigate('/', { replace: true })
  }

  const portalHref = user?.role === 'admin' ? '/admin' : '/lab-access'

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-white/10 bg-surface-black text-on-dark">
      <nav className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-xl">
        <Link to="/" className="font-text text-caption-strong text-on-dark">
          NKP Workshop
        </Link>

        <div className="flex items-center gap-lg">
          <Link to="/docs" className="font-text text-button-utility text-on-dark hover:text-body-muted">
            Docs
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-xs rounded-pill border border-white/15 bg-white/5 py-[6px] pr-[12px] pl-[6px] font-text text-button-utility text-on-dark outline-none transition-colors hover:bg-white/10">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-caption-strong text-on-primary uppercase">
                  {user.username.charAt(0)}
                </span>
                <span className="max-w-[120px] truncate">{user.username}</span>
                <ChevronDown className="size-3.5 shrink-0 text-body-muted" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to={portalHref}>{user.role === 'admin' ? 'Admin portal' : 'Lab access'}</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={onLogout}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              to="/login"
              className="rounded-pill bg-primary px-[22px] py-[8px] font-text text-button-utility text-on-primary transition-transform active:scale-95"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}
