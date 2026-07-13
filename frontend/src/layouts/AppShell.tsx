import { useMemo, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, Hexagon, Home, FlaskConical, ShieldCheck, FileText, LogOut, PanelLeft, PanelLeftClose } from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

// `disabled` renders a non-navigable, greyed-out preview item (e.g. Admin's
// Machines/Assignments, whose routes land in a later phase). Deviation from the
// Task 5 integration contract, authorized for Task 6 to show the full sidebar IA.
export type NavItem = { label: string; to: string; icon?: ReactNode; disabled?: boolean }

// design.md §4 App shell (dashboard surfaces): persistent left sidebar +
// top bar, shared by Lab Access and Admin. Pages self-wrap via `children`
// (not <Outlet/> — see task-5 integration contract); routing/lazy-loading
// is wired later, not here.
// `collapsible` opts a surface into a hideable Workspace sidebar with a fixed
// top-bar toggle (used by the lab workshop). Other surfaces omit it and render
// the sidebar exactly as before.
export function AppShell({
  nav,
  title,
  children,
  collapsible = false,
  lockViewport = false,
}: {
  nav: NavItem[]
  title: string
  children: ReactNode
  collapsible?: boolean
  lockViewport?: boolean
}) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  // Always start hidden on a fresh session (maintainer 2026-07-13): the lab view
  // reclaims the width for its guide/RDP split. The toggle still shows it for the
  // rest of the session, but the choice is intentionally not persisted.
  const [sidebarHidden, setSidebarHidden] = useState(collapsible)
  function toggleSidebar() {
    setSidebarHidden((hidden) => !hidden)
  }

  // Longest matching `to` wins, so a nested route (e.g. /admin/users) doesn't
  // also light up a parent entry (e.g. /admin).
  const activeTo = useMemo(() => {
    const matches = nav.filter(
      (item) => !item.disabled && (pathname === item.to || pathname.startsWith(`${item.to}/`)),
    )
    if (matches.length === 0) return null
    return matches.reduce((best, item) => (item.to.length > best.to.length ? item : best)).to
  }, [nav, pathname])

  const isAdmin = user?.role === 'admin'
  const isOnAdminPage = pathname.startsWith('/admin')
  const isOnLabAccessPage = pathname.startsWith('/lab') // Assuming lab access pages start with /lab
  const isOnHomepage = pathname === '/'

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className={`flex ${lockViewport ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      <aside
        className={`flex shrink-0 flex-col overflow-hidden bg-surface transition-[width] duration-[var(--duration-base)] ease-standard ${
          collapsible && sidebarHidden ? 'w-0' : 'w-64 border-r border-border'
        }`}
      >
        <div className="flex h-16 shrink-0 items-center gap-xs border-b border-border px-lg">
          <Link
            to="/"
            className="flex items-center gap-xs text-h4 text-foreground transition-colors duration-[var(--duration-base)] ease-standard hover:text-violet-600"
          >
            <Hexagon className="size-4 text-violet-600" strokeWidth={2.25} />
            NKP Workshop
          </Link>
        </div>
        <nav className="flex flex-col gap-xxs p-sm">
          <span className="px-sm pt-xs pb-xxs text-label uppercase tracking-wide text-muted-foreground">
            Workspace
          </span>
          {nav.map((item) => {
            if (item.disabled) {
              return (
                <span
                  key={item.to}
                  aria-disabled="true"
                  className="flex cursor-not-allowed items-center gap-xs rounded-md px-sm py-xs text-body-sm font-medium text-muted-foreground/50"
                >
                  {item.icon ? <span className="[&_svg]:size-4">{item.icon}</span> : null}
                  {item.label}
                  <span className="ml-auto rounded-sm border border-border px-xxs text-label text-muted-foreground">
                    Soon
                  </span>
                </span>
              )
            }
            const active = item.to === activeTo
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-xs rounded-md px-sm py-xs text-body-sm font-medium transition-colors duration-[var(--duration-base)] ease-standard ${
                  active
                    ? 'bg-violet-100 text-violet-600'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                {item.icon ? (
                  <span className={`[&_svg]:size-4 ${active ? 'text-violet-600' : 'text-muted-foreground'}`}>
                    {item.icon}
                  </span>
                ) : null}
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface px-xl">
          <div className="flex items-center gap-sm">
            {collapsible ? (
              <button
                type="button"
                onClick={toggleSidebar}
                aria-label={sidebarHidden ? 'Show sidebar' : 'Hide sidebar'}
                aria-expanded={!sidebarHidden}
                className="rounded-md p-xs text-muted-foreground transition-colors duration-[var(--duration-base)] ease-standard hover:bg-accent hover:text-accent-foreground"
              >
                {sidebarHidden ? <PanelLeft className="size-5" /> : <PanelLeftClose className="size-5" />}
              </button>
            ) : null}
            <span className="text-h3 text-foreground">{title}</span>
          </div>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-xs rounded-md border border-border bg-surface py-[6px] pr-[12px] pl-[6px] text-button text-foreground outline-none transition-colors hover:bg-accent">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-label text-primary-foreground uppercase">
                  {user.username.charAt(0)}
                </span>
                <span className="max-w-[120px] truncate">{user.username}</span>
                <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
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
          ) : null}
        </header>

        <main className={`flex-1 bg-canvas px-xl py-lg ${lockViewport ? 'min-h-0 overflow-hidden' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  )
}
