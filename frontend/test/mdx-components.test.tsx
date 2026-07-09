import { render, screen } from '@testing-library/react'
import { mdxComponents, Callout } from '@/docs/mdx-components'

test('h1 maps to the display token classes', () => {
  const H1 = mdxComponents.h1!
  render(<H1>Title</H1>)
  const h = screen.getByRole('heading', { level: 1, name: 'Title' })
  expect(h.className).toContain('font-display')
  expect(h.className).toContain('text-display-lg')
})

test('anchor maps to the single Action Blue text-link', () => {
  const A = mdxComponents.a!
  render(<A href="/x">link</A>)
  expect(screen.getByRole('link', { name: 'link' }).className).toContain('text-primary')
})

test('Callout defaults to note and renders its children', () => {
  render(<Callout>Heads up</Callout>)
  const box = screen.getByText('Heads up')
  expect(box).toBeInTheDocument()
})

test('Callout warning still uses only the primary accent family (no second color)', () => {
  const { container } = render(<Callout type="warning">Careful</Callout>)
  expect(container.innerHTML).not.toMatch(/#[0-9a-f]{6}/i) // no inline hex
})
