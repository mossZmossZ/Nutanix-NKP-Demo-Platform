import { Skeleton } from "@/components/ui/skeleton"

// design.md §7 — Suspense fallbacks are branded skeletons, never a blank screen
// or raw spinner. Two shapes: a centered block for public/login routes, and a
// shell-shaped one for app routes so the sidebar/top bar read instantly and only
// the content region appears to load.

export function PageFallback() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-md px-lg py-section">
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-5/6" />
      <Skeleton className="mt-md h-64 w-full rounded-lg" />
    </div>
  )
}

export function AppFallback() {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 shrink-0 border-r border-border bg-surface">
        <div className="flex h-16 items-center border-b border-border px-lg">
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="flex flex-col gap-xs p-sm">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-xl">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-8 w-28 rounded-md" />
        </header>
        <main className="flex-1 bg-canvas px-xl py-lg">
          <div className="mx-auto max-w-3xl">
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
        </main>
      </div>
    </div>
  )
}
