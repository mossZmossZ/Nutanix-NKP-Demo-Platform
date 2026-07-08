import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

test('testing-library + jsdom render an existing component', () => {
  render(<Button>Hello</Button>)
  expect(screen.getByRole('button', { name: 'Hello' })).toBeInTheDocument()
})
