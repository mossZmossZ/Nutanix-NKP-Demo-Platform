import { Link } from 'react-router-dom'
import { docsIndex } from '@/docs/registry'

export function DocsIndexPage() {
  return (
    <div className="mx-auto max-w-[700px] px-lg py-section">
      <h1 className="text-h1 text-foreground">Documentation</h1>
      <ul className="mt-xl flex flex-col gap-lg">
        {docsIndex.map((doc) => (
          <li key={doc.slug}>
            <Link
              to={`/docs/${doc.slug}`}
              className="block rounded-lg border border-border bg-surface p-lg transition-shadow duration-[var(--duration-fast)] ease-standard hover:shadow"
            >
              <div className="flex items-center gap-sm">
                <h2 className="text-h4 text-foreground">{doc.meta.title}</h2>
                {doc.meta.pdfUrl && (
                  <span className="rounded-full bg-primary/10 px-sm py-xxs text-body-sm font-medium text-primary">
                    PDF
                  </span>
                )}
              </div>
              <p className="mt-xxs text-body-sm text-muted-foreground">{doc.meta.summary}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
