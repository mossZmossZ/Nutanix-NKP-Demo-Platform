// Pure CSS "product" visual — a browser window showing the split lab UI
// (guide | terminal). Carries the single system shadow (DESIGN.md).
export function BrowserMockup() {
  return (
    <div className="mx-auto w-full max-w-[820px] overflow-hidden rounded-lg bg-canvas shadow-product">
      {/* title bar */}
      <div className="flex items-center gap-xs border-b border-hairline bg-canvas-parchment px-md py-sm">
        <span className="size-[10px] rounded-full bg-hairline" />
        <span className="size-[10px] rounded-full bg-hairline" />
        <span className="size-[10px] rounded-full bg-hairline" />
      </div>
      {/* split panes */}
      <div className="grid grid-cols-2">
        <div className="border-r border-hairline p-lg">
          <p className="font-display text-tagline text-ink">Lab 1 · Deploy NKP</p>
          <div className="mt-md space-y-xs">
            <div className="h-[8px] w-full rounded-pill bg-canvas-parchment" />
            <div className="h-[8px] w-4/5 rounded-pill bg-canvas-parchment" />
            <div className="h-[8px] w-3/5 rounded-pill bg-canvas-parchment" />
          </div>
        </div>
        <div className="bg-surface-tile-1 p-lg font-mono text-caption text-on-dark">
          <p>$ kubectl get nodes</p>
          <p className="text-body-muted">NAME STATUS ROLES</p>
          <p className="text-body-muted">nkp-1 Ready control-plane</p>
        </div>
      </div>
    </div>
  )
}
