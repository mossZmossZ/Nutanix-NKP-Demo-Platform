import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { LabAccessPage } from '@/pages/LabAccessPage'
import { api } from '@/lib/api'

vi.mock('@/auth/AuthContext', () => ({
  useAuth: () => ({ user: { username: 'alice', role: 'user' }, logout: vi.fn() }),
}))
vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>()
  return { ...actual, api: vi.fn() }
})

test('renders assigned labs with a progress label and a link into the lab view', async () => {
  vi.mocked(api).mockResolvedValueOnce([
    {
      id: 'a1',
      lab: { slug: 'nkp-basics', title: 'NKP Basics', summary: 'Intro lab', difficulty: 'Beginner', duration: '30 min' },
      pageCount: 4,
      completedCount: 1,
    },
  ])

  render(<MemoryRouter><LabAccessPage /></MemoryRouter>)

  expect(await screen.findByText('NKP Basics')).toBeInTheDocument()
  expect(screen.getByText('1 of 4 pages')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /open lab/i })).toHaveAttribute('href', '/lab-access/nkp-basics')
})

test('shows an empty state when there are no assigned labs', async () => {
  vi.mocked(api).mockResolvedValueOnce([])
  render(<MemoryRouter><LabAccessPage /></MemoryRouter>)
  expect(await screen.findByText(/no labs assigned yet/i)).toBeInTheDocument()
})
