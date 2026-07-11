import { CopyButton } from "@/components/CopyButton"

export function CredentialsPanel({
  connection,
}: {
  connection: { rdpHost: string; rdpPort: number; rdpUser: string; rdpPassword: string }
}) {
  const fields = [
    { label: "Host", value: `${connection.rdpHost}:${connection.rdpPort}` },
    { label: "Username", value: connection.rdpUser },
    { label: "Password", value: connection.rdpPassword },
  ]

  return (
    <div className="flex flex-col gap-md p-xl">
      <div>
        <h3 className="text-h4 text-foreground">Connection details</h3>
        <p className="mt-xxs text-body-sm text-muted-foreground">
          Use these credentials with your own RDP client to reach the lab desktop.
        </p>
      </div>
      {fields.map((field) => (
        <div key={field.label} className="flex flex-col gap-xxs rounded-md border border-border bg-surface p-md">
          <span className="text-label text-muted-foreground">{field.label}</span>
          <div className="flex items-center justify-between gap-sm">
            <span className="font-mono text-body tabular-nums text-foreground">{field.value}</span>
            <CopyButton value={field.value} label={field.label.toLowerCase()} />
          </div>
        </div>
      ))}
    </div>
  )
}
