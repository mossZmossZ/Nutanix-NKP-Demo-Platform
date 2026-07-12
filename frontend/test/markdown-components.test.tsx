import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { vi } from 'vitest'
import { createMarkdownComponents } from '@/lib/markdown-components'

const sample = '# Title\n\nSome *text*.\n\n```yaml\nkey: value\n```\n'

test('renders headings/paragraphs on design tokens and a copyable fenced code block', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined)
  const user = userEvent.setup()
  // Assign after setup(): user-event's setup() installs its own clipboard stub.
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })

  render(
    <ReactMarkdown
      components={createMarkdownComponents('nkp-basics')}
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
    >
      {sample}
    </ReactMarkdown>,
  )

  const heading = screen.getByRole('heading', { level: 1, name: 'Title' })
  expect(heading).toHaveClass('text-h1')

  await user.click(screen.getByRole('button', { name: /copy code/i }))
  expect(writeText).toHaveBeenCalledWith(expect.stringContaining('key: value'))
})

test('rewrites a relative image src to the guarded images route for the given slug', () => {
  render(
    <ReactMarkdown components={createMarkdownComponents('nkp-basics')} remarkPlugins={[remarkGfm]}>
      {'![diagram](images/diagram.png)'}
    </ReactMarkdown>,
  )
  expect(screen.getByRole('img', { name: 'diagram' })).toHaveAttribute(
    'src',
    '/api/me/labs/nkp-basics/images/diagram.png',
  )
})

test('leaves an already-absolute image src untouched', () => {
  render(
    <ReactMarkdown components={createMarkdownComponents('nkp-basics')} remarkPlugins={[remarkGfm]}>
      {'![external](https://example.com/pic.png)'}
    </ReactMarkdown>,
  )
  expect(screen.getByRole('img', { name: 'external' })).toHaveAttribute('src', 'https://example.com/pic.png')
})
