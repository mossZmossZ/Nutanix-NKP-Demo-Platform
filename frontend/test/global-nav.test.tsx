import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { GlobalNav } from '@/components/site/GlobalNav'

const mockAuth = vi.fn()
vi.mock('@/auth/AuthContext', () => ({ useAuth: () => mockAuth() }))

function renderNav() {
  render(<MemoryRouter><GlobalNav /></MemoryRouter>)
}

test('shows a Sign in action linking to /login when logged out', () => {
  mockAuth.mockReturnValue({ user: null, logout: vi.fn() })
  renderNav()
  const signIn = screen.getByRole('link', { name: /sign in/i })
  expect(signIn).toHaveAttribute('href', '/login')
  expect(screen.queryByRole('button', { name: /sign out/i })).not.toBeInTheDocument()
})

test('shows the username and a Sign out action when logged in', () => {
  mockAuth.mockReturnValue({ user: { username: 'alice', role: 'user' }, logout: vi.fn() })
  renderNav()
  expect(screen.getByText('alice')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  expect(screen.queryByRole('link', { name: /^sign in$/i })).not.toBeInTheDocument()
})

test('always exposes a Docs link', () => {
  mockAuth.mockReturnValue({ user: null, logout: vi.fn() })
  renderNav()
  expect(screen.getByRole('link', { name: /docs/i })).toHaveAttribute('href', '/docs')
})
