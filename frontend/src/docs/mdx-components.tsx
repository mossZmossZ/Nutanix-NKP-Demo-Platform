import type { ComponentPropsWithoutRef, ReactNode } from 'react'

// Every element maps to a DESIGN.md token — no inline hex, no weight 500.
export function Callout({
  type = 'note',
  children,
}: {
  type?: 'note' | 'warning'
  children: ReactNode
}) {
  // Single-accent system: both variants use the primary family; warning is
  // distinguished by a stronger left border weight, not a second color.
  const border = type === 'warning' ? 'border-l-[6px]' : 'border-l-[3px]'
  return (
    <div
      role="note"
      className={`my-lg ${border} border-primary bg-canvas-parchment rounded-sm px-lg py-md font-text text-body text-ink`}
    >
      {children}
    </div>
  )
}

export function Steps({ children }: { children: ReactNode }) {
  return (
    <div className="my-lg [&_ol]:list-decimal [&_ol]:pl-lg [&_li]:mt-xs font-text text-body text-ink">
      {children}
    </div>
  )
}

export const mdxComponents = {
  h1: (p: ComponentPropsWithoutRef<'h1'>) => (
    <h1 className="mt-section first:mt-0 mb-lg font-display text-display-lg text-ink" {...p} />
  ),
  h2: (p: ComponentPropsWithoutRef<'h2'>) => (
    <h2 className="mt-xl mb-md font-display text-display-md text-ink" {...p} />
  ),
  h3: (p: ComponentPropsWithoutRef<'h3'>) => (
    <h3 className="mt-lg mb-sm font-text text-tagline text-ink" {...p} />
  ),
  p: (p: ComponentPropsWithoutRef<'p'>) => (
    <p className="my-md font-text text-body text-ink" {...p} />
  ),
  a: (p: ComponentPropsWithoutRef<'a'>) => (
    <a className="text-primary underline-offset-2 hover:underline" {...p} />
  ),
  ul: (p: ComponentPropsWithoutRef<'ul'>) => (
    <ul className="my-md list-disc pl-lg font-text text-body text-ink [&_li]:mt-xs" {...p} />
  ),
  ol: (p: ComponentPropsWithoutRef<'ol'>) => (
    <ol className="my-md list-decimal pl-lg font-text text-body text-ink [&_li]:mt-xs" {...p} />
  ),
  strong: (p: ComponentPropsWithoutRef<'strong'>) => (
    <strong className="font-text text-body-strong text-ink" {...p} />
  ),
  code: (p: ComponentPropsWithoutRef<'code'>) => (
    <code className="rounded-xs bg-canvas-parchment px-xxs py-[2px] font-mono text-caption text-ink" {...p} />
  ),
  // Fenced blocks compile to <pre><code>, so both entries apply, nested.
  // Neutralize the inline-code chip styling on the nested `code` so the
  // fenced block renders as one clean dark box instead of a light chip
  // sitting inside a dark one.
  pre: (p: ComponentPropsWithoutRef<'pre'>) => (
    <pre
      className="my-lg overflow-x-auto rounded-md bg-surface-tile-1 p-lg font-mono text-caption text-on-dark [&>code]:bg-transparent [&>code]:p-0 [&>code]:rounded-none [&>code]:text-inherit"
      {...p}
    />
  ),
  Callout,
  Steps,
}
