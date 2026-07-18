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
        <Link to="/docs" className="mt-lg inline-block text-body text-blue-600">
          ← All docs
        </Link>
      </div>
    )
  }

  if (entry.meta.pdfUrl) {
    // Immersive full-window reader: a fixed overlay covers the whole viewport
    // (site nav included). The slim top bar is the only chrome — the back link
    // is the escape, the "open in new tab" link the fallback if an embed fails.
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-surface">
        <div className="flex items-center gap-lg bg-navy-900 px-lg py-sm">
          <Link to="/docs" className="shrink-0 text-body-sm text-navy-fg hover:text-white">
            ← All docs
          </Link>
          <span className="min-w-0 flex-1 truncate text-body-sm font-medium text-white">
            {entry.meta.title}
          </span>
          <a
            href={entry.meta.pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 text-body-sm text-navy-fg hover:text-white"
          >
            Open in new tab ↗
          </a>
        </div>
        <iframe
          title={entry.meta.title}
          src={entry.meta.pdfUrl}
          className="min-h-0 w-full flex-1"
        />
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
