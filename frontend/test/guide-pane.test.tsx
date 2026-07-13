import { useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { GuidePane } from '@/pages/lab-view/GuidePane'
import { api, ApiError } from '@/lib/api'

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>()
  return { ...actual, api: vi.fn() }
})

const pages = [
  { file: '01-intro.md', order: 1, title: 'Introduction' },
  { file: '02-setup.md', order: 2, title: 'Setup' },
]

// GuidePane's page selection is controlled by LabViewPage; this harness owns
// that state the same way so navigation clicks actually change the page.
function Harness({
  completedPages = [],
  onProgressChange = vi.fn(),
}: {
  completedPages?: string[]
  onProgressChange?: (completedPages: string[]) => void
}) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  return (
    <GuidePane
      slug="nkp-basics"
      pages={pages}
      completedPages={completedPages}
      onProgressChange={onProgressChange}
      selectedFile={selectedFile ?? pages[0].file}
      onSelectFile={setSelectedFile}
    />
  )
}

test('loads the first page, then navigates to the next page on click', async () => {
  vi.mocked(api)
    .mockResolvedValueOnce({ file: '01-intro.md', content: '# Introduction\n\nWelcome.' })
    .mockResolvedValueOnce({ file: '02-setup.md', content: '# Setup\n\nInstall things.' })

  render(<Harness />)

  expect(await screen.findByText('Welcome.')).toBeInTheDocument()
  expect(api).toHaveBeenCalledWith('/me/labs/nkp-basics/pages/01-intro.md')

  await userEvent.click(screen.getByRole('button', { name: /next/i }))

  expect(await screen.findByText('Install things.')).toBeInTheDocument()
  expect(api).toHaveBeenCalledWith('/me/labs/nkp-basics/pages/02-setup.md')
})

test('marking a page complete posts progress and reflects the returned state', async () => {
  vi.mocked(api)
    .mockResolvedValueOnce({ file: '01-intro.md', content: '# Introduction\n\nWelcome.' })
    .mockResolvedValueOnce({ completedPages: ['01-intro.md'] })

  const onProgressChange = vi.fn()
  render(<Harness onProgressChange={onProgressChange} />)

  await screen.findByText('Welcome.')
  await userEvent.click(screen.getByRole('button', { name: /mark complete/i }))

  await waitFor(() =>
    expect(api).toHaveBeenCalledWith('/me/labs/nkp-basics/progress', {
      method: 'POST',
      body: JSON.stringify({ file: '01-intro.md', completed: true }),
    }),
  )
  expect(onProgressChange).toHaveBeenCalledWith(['01-intro.md'])
})

test('shows an inline error if marking complete fails, without changing the toggle state', async () => {
  vi.mocked(api)
    .mockResolvedValueOnce({ file: '01-intro.md', content: '# Introduction\n\nWelcome.' })
    .mockRejectedValueOnce(new ApiError(500, 'progress update failed'))

  const onProgressChange = vi.fn()
  render(<Harness onProgressChange={onProgressChange} />)

  await screen.findByText('Welcome.')
  await userEvent.click(screen.getByRole('button', { name: /mark complete/i }))

  expect(await screen.findByRole('alert')).toHaveTextContent('progress update failed')
  expect(onProgressChange).not.toHaveBeenCalled()
})

test('shows an inline retry when a page fails to load, and reloads content on click', async () => {
  vi.mocked(api)
    .mockRejectedValueOnce(new ApiError(500, 'failed to load page'))
    .mockResolvedValueOnce({ file: '01-intro.md', content: '# Introduction\n\nWelcome.' })

  render(<Harness />)

  expect(await screen.findByRole('alert')).toHaveTextContent('failed to load page')
  // page list stays usable during the error — pages live in the section dropdown
  await userEvent.click(screen.getByRole('button', { name: /introduction/i }))
  expect(await screen.findByRole('menuitem', { name: /setup/i })).toBeInTheDocument()
  await userEvent.keyboard('{Escape}')

  await userEvent.click(screen.getByRole('button', { name: /retry/i }))

  expect(await screen.findByText('Welcome.')).toBeInTheDocument()
  expect(api).toHaveBeenLastCalledWith('/me/labs/nkp-basics/pages/01-intro.md')
})
