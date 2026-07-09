import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { DocsIndexPage } from '@/pages/docs/DocsIndexPage'
import { DocPage } from '@/pages/docs/DocPage'

test('docs index lists the getting-started entry', () => {
  render(<MemoryRouter><DocsIndexPage /></MemoryRouter>)
  expect(screen.getByRole('link', { name: /getting started/i }))
    .toHaveAttribute('href', '/docs/getting-started')
})

test('unknown slug renders a not-found message', () => {
  render(
    <MemoryRouter initialEntries={['/docs/nope']}>
      <Routes><Route path="/docs/:slug" element={<DocPage />} /></Routes>
    </MemoryRouter>,
  )
  expect(screen.getByRole('heading', { name: /doc not found/i })).toBeInTheDocument()
})

test('known slug lazy-renders the MDX content', async () => {
  render(
    <MemoryRouter initialEntries={['/docs/getting-started']}>
      <Routes><Route path="/docs/:slug" element={<DocPage />} /></Routes>
    </MemoryRouter>,
  )
  expect(await screen.findByRole('heading', { name: /getting started/i })).toBeInTheDocument()
})
