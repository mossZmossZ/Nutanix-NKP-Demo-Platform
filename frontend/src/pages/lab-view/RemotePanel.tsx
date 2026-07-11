import { MonitorOff } from "lucide-react"

export function RemotePanel() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-sm px-xl py-xxl text-center">
      <MonitorOff className="size-8 text-muted-foreground" />
      <h3 className="text-h4 text-foreground">Live desktop is coming soon</h3>
      <p className="max-w-sm text-body-sm text-muted-foreground">
        In-browser remote access lands in a later phase. In the meantime, connect with your own
        RDP client using the credentials on the Credentials tab.
      </p>
    </div>
  )
}
