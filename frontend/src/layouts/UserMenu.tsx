import { type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, Home, FlaskConical, ShieldCheck, FileText, LogOut } from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

// The account/navigation dropdown. Extracted from AppShell so the lab workshop
// can render the same role/path-aware menu as a hamburger once its top header is
// hidden (LabViewPage passes a Menu-icon trigger). The default trigger is the
// avatar + username pill used in the AppShell top bar.
export function UserMenu({ trigger }: { trigger?: ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  if (!user) return null

  const isAdmin = user.role === 'admin'
  const isOnAdminPage = pathname.startsWith('/admin')
  const isOnLabAccessPage = pathname.startsWith('/lab')
  const isOnHomepage = pathname === '/'

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={trigger ? 'Open menu' : undefined}
        className={
          trigger
            ? 'flex items-center justify-center rounded-md p-xs text-muted-foreground outline-none transition-colors duration-[var(--duration-base)] ease-standard hover:bg-accent hover:text-accent-foreground'
            : 'flex items-center gap-xs rounded-md border border-border bg-surface py-[6px] pr-[12px] pl-[6px] text-button text-foreground outline-none transition-colors hover:bg-accent'
        }
      >
        {trigger ?? (
          <>
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-label text-primary-foreground uppercase">
              {user.username.charAt(0)}
            </span>
            <span className="max-w-[120px] truncate">{user.username}</span>
            <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-sm py-xs text-body-sm text-muted-foreground">{user.username}</div>
        <DropdownMenuSeparator />

        {/* Admin on Admin UI: Homepage, Lab Access, Logout */}
        {isAdmin && isOnAdminPage && (
          <>
            <DropdownMenuItem onSelect={() => navigate('/')}>
              <Home className="mr-2 size-4" />
              Homepage
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate('/lab')}>
              <FlaskConical className="mr-2 size-4" />
              Lab Access
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout}>
              <LogOut className="mr-2 size-4" />
              Logout
            </DropdownMenuItem>
          </>
        )}

        {/* User on Lab Access: Homepage, Logout */}
        {!isAdmin && isOnLabAccessPage && (
          <>
            <DropdownMenuItem onSelect={() => navigate('/')}>
              <Home className="mr-2 size-4" />
              Homepage
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout}>
              <LogOut className="mr-2 size-4" />
              Logout
            </DropdownMenuItem>
          </>
        )}

        {/* Admin on Lab Access: Homepage, Admin Portal, Logout */}
        {isAdmin && isOnLabAccessPage && (
          <>
            <DropdownMenuItem onSelect={() => navigate('/')}>
              <Home className="mr-2 size-4" />
              Homepage
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate('/admin')}>
              <ShieldCheck className="mr-2 size-4" />
              Admin Portal
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout}>
              <LogOut className="mr-2 size-4" />
              Logout
            </DropdownMenuItem>
          </>
        )}

        {/* Admin on Homepage: Lab Access, Admin Portal, Logout */}
        {isAdmin && isOnHomepage && (
          <>
            <DropdownMenuItem onSelect={() => navigate('/lab')}>
              <FlaskConical className="mr-2 size-4" />
              Lab Access
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate('/admin')}>
              <ShieldCheck className="mr-2 size-4" />
              Admin Portal
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout}>
              <LogOut className="mr-2 size-4" />
              Logout
            </DropdownMenuItem>
          </>
        )}

        {/* User on Homepage: Lab Access, Documentation, Logout */}
        {!isAdmin && isOnHomepage && (
          <>
            <DropdownMenuItem onSelect={() => navigate('/lab')}>
              <FlaskConical className="mr-2 size-4" />
              Lab Access
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate('/docs')}>
              <FileText className="mr-2 size-4" />
              Documentation
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout}>
              <LogOut className="mr-2 size-4" />
              Logout
            </DropdownMenuItem>
          </>
        )}

        {/* Fallback for other pages: just show logout */}
        {!isOnAdminPage && !isOnLabAccessPage && !isOnHomepage && (
          <DropdownMenuItem onSelect={handleLogout}>
            <LogOut className="mr-2 size-4" />
            Logout
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
