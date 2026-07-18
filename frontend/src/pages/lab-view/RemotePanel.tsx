import { Loader2, Power, RotateCw, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { RemoteSession } from "@/lib/useRemoteSession"

const STATUS: Record<
  RemoteSession["state"],
  { dot: string; label: string; pulse?: boolean }
> = {
  connecting: { dot: "bg-warning", label: "Connecting", pulse: true },
  connected: { dot: "bg-success", label: "Connected" },
  disconnected: { dot: "bg-muted-foreground", label: "Disconnected" },
  error: { dot: "bg-danger", label: "Disconnected" },
}

// The live desktop. The canvas itself lives in a React-external node injected by
// session.attach; this component only renders the chrome (status strip +
// controls) and the resting/connecting/error overlays on top of it.
export function RemotePanel({ session, label }: { session: RemoteSession; label: string }) {
  const status = STATUS[session.state]
  const isLive = session.state === "connected"

  return (
    <div className="flex h-full flex-col bg-navy-900">
      {/* Status strip. Connected state gets the prism top edge (design-v2.md §1.3.4). */}
      <div
        className={`relative flex shrink-0 items-center justify-between gap-sm border-b border-white/10 bg-navy-800 px-md py-xs ${
          isLive
            ? 'before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:content-[""] before:[background:var(--gradient-prism)]'
            : ""
        }`}
      >
        <span className="flex items-center gap-xs text-body-sm text-white/80">
          <span
            className={`size-2 rounded-full ${status.dot} ${status.pulse ? "animate-pulse" : ""}`}
          />
          <span className="font-medium">{status.label}</span>
          <span className="text-white/40">·</span>
          <span className="truncate font-mono text-white/50">{label}</span>
        </span>
        <span className="flex items-center gap-xs">
          {isLive ? (
            <Button
              variant="ghost"
              onClick={session.disconnect}
              className="h-7 gap-xs text-white/70 hover:bg-white/10 hover:text-white"
            >
              <Power className="size-3.5" />
              Disconnect
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={session.reconnect}
              className="h-7 gap-xs text-white/70 hover:bg-white/10 hover:text-white"
            >
              <RotateCw className="size-3.5" />
              Reconnect
            </Button>
          )}
        </span>
      </div>

      {/* Canvas + overlays */}
      <div className="relative min-h-0 flex-1">
        {/* Persistent remote canvas mounts here (re-parented across remounts). */}
        <div ref={session.attach} className="absolute inset-0 flex items-center justify-center" />

        {session.state === "connecting" && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-sm bg-navy-900/80 text-center duration-[var(--duration-base)] ease-standard animate-in fade-in">
            <Loader2 className="size-8 animate-spin text-iris-600" />
            <p className="text-body-sm text-white/70">Connecting to your desktop…</p>
          </div>
        )}

        {session.state === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-sm bg-navy-900/90 px-xl text-center duration-[var(--duration-base)] ease-standard animate-in fade-in">
            <span className="flex size-14 items-center justify-center rounded-full bg-danger/15 text-danger">
              <TriangleAlert className="size-7" />
            </span>
            <h3 className="text-h4 text-white">Lost connection to your desktop</h3>
            <p className="max-w-[24rem] text-body-sm text-white/60">
              Your desktop may still be starting up. Try reconnecting in a moment.
            </p>
            <Button onClick={session.reconnect} className="mt-xs gap-xs">
              <RotateCw className="size-4" />
              Reconnect
            </Button>
          </div>
        )}

        {session.state === "disconnected" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-sm bg-navy-900/90 px-xl text-center duration-[var(--duration-base)] ease-standard animate-in fade-in">
            <span className="flex size-14 items-center justify-center rounded-full bg-white/10 text-white/70">
              <Power className="size-7" />
            </span>
            <h3 className="text-h4 text-white">Session disconnected</h3>
            <Button onClick={session.reconnect} className="mt-xs gap-xs">
              <RotateCw className="size-4" />
              Reconnect
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
