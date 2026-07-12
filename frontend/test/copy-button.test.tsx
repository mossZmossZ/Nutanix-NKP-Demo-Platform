import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { CopyButton } from '@/components/CopyButton'

test('copies the value to the clipboard and shows a confirmation state', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined)
  const user = userEvent.setup()
  // Assign after setup(): user-event's setup() installs its own clipboard
  // stub, so our mock must overwrite it, not the other way around.
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })

  render(<CopyButton value="secret-password" label="password" />)
  const button = screen.getByRole('button', { name: /copy password/i })

  expect(button.querySelector('[data-testid="copy-icon-state"]')).toHaveAttribute('data-copied', 'false')

  await user.click(button)

  expect(writeText).toHaveBeenCalledWith('secret-password')
  await waitFor(() =>
    expect(button.querySelector('[data-testid="copy-icon-state"]')).toHaveAttribute('data-copied', 'true'),
  )
})
