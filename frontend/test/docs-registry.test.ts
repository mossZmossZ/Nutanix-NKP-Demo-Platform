import { docsIndex, getDoc } from '@/docs/registry'

test('registry lists the seeded getting-started doc with frontmatter', () => {
  const entry = docsIndex.find((d) => d.slug === 'getting-started')
  expect(entry).toBeDefined()
  expect(entry!.meta.title).toBe('Getting Started')
  expect(entry!.meta.summary).toMatch(/NKP lab/)
  expect(entry!.meta.order).toBe(1)
})

test('docsIndex is sorted by order then slug', () => {
  const orders = docsIndex.map((d) => d.meta.order)
  expect(orders).toEqual([...orders].sort((a, b) => a - b))
})

test('getDoc returns the entry for a known slug and undefined otherwise', () => {
  expect(getDoc('getting-started')?.slug).toBe('getting-started')
  expect(getDoc('does-not-exist')).toBeUndefined()
})

test('getDoc entry exposes a lazy component loader', async () => {
  const mod = await getDoc('getting-started')!.load()
  expect(typeof mod.default).toBe('function')
})
