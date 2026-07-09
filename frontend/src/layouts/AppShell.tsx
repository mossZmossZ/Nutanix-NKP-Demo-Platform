import { useMemo, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
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
export function AppShell({ nav, title, children }: { nav: NavItem[]; title: string; children: ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  // Longest matching `to` wins, so a nested route (e.g. /admin/users) doesn't
  // also light up a parent entry (e.g. /admin).
  const activeTo = useMemo(() => {
    const matches = nav.filter(
      (item) => !item.disabled && (pathname === item.to || pathname.startsWith(`${item.to}/`)),
    )
    if (matches.length === 0) return null
    return matches.reduce((best, item) => (item.to.length > best.to.length ? item : best)).to
  }, [nav, pathname])

  async function onLogout() {
    await logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-surface">
        <div className="flex h-16 shrink-0 items-center border-b border-border px-lg">
          <Link
            to="/"
            className="text-h4 text-foreground transition-colors duration-[var(--duration-base)] ease-standard hover:text-violet-600"
          >
            NKP Workshop
          </Link>
        </div>
        <nav className="flex flex-col gap-xxs p-sm">
          {nav.map((item) => {
            if (item.disabled) {
              return (
                <span
                  key={item.to}
                  aria-disabled="true"
                  className="flex cursor-not-allowed items-center gap-xs rounded-md border-l-[3px] border-transparent px-sm py-xs text-button text-muted-foreground/50"
                >
                  {item.icon}
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
                className={`flex items-center gap-xs rounded-md border-l-[3px] px-sm py-xs text-button transition-colors duration-[var(--duration-base)] ease-standard ${
                  active
                    ? 'border-violet-600 bg-violet-100 text-violet-600'
                    : 'border-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface px-xl">
          <span className="text-h3 text-foreground">{title}</span>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-xs rounded-md border border-border bg-surface py-[6px] pr-[12px] pl-[6px] text-button text-foreground outline-none transition-colors hover:bg-accent">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-label text-primary-foreground uppercase">
                  {user.username.charAt(0)}
                </span>
                <span className="max-w-[120px] truncate">{user.username}</span>
                <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-sm py-xs text-body-sm text-muted-foreground">{user.username}</div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={onLogout}>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </header>

        <main className="flex-1 bg-canvas px-xl py-lg">{children}</main>
      </div>
    </div>
  )
}
