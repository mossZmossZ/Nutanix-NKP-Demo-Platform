import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

// DESIGN.md component.global-nav: black bar, 44px, nav-link 12px.
export function GlobalNav() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function onLogout() {
    await logout()
    navigate('/', { replace: true })
  }

  return (
    <header className="sticky top-0 z-50 h-[44px] bg-surface-black text-on-dark">
      <nav className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-lg">
        <div className="flex items-center gap-lg">
          <Link to="/" className="font-text text-nav-link text-on-dark">
            NKP Workshop
          </Link>
          <Link to="/docs" className="font-text text-nav-link text-on-dark hover:text-body-muted">
            Docs
          </Link>
        </div>

        <div className="flex items-center gap-md">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded-sm bg-ink px-[15px] py-[6px] font-text text-button-utility text-on-dark transition-transform outline-none active:scale-95">
                Profile
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {user.role === 'admin' ? (
                  <DropdownMenuItem asChild>
                    <Link to="/admin">Admin portal</Link>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link to="/lab-access">Lab access</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={onLogout}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              to="/login"
              className="rounded-pill bg-primary px-[22px] py-[6px] font-text text-button-utility text-on-primary transition-transform active:scale-95"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}
