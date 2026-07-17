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
        <h1 className="text-h2 text-foreground">Doc not found</h1>
        <p className="mt-md text-body text-muted-foreground">
          No document matches "{slug}".
        </p>
        <Link to="/docs" className="mt-lg inline-block text-body text-primary">
          ← All docs
        </Link>
      </div>
    )
  }

  if (entry.meta.pdfUrl) {
    return (
      <div className="mx-auto max-w-[900px] px-lg py-section">
        <Link to="/docs" className="text-body-sm text-primary">
          ← All docs
        </Link>
        <h1 className="mt-md text-h1 text-foreground">{entry.meta.title}</h1>
        {entry.meta.summary && (
          <p className="mt-xs text-body text-muted-foreground">{entry.meta.summary}</p>
        )}
        <a
          href={entry.meta.pdfUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-lg inline-block text-body-sm text-primary"
        >
          Open in new tab ↗
        </a>
        <div className="mt-sm overflow-hidden rounded-lg border border-border shadow">
          <iframe
            title={entry.meta.title}
            src={entry.meta.pdfUrl}
            className="h-[calc(100vh-320px)] min-h-[480px] w-full"
          />
        </div>
      </div>
    )
  }

  return (
    <article className="mx-auto max-w-[700px] px-lg py-section">
      <MDXProvider components={mdxComponents}>
        <Suspense fallback={<p className="text-body text-muted-foreground">Loading…</p>}>
          <Doc />
        </Suspense>
      </MDXProvider>
    </article>
  )
}
