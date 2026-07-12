import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { vi } from 'vitest'
import { LabViewPage } from '@/pages/LabViewPage'
import { api, ApiError } from '@/lib/api'

vi.mock('@/auth/AuthContext', () => ({
  useAuth: () => ({ user: { username: 'alice', role: 'user' }, logout: vi.fn() }),
}))
vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>()
  return { ...actual, api: vi.fn() }
})

function renderAt(slug: string) {
  render(
    <MemoryRouter initialEntries={[`/lab-access/${slug}`]}>
      <Routes>
        <Route path="/lab-access/:slug" element={<LabViewPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

test('renders the guide rail and both tabs once the lab loads', async () => {
  vi.mocked(api).mockResolvedValueOnce({
    id: 'a1',
    lab: { slug: 'nkp-basics', title: 'NKP Basics', summary: '', difficulty: 'Beginner', duration: '30 min' },
    pages: [],
    completedPages: [],
    connection: { rdpHost: '10.0.0.5', rdpPort: 3389, rdpUser: 'trainee', rdpPassword: 'hunter2' },
  })

  renderAt('nkp-basics')

  expect(await screen.findByText('NKP Basics')).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: /remote/i })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: /credentials/i })).toBeInTheDocument()
})

test('shows a not-assigned message on 404', async () => {
  vi.mocked(api).mockRejectedValueOnce(new ApiError(404, 'lab not found'))
  renderAt('someone-elses-lab')
  expect(await screen.findByText(/lab not available/i)).toBeInTheDocument()
})
