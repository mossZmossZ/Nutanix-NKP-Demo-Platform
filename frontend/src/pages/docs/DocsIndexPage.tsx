import { Link } from 'react-router-dom'
import { docsIndex } from '@/docs/registry'

export function DocsIndexPage() {
  return (
    <div className="mx-auto max-w-[700px] px-lg py-section">
      <h1 className="font-display text-display-lg text-ink">Documentation</h1>
      <ul className="mt-xl flex flex-col gap-lg">
        {docsIndex.map((doc) => (
          <li key={doc.slug}>
            <Link to={`/docs/${doc.slug}`} className="font-text text-body-strong text-primary">
              {doc.meta.title}
            </Link>
            <p className="mt-xxs font-text text-body text-ink-muted-80">{doc.meta.summary}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
