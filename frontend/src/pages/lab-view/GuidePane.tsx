import { useEffect, useMemo, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import { Check, ChevronLeft, ChevronRight, RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { api, ApiError } from "@/lib/api"
import { createMarkdownComponents } from "@/lib/markdown-components"

type Page = { file: string; order: number; title: string }

export function GuidePane({
  slug,
  pages,
  completedPages,
  onProgressChange,
}: {
  slug: string
  pages: Page[]
  completedPages: string[]
  onProgressChange: (completedPages: string[]) => void
}) {
  const [selectedFile, setSelectedFile] = useState<string | null>(pages[0]?.file ?? null)
  const [content, setContent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const [toggling, setToggling] = useState(false)
  const [toggleError, setToggleError] = useState<string | null>(null)
  const markdownComponents = useMemo(() => createMarkdownComponents(slug), [slug])

  useEffect(() => {
    if (!selectedFile) return
    setContent(null)
    setError(null)
    setToggleError(null)
    api<{ file: string; content: string }>(`/me/labs/${slug}/pages/${selectedFile}`)
      .then((res) => setContent(res.content))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load page"))
  }, [slug, selectedFile, reloadToken])

  const index = pages.findIndex((p) => p.file === selectedFile)
  const isComplete = selectedFile ? completedPages.includes(selectedFile) : false

  async function toggleComplete() {
    if (!selectedFile) return
    setToggling(true)
    setToggleError(null)
    try {
      const res = await api<{ completedPages: string[] }>(`/me/labs/${slug}/progress`, {
        method: "POST",
        body: JSON.stringify({ file: selectedFile, completed: !isComplete }),
      })
      onProgressChange(res.completedPages)
    } catch (err) {
      setToggleError(err instanceof ApiError ? err.message : "Failed to update progress")
    } finally {
      setToggling(false)
    }
  }

  return (
    <div className="flex h-full">
      <nav className="w-48 shrink-0 overflow-y-auto border-r border-border bg-surface p-sm">
        <span className="block px-sm pt-xs pb-xxs text-label uppercase tracking-wide text-muted-foreground">
          Guide
        </span>
        {pages.map((page) => (
          <button
            key={page.file}
            type="button"
            onClick={() => setSelectedFile(page.file)}
            className={`flex w-full items-center gap-xs rounded-md px-sm py-xs text-left text-body-sm font-medium transition-colors duration-[var(--duration-base)] ease-standard ${
              page.file === selectedFile
                ? "bg-violet-100 text-violet-600"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            {completedPages.includes(page.file) ? (
              <Check className="size-3.5 shrink-0 text-success" />
            ) : (
              <span className="size-3.5 shrink-0" />
            )}
            <span className="truncate">{page.title}</span>
          </button>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto px-xl py-lg">
        {error ? (
          <div className="flex flex-col items-start gap-sm">
            <p role="alert" className="text-body text-danger">
              {error}
            </p>
            <Button type="button" variant="secondary" onClick={() => setReloadToken((t) => t + 1)}>
              <RotateCw className="size-4" />
              Retry
            </Button>
          </div>
        ) : content === null ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <>
            <ReactMarkdown
              components={markdownComponents}
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
            >
              {content}
            </ReactMarkdown>

            <div className="mt-xl flex flex-col gap-sm border-t border-border pt-lg">
              {toggleError && (
                <p role="alert" className="text-body-sm text-danger">
                  {toggleError}
                </p>
              )}
              <div className="flex items-center justify-between gap-sm">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={index <= 0}
                  onClick={() => setSelectedFile(pages[index - 1].file)}
                >
                  <ChevronLeft className="size-4" />
                  Back
                </Button>
                <Button
                  type="button"
                  variant={isComplete ? "secondary" : "primary"}
                  disabled={toggling}
                  onClick={toggleComplete}
                >
                  <Check className="size-4" />
                  {isComplete ? "Completed" : "Mark complete"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={index === -1 || index >= pages.length - 1}
                  onClick={() => setSelectedFile(pages[index + 1].file)}
                >
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
