import type { ReactNode } from "react"
import type { Components } from "react-markdown"
import { CopyButton } from "@/components/CopyButton"

// Flattens a react-markdown element tree back to plain text so the copy
// button can copy the raw fenced-code content (rehype-highlight wraps
// tokens in nested <span>s, so children isn't already a plain string).
function textContent(node: ReactNode): string {
  if (typeof node === "string") return node
  if (typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(textContent).join("")
  if (node && typeof node === "object" && "props" in node) {
    const props = (node as { props?: { children?: ReactNode } }).props
    return textContent(props?.children)
  }
  return ""
}

// True for absolute URLs (http(s)://, protocol-relative //, or a root-relative
// path) — anything else is treated as relative to wiki/<slug>/images/.
function isAbsoluteUrl(src: string): boolean {
  return /^([a-z]+:)?\/\//i.test(src) || src.startsWith("/")
}

// Same element-to-token mapping as frontend/src/docs/mdx-components.tsx (the
// build-time MDX pipeline), adapted for react-markdown's runtime `components`
// prop since guide pages are raw markdown fetched over HTTP, not compiled MDX.
// A factory (not a static object) because `img` needs the lab's slug to
// resolve relative image paths through the guarded images route.
export function createMarkdownComponents(slug: string): Components {
  return {
    // react-markdown injects a `node` (hast node) prop into every override,
    // unlike the build-time MDX components this map is adapted from — drop it
    // before spreading the rest onto a real DOM element, or React warns
    // "does not recognize the `node` prop" on every guide render.
    h1: ({ node, ...props }) => <h1 className="mt-section first:mt-0 mb-lg text-h1 text-foreground" {...props} />,
    h2: ({ node, ...props }) => <h2 className="mt-xl mb-md text-h2 text-foreground" {...props} />,
    h3: ({ node, ...props }) => <h3 className="mt-lg mb-sm text-h3 text-foreground" {...props} />,
    p: ({ node, ...props }) => <p className="my-md text-body text-foreground" {...props} />,
    a: ({ node, ...props }) => <a className="text-blue-600 underline-offset-2 hover:underline" {...props} />,
    ul: ({ node, ...props }) => <ul className="my-md list-disc pl-lg text-body text-foreground [&_li]:mt-xs" {...props} />,
    ol: ({ node, ...props }) => <ol className="my-md list-decimal pl-lg text-body text-foreground [&_li]:mt-xs" {...props} />,
    strong: ({ node, ...props }) => <strong className="text-body font-semibold text-foreground" {...props} />,
    img: ({ node, src, alt, ...props }) => {
      // Authors write `![alt](images/foo.png)` (see Task 10's seed step), so
      // `src` already carries the `images/` segment — don't add it again, or
      // the URL doubles to `.../images/images/foo.png` and 404s against the
      // single-segment `:file` param `readImage` expects.
      const resolvedSrc =
        typeof src === "string" && !isAbsoluteUrl(src)
          ? `/api/me/labs/${slug}/${src.replace(/^\.\//, "")}`
          : src
      return (
        <img
          src={resolvedSrc}
          alt={alt ?? ""}
          loading="lazy"
          className="my-lg max-w-full rounded-md border border-border"
          {...props}
        />
      )
    },
    code: ({ node, className, ...props }) => (
      <code
        className={`rounded-sm bg-iris-50 px-xxs py-[2px] font-mono text-body-sm text-foreground ${className ?? ""}`}
        {...props}
      />
    ),
    pre: ({ node, children, ...props }) => (
      <pre
        className="group relative my-lg overflow-x-auto rounded-md border border-border bg-canvas p-lg font-mono text-body-sm text-foreground [&>code]:bg-transparent [&>code]:p-0 [&>code]:rounded-none [&>code]:text-inherit"
        {...props}
      >
        <span className="absolute right-sm top-sm opacity-0 transition-opacity duration-[var(--duration-fast)] ease-standard group-hover:opacity-100">
          <CopyButton value={textContent(children)} label="code" />
        </span>
        {children}
      </pre>
    ),
  }
}
