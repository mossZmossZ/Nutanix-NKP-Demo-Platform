import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import {
  TwelveFactorsGrid,
  ConfigInEnvironment,
  BuildReleaseRun,
  MonolithVsMicroservices,
  StatelessScaling,
  TwelveFactorToKubernetes,
} from './diagrams'

// Every element maps to a design.md token — no inline hex, no weight 500.
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
      className={`my-lg ${border} border-primary bg-iris-50 rounded-sm px-lg py-md text-body text-foreground`}
    >
      {children}
    </div>
  )
}

export function Steps({ children }: { children: ReactNode }) {
  return (
    <div className="my-lg [&_ol]:list-decimal [&_ol]:pl-lg [&_li]:mt-xs text-body text-foreground">
      {children}
    </div>
  )
}

export const mdxComponents = {
  h1: (p: ComponentPropsWithoutRef<'h1'>) => (
    <h1 className="mt-section first:mt-0 mb-lg text-h1 text-foreground" {...p} />
  ),
  h2: (p: ComponentPropsWithoutRef<'h2'>) => (
    <h2 className="mt-xl mb-md text-h2 text-foreground" {...p} />
  ),
  h3: (p: ComponentPropsWithoutRef<'h3'>) => (
    <h3 className="mt-lg mb-sm text-h3 text-foreground" {...p} />
  ),
  p: (p: ComponentPropsWithoutRef<'p'>) => (
    <p className="my-md text-body text-foreground" {...p} />
  ),
  a: (p: ComponentPropsWithoutRef<'a'>) => (
    <a className="text-blue-600 underline-offset-2 hover:underline" {...p} />
  ),
  ul: (p: ComponentPropsWithoutRef<'ul'>) => (
    <ul className="my-md list-disc pl-lg text-body text-foreground [&_li]:mt-xs" {...p} />
  ),
  ol: (p: ComponentPropsWithoutRef<'ol'>) => (
    <ol className="my-md list-decimal pl-lg text-body text-foreground [&_li]:mt-xs" {...p} />
  ),
  strong: (p: ComponentPropsWithoutRef<'strong'>) => (
    <strong className="text-body font-semibold text-foreground" {...p} />
  ),
  code: (p: ComponentPropsWithoutRef<'code'>) => (
    <code className="rounded-sm bg-iris-50 px-xxs py-[2px] font-mono text-body-sm text-foreground" {...p} />
  ),
  // Fenced blocks compile to <pre><code>, so both entries apply, nested.
  // Neutralize the inline-code chip styling on the nested `code` so the
  // fenced block renders as one clean surface box rather than a chip
  // nested inside another chip.
  pre: (p: ComponentPropsWithoutRef<'pre'>) => (
    <pre
      className="my-lg overflow-x-auto rounded-md border border-border bg-canvas p-lg font-mono text-body-sm text-foreground [&>code]:bg-transparent [&>code]:p-0 [&>code]:rounded-none [&>code]:text-inherit"
      {...p}
    />
  ),
  Callout,
  Steps,
  TwelveFactorsGrid,
  ConfigInEnvironment,
  BuildReleaseRun,
  MonolithVsMicroservices,
  StatelessScaling,
  TwelveFactorToKubernetes,
}
