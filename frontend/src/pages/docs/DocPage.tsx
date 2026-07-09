import { Suspense, lazy, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MDXProvider } from '@mdx-js/react'
import { getDoc } from '@/docs/registry'
import { mdxComponents } from '@/docs/mdx-components'

export function DocPage() {
  const { slug } = useParams()
  const entry = slug ? getDoc(slug) : undefined

  const Doc = useMemo(
    () => (entry ? lazy(() => entry.load()) : null),
    [entry],
  )

  if (!entry || !Doc) {
    return (
      <div className="mx-auto max-w-[700px] px-lg py-section">
        <h1 className="font-display text-display-md text-ink">Doc not found</h1>
        <p className="mt-md font-text text-body text-ink-muted-80">
          No document matches "{slug}".
        </p>
        <Link to="/docs" className="mt-lg inline-block font-text text-body text-primary">
          ← All docs
        </Link>
      </div>
    )
  }

  return (
    <article className="mx-auto max-w-[700px] px-lg py-section">
      <MDXProvider components={mdxComponents}>
        <Suspense fallback={<p className="font-text text-body text-ink-muted-48">Loading…</p>}>
          <Doc />
        </Suspense>
      </MDXProvider>
    </article>
  )
}
