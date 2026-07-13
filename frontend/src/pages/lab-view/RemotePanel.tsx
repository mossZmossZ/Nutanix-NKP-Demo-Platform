import { MonitorPlay } from "lucide-react"

// Resting placeholder for the Remote Session view. Visual only — Phase 5 wires
// the real Guacamole socket here and swaps the subtext for live progress. The
// glyph pulses (frozen under prefers-reduced-motion by the global reset) to read
// as a "connecting" state without an infinite spinner implying an imminent
// connection that won't happen yet.
export function RemotePanel() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-sm px-xl py-xxl text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-violet-100 text-violet-600">
        <MonitorPlay className="size-7 animate-pulse" />
      </span>
      <h3 className="text-h4 text-foreground">Connecting to your desktop…</h3>
      <p className="max-w-sm text-body-sm text-muted-foreground">
        In-browser remote access activates in a later phase. Meanwhile, switch to the
        Credentials tab and connect with your own RDP client.
      </p>
    </div>
  )
}
