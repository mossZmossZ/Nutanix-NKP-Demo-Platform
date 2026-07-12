import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { CredentialsPanel } from '@/pages/lab-view/CredentialsPanel'
import { RemotePanel } from '@/pages/lab-view/RemotePanel'

test('CredentialsPanel shows connection fields and copies a value on click', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined)
  const user = userEvent.setup()
  // Assign after setup(): user-event's setup() installs its own clipboard stub.
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })

  render(
    <CredentialsPanel
      connection={{ rdpHost: '10.0.0.5', rdpPort: 3389, rdpUser: 'trainee', rdpPassword: 'hunter2' }}
    />,
  )

  expect(screen.getByText('10.0.0.5:3389')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: /copy password/i }))
  expect(writeText).toHaveBeenCalledWith('hunter2')
})

test('RemotePanel shows a coming-soon placeholder', () => {
  render(<RemotePanel />)
  expect(screen.getByText(/coming soon/i)).toBeInTheDocument()
})
