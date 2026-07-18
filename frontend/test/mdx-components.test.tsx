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
  expect(screen.getByRole('link', { name: 'link' }).className).toContain('text-blue-600')
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

test('standalone inline code still renders the light parchment chip', () => {
  const Code = mdxComponents.code!
  const { container } = render(<Code>const x = 1</Code>)
  const code = container.querySelector('code')!
  expect(code.className).toContain('bg-canvas-parchment')
})

test('fenced code block (pre > code) neutralizes the nested chip so the block stays one dark box', () => {
  const Pre = mdxComponents.pre!
  const Code = mdxComponents.code!
  const { container } = render(
    <Pre>
      <Code>const x = 1</Code>
    </Pre>,
  )
  const pre = container.querySelector('pre')!
  expect(pre.className).toContain('bg-surface-tile-1')
  // pre must neutralize the nested code's own chip styling so it doesn't
  // visually override the dark block with a light background.
  expect(pre.className).toContain('[&>code]:bg-transparent')

  const code = container.querySelector('pre code')!
  expect(code.className).toContain('bg-canvas-parchment') // code's own class is unchanged...
  expect(pre.className).toContain('[&>code]:bg-transparent') // ...but pre neutralizes it in the cascade
})
