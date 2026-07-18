import ReactMarkdown from "react-markdown"
import rehypeHighlight from "rehype-highlight"
import { CopyButton } from "@/components/CopyButton"

export type LabCredential = {
  id: string
  label: string
  type: "endpoint" | "yaml" | "text"
  value: string
}

export function CredentialsPanel({ credentials }: { credentials: LabCredential[] }) {
  if (credentials.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-xl">
        <p className="text-body-sm text-muted-foreground">No credentials for this lab yet.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-md p-xl">
      <div>
        <h3 className="text-h4 text-foreground">Lab credentials</h3>
        <p className="mt-xxs text-body-sm text-muted-foreground">
          Your access details for this lab. Use the copy buttons to grab a value.
        </p>
      </div>
      {credentials.map((cred) => (
        <div key={cred.id} className="flex flex-col gap-xxs rounded-md border border-border bg-surface p-md">
          <span className="text-label text-muted-foreground">{cred.label}</span>
          {cred.type === "yaml" ? (
            <div className="relative">
              <div className="absolute right-xs top-xs z-10">
                <CopyButton value={cred.value} label={cred.label} />
              </div>
              <div className="overflow-x-auto text-body-sm [&_pre]:!m-0 [&_pre]:rounded-md [&_pre]:bg-iris-50 [&_pre]:p-md">
                <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                  {`\`\`\`yaml\n${cred.value}\n\`\`\``}
                </ReactMarkdown>
              </div>
            </div>
          ) : cred.type === "endpoint" ? (
            <div className="flex items-center justify-between gap-sm">
              <a
                href={cred.value}
                target="_blank"
                rel="noreferrer"
                className="truncate font-mono text-body text-blue-600 underline-offset-2 hover:underline"
              >
                {cred.value}
              </a>
              <CopyButton value={cred.value} label={cred.label} />
            </div>
          ) : (
            <div className="flex items-center justify-between gap-sm">
              <span className="truncate font-mono text-body text-foreground">{cred.value}</span>
              <CopyButton value={cred.value} label={cred.label} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
