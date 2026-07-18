import { useEffect, useMemo, useState } from "react"
// selectedFile/onSelectFile are lifted to LabViewPage so the current page
// survives the >=1280 split <-> <1280 tabs remount when the viewport crosses the
// breakpoint.
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import { Check, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { api, ApiError } from "@/lib/api"
import { createMarkdownComponents } from "@/lib/markdown-components"

type Page = { file: string; order: number; title: string }

// Lab-guide font size is a per-user preference (px), owned by LabViewPage (from
// useAuth) and passed in. Matches the backend bounds; 16px is the design body
// size, so the guide body renders at `fontSize / 16` zoom — scaling the whole
// rendered doc (headings, code, images) proportionally.
const FONT_MIN = 12
const FONT_MAX = 24
const FONT_STEP = 2
const FONT_DEFAULT = 16

export function GuidePane({
  slug,
  pages,
  completedPages,
  onProgressChange,
  selectedFile,
  onSelectFile,
  fontSize = FONT_DEFAULT,
  onChangeFontSize,
}: {
  slug: string
  pages: Page[]
  completedPages: string[]
  onProgressChange: (completedPages: string[]) => void
  selectedFile: string | null
  onSelectFile: (file: string) => void
  fontSize?: number
  onChangeFontSize?: (size: number) => void
}) {
  const [content, setContent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [toggling, setToggling] = useState(false)
  const [toggleError, setToggleError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const markdownComponents = useMemo(() => createMarkdownComponents(slug), [slug])

  function changeFontSize(next: number) {
    const clamped = Math.min(FONT_MAX, Math.max(FONT_MIN, next))
    if (clamped === fontSize) return
    onChangeFontSize?.(clamped)
  }

  useEffect(() => {
    if (!selectedFile) return
    setContent(null)
    setError(null)
    setToggleError(null)
    api<{ file: string; content: string }>(`/me/labs/${slug}/pages/${selectedFile}`)
      .then((res) => setContent(res.content))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load page"))
  }, [slug, selectedFile, reloadKey])

  const index = pages.findIndex((p) => p.file === selectedFile)
  const isComplete = selectedFile ? completedPages.includes(selectedFile) : false
  const currentTitle = pages.find((p) => p.file === selectedFile)?.title ?? ""
  const completedCount = pages.filter((p) => completedPages.includes(p.file)).length
  const completionPct = pages.length ? (completedCount / pages.length) * 100 : 0

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
    <div className="h-full min-w-0 overflow-y-auto">
      <div className="sticky top-0 z-10 border-b border-border bg-surface">
        <div className="flex items-center justify-between gap-sm px-lg py-sm md:px-xl">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex min-w-0 items-center gap-xs rounded-md border border-border bg-surface px-sm py-xs text-body-sm font-medium text-foreground outline-none transition-colors duration-[var(--duration-base)] ease-standard hover:bg-accent">
              <span className="truncate">{currentTitle}</span>
              <span className="hidden shrink-0 text-muted-foreground sm:inline">
                Section {index + 1} of {pages.length}
              </span>
              <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              {pages.map((page) => (
                <DropdownMenuItem
                  key={page.file}
                  onSelect={() => onSelectFile(page.file)}
                  className={`gap-xs ${page.file === selectedFile ? "text-iris-600" : ""}`}
                >
                  {completedPages.includes(page.file) ? (
                    <Check className="size-3.5 shrink-0 text-success" />
                  ) : (
                    <span className="size-3.5 shrink-0" />
                  )}
                  <span className="truncate">{page.title}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex shrink-0 items-center gap-sm">
            <div className="flex items-center rounded-md border border-border" role="group" aria-label="Guide font size">
              <button
                type="button"
                aria-label="Decrease font size"
                disabled={fontSize <= FONT_MIN}
                onClick={() => changeFontSize(fontSize - FONT_STEP)}
                className="rounded-l-md px-sm py-xs text-body-sm font-medium text-muted-foreground outline-none transition-colors duration-[var(--duration-base)] ease-standard hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-40"
              >
                A<span className="text-label">−</span>
              </button>
              <button
                type="button"
                aria-label="Increase font size"
                disabled={fontSize >= FONT_MAX}
                onClick={() => changeFontSize(fontSize + FONT_STEP)}
                className="rounded-r-md border-l border-border px-sm py-xs text-body font-medium text-muted-foreground outline-none transition-colors duration-[var(--duration-base)] ease-standard hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-40"
              >
                A<span className="text-body-sm">+</span>
              </button>
            </div>
            <span className="text-body-sm text-muted-foreground">
              {completedCount} of {pages.length} done
            </span>
          </div>
        </div>
        <div className="h-1 w-full bg-border">
          <div
            className="h-full transition-[width] duration-[var(--duration-base)] ease-standard [background:var(--gradient-prism)]"
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </div>

      <div
        key={selectedFile ?? ""}
        style={{ zoom: fontSize / 16 }}
        className="@container min-w-0 px-lg py-lg duration-[var(--duration-base)] ease-standard animate-in fade-in slide-in-from-bottom-1 md:px-xl"
      >
        {error ? (
          <div role="alert" className="flex flex-col items-start gap-sm">
            <p className="text-body text-danger">{error}</p>
            <Button type="button" variant="secondary" onClick={() => setReloadKey((k) => k + 1)}>
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
                  aria-label="Back"
                  disabled={index <= 0}
                  onClick={() => onSelectFile(pages[index - 1].file)}
                >
                  <ChevronLeft className="size-4" />
                  <span className="hidden @[22rem]:inline">Back</span>
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
                  aria-label="Next"
                  disabled={index === -1 || index >= pages.length - 1}
                  onClick={() => onSelectFile(pages[index + 1].file)}
                >
                  <span className="hidden @[22rem]:inline">Next</span>
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
