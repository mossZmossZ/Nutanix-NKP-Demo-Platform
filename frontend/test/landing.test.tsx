import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { LandingPage } from '@/pages/LandingPage'

const mockAuth = vi.fn()
vi.mock('@/auth/AuthContext', () => ({ useAuth: () => mockAuth() }))

test('renders the hero with a Sign in CTA to /login when logged out', () => {
  mockAuth.mockReturnValue({ user: null })
  render(<MemoryRouter><LandingPage /></MemoryRouter>)
  expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login')
})

test('redirects an authenticated user away from the landing', () => {
  mockAuth.mockReturnValue({ user: { username: 'alice', role: 'user' } })
  const { container } = render(<MemoryRouter><LandingPage /></MemoryRouter>)
  // Navigate renders nothing; the hero heading must be absent.
  expect(container.querySelector('h1')).toBeNull()
})
