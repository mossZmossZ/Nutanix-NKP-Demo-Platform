// Pure CSS "product" visual — a browser window showing the split lab UI
// (guide | terminal). Carries the single system shadow (design.md §3 shadow-md).
export function BrowserMockup() {
  return (
    <div className="mx-auto w-full max-w-[820px] overflow-hidden rounded-lg bg-canvas shadow-md">
      {/* title bar */}
      <div className="flex items-center gap-xs border-b border-border bg-surface px-md py-sm">
        <span className="size-[10px] rounded-full bg-border" />
        <span className="size-[10px] rounded-full bg-border" />
        <span className="size-[10px] rounded-full bg-border" />
      </div>
      {/* split panes */}
      <div className="grid grid-cols-2">
        <div className="border-r border-border bg-surface p-lg">
          <p className="text-h4 text-foreground">Lab 1 · Deploy NKP</p>
          <div className="mt-md space-y-xs">
            <div className="h-[8px] w-full rounded-full bg-border" />
            <div className="h-[8px] w-4/5 rounded-full bg-border" />
            <div className="h-[8px] w-3/5 rounded-full bg-border" />
          </div>
        </div>
        <div className="bg-ink-900 p-lg font-mono text-body-sm text-primary-foreground">
          <p>$ kubectl get nodes</p>
          <p className="text-primary-foreground/60">NAME STATUS ROLES</p>
          <p className="text-primary-foreground/60">nkp-1 Ready control-plane</p>
        </div>
      </div>
    </div>
  )
}
