import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

const baseDetail = {
  id: 'a1',
  lab: { slug: 'nkp-basics', title: 'NKP Basics', summary: '', difficulty: 'Beginner', duration: '30 min' },
  pages: [],
  completedPages: [],
  credentials: [{ id: 'v1', label: 'namespace', type: 'text', value: 'team-a' }],
  connection: { rdpHost: '10.0.0.5', rdpPort: 3389, rdpUser: 'trainee', rdpPassword: 'hunter2' },
}

test('renders the guide rail and both tabs once the lab loads', async () => {
  vi.mocked(api).mockResolvedValueOnce(baseDetail)

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

test('switching to the Credentials tab shows the lab credentials', async () => {
  vi.mocked(api).mockResolvedValueOnce(baseDetail)
  const user = userEvent.setup()

  renderAt('nkp-basics')

  await screen.findByText('NKP Basics')
  const credentialsTab = screen.getByRole('tab', { name: /credentials/i })
  // Radix Tabs activate on focus; in jsdom, react-resizable-panels' pointer
  // handling in a two-panel group suppresses userEvent's click-driven focus
  // step (confirmed: works with a single panel, works with a manual .focus()
  // before the click, works via fireEvent on a plain button — this is a
  // jsdom/resizable/Radix focus-activation artifact, not app behavior). Focus
  // explicitly first so the click's activation fires as it would in a browser.
  credentialsTab.focus()
  await user.click(credentialsTab)
  expect(screen.getByText('team-a')).toBeInTheDocument()
})

test('marking a page complete in GuidePane propagates into completedPages', async () => {
  vi.mocked(api)
    .mockResolvedValueOnce({
      ...baseDetail,
      pages: [{ file: 'intro.md', order: 1, title: 'Intro' }],
      completedPages: [],
    })
    .mockResolvedValueOnce({ file: 'intro.md', content: '# Intro' })
    .mockResolvedValueOnce({ completedPages: ['intro.md'] })

  const user = userEvent.setup()
  renderAt('nkp-basics')

  await screen.findByText('NKP Basics')
  const markButton = await screen.findByRole('button', { name: /mark complete/i })
  await user.click(markButton)

  expect(await screen.findByRole('button', { name: /^completed$/i })).toBeInTheDocument()
})
