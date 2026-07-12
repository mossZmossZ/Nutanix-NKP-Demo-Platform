import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { CopyButton } from '@/components/CopyButton'

test('copies the value to the clipboard and shows a confirmation state', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined)
  const user = userEvent.setup()
  // userEvent.setup() installs its own getter-only navigator.clipboard stub,
  // so it must be set up first and our stub applied after via
  // defineProperty (not Object.assign, which no-ops against a setter-less
  // accessor).
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  })

  render(<CopyButton value="secret-password" label="password" />)
  const button = screen.getByRole('button', { name: /copy password/i })

  expect(button.querySelector('[data-testid="copy-icon-state"]')).toHaveAttribute('data-copied', 'false')

  await user.click(button)

  expect(writeText).toHaveBeenCalledWith('secret-password')
  await waitFor(() =>
    expect(button.querySelector('[data-testid="copy-icon-state"]')).toHaveAttribute('data-copied', 'true'),
  )
})
