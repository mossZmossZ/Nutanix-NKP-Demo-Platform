import type { ComponentType } from 'react'

export type DocMeta = { title: string; summary: string; order: number }
export type DocEntry = {
  slug: string
  meta: DocMeta
  load: () => Promise<{ default: ComponentType }>
}

// Build-time globs over the repo-root /docs-content folder (see vite fs.allow).
// One eager glob pulls ONLY the frontmatter export (for the index); a second
// lazy glob provides the compiled component on demand.
const metas = import.meta.glob<DocMeta>('../../../docs-content/*.mdx', {
  eager: true,
  import: 'frontmatter',
})
const loaders = import.meta.glob<{ default: ComponentType }>(
  '../../../docs-content/*.mdx',
)

function slugOf(path: string): string {
  return path.split('/').pop()!.replace(/\.mdx$/, '')
}

export const docsIndex: DocEntry[] = Object.entries(metas)
  .map(([path, meta]) => ({
    slug: slugOf(path),
    meta,
    load: loaders[path] as () => Promise<{ default: ComponentType }>,
  }))
  .sort((a, b) => a.meta.order - b.meta.order || a.slug.localeCompare(b.slug))

export function getDoc(slug: string): DocEntry | undefined {
  return docsIndex.find((d) => d.slug === slug)
}
