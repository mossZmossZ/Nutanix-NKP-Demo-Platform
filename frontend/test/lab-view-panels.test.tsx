import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { CredentialsPanel } from '@/pages/lab-view/CredentialsPanel'
import { RemotePanel } from '@/pages/lab-view/RemotePanel'
import type { RemoteSession } from '@/lib/useRemoteSession'

test('CredentialsPanel shows lab credentials and copies a value on click', async () => {
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

  render(
    <CredentialsPanel
      credentials={[
        { id: '1', label: 'namespace', type: 'text', value: 'team-a', groupId: null },
        { id: '2', label: 'dashboard', type: 'endpoint', value: 'https://nkp.example', groupId: null },
      ]}
    />,
  )

  expect(screen.getByText('team-a')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: /copy dashboard/i }))
  expect(writeText).toHaveBeenCalledWith('https://nkp.example')
})

test('CredentialsPanel renders credentials under group headings, ungrouped under Other', () => {
  render(
    <CredentialsPanel
      groups={[{ id: 'g1', name: 'Cluster access' }]}
      credentials={[
        { id: '1', label: 'kubeconfig', type: 'text', value: 'abc', groupId: 'g1' },
        { id: '2', label: 'loose', type: 'text', value: 'xyz', groupId: null },
      ]}
    />,
  )
  expect(screen.getByText('Cluster access')).toBeInTheDocument()
  expect(screen.getByText('Other')).toBeInTheDocument()
  expect(screen.getByText('kubeconfig')).toBeInTheDocument()
  expect(screen.getByText('loose')).toBeInTheDocument()
})

test('CredentialsPanel shows no group headings when a lab has no groups', () => {
  render(
    <CredentialsPanel
      credentials={[{ id: '1', label: 'namespace', type: 'text', value: 'team-a', groupId: null }]}
    />,
  )
  expect(screen.queryByText('Other')).not.toBeInTheDocument()
  expect(screen.getByText('namespace')).toBeInTheDocument()
})

test('CredentialsPanel shows an empty state when there are no credentials', () => {
  render(<CredentialsPanel credentials={[]} />)
  expect(screen.getByText(/no credentials for this lab/i)).toBeInTheDocument()
})

test('RemotePanel shows the connecting placeholder', () => {
  const session = {
    state: 'connecting',
    attach: () => {},
    disconnect: vi.fn(),
    reconnect: vi.fn(),
  } as unknown as RemoteSession
  render(<RemotePanel session={session} label="nkp-lab" />)
  expect(screen.getByText(/connecting to your desktop/i)).toBeInTheDocument()
})
