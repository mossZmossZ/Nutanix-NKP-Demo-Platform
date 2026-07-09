import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import App from '@/App'

const mockAuth = vi.fn()
vi.mock('@/auth/AuthContext', () => ({
  useAuth: () => mockAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}))

function renderAt(path: string) {
  render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>)
}

test('logged-out visitor at / sees the public landing (Sign in present)', () => {
  mockAuth.mockReturnValue({ user: null, loading: false, logout: vi.fn() })
  renderAt('/')
  expect(screen.getAllByRole('link', { name: /sign in/i }).length).toBeGreaterThan(0)
})

test('authenticated visitor at / is redirected to /home', () => {
  mockAuth.mockReturnValue({ user: { username: 'alice', role: 'user' }, loading: false, logout: vi.fn() })
  renderAt('/')
  expect(screen.getByText(/signed in as alice/i)).toBeInTheDocument()
})
