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

// design.md §4 App shell: standard SaaS header height (64px), surface fill,
// 1px bottom border — violet is the only accent (sign-in CTA / hover states).
export function GlobalNav() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function onLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  const portalHref = user?.role === 'admin' ? '/admin' : '/lab-access'

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-border bg-surface">
      <nav className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-xl">
        <Link to="/" className="text-body font-semibold text-foreground">
          NKP Workshop
        </Link>

        <div className="flex items-center gap-lg">
          <Link to="/docs" className="text-button text-foreground hover:text-primary">
            Docs
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-xs rounded-md border border-border bg-surface py-[6px] pr-[12px] pl-[6px] text-button text-foreground outline-none transition-colors hover:bg-accent select-none">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-label text-primary-foreground uppercase">
                  {user.username.charAt(0)}
                </span>
                <span className="max-w-[120px] truncate">{user.username}</span>
                <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
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
              className="rounded-md bg-primary px-[22px] py-[8px] text-button text-primary-foreground transition-transform active:scale-95"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}
