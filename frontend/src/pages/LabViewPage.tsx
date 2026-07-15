import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { AppShell, type NavItem } from "@/layouts/AppShell"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { FlaskConical } from "lucide-react"
import { api, ApiError } from "@/lib/api"
import { useAuth } from "@/auth/AuthContext"
import { useMediaQuery } from "@/lib/useMediaQuery"
import { useRemoteSession } from "@/lib/useRemoteSession"
import { GuidePane } from "./lab-view/GuidePane"
import { CredentialsPanel, type LabCredential } from "./lab-view/CredentialsPanel"
import { RemotePanel } from "./lab-view/RemotePanel"

const nav: NavItem[] = [{ label: "My Labs", to: "/lab-access", icon: <FlaskConical /> }]

// Persist the Docs | Remote Session split. react-resizable-panels@4 has no
// autoSaveId (that's the v2 API); v4 persistence is defaultLayout + an
// onLayoutChanged save callback, keyed by panel id — mirrors the manual
// localStorage the AppShell sidebar already uses.
const SPLIT_KEY = "labWorkshop.split"
function loadSplit(): { docs: number; remote: number } {
  try {
    const parsed = JSON.parse(localStorage.getItem(SPLIT_KEY) ?? "")
    if (typeof parsed?.docs === "number" && typeof parsed?.remote === "number") return parsed
  } catch {
    // no/invalid saved layout — fall through to the default split
  }
  return { docs: 45, remote: 55 }
}

type LabDetail = {
  id: string
  lab: { slug: string; title: string; summary: string; difficulty: string; duration: string }
  pages: { file: string; order: number; title: string }[]
  completedPages: string[]
  credentials: LabCredential[]
  // Still returned for the Phase-5 Remote/Guacamole token; no longer shown here.
  connection: { rdpHost: string; rdpPort: number; rdpUser: string; rdpPassword: string }
}

export function LabViewPage() {
  const { slug } = useParams<{ slug: string }>()
  const [detail, setDetail] = useState<LabDetail | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Lifted so the current page / active session tab survive the layout remount
  // when the viewport crosses the 1280px breakpoint (split <-> tabs).
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [sessionTab, setSessionTab] = useState<"remote" | "credentials">("remote")
  const isDesktop = useMediaQuery("(min-width: 1280px)")
  // Per-user guide font size lives in auth state (follows the user across
  // devices); the GuidePane toolbar A−/A+ writes back through updateDocFontSize.
  const { docFontSize, updateDocFontSize } = useAuth()
  // One live RDP session for the lab. Slug is withheld until the assignment
  // loads so we only connect for labs the user actually has (a 403 otherwise).
  // Lives here (not in RemotePanel) so it survives the tab/breakpoint remounts.
  const session = useRemoteSession(detail ? slug : undefined)

  useEffect(() => {
    if (!slug) return
    setDetail(null)
    setNotFound(false)
    setError(null)
    api<LabDetail>(`/me/labs/${slug}`)
      .then(setDetail)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true)
        } else {
          setError(err instanceof ApiError ? err.message : "Failed to load lab")
        }
      })
  }, [slug])

  function handleProgressChange(completedPages: string[]) {
    setDetail((d) => (d ? { ...d, completedPages } : d))
  }

  return (
    <AppShell nav={nav} title={detail?.lab.title ?? "Lab"} collapsible lockViewport>
      <div className="-mx-xl -my-lg h-[calc(100vh-4rem)] overflow-hidden">
        {notFound ? (
          <div className="mx-auto max-w-3xl px-xl py-xxl text-center">
            <h2 className="text-h3 text-foreground">Lab not available</h2>
            <p className="mt-xs text-body text-muted-foreground">
              You aren't assigned to this lab, or it doesn't exist.
            </p>
            <Link to="/lab-access" className="mt-lg inline-block text-body text-primary">
              ← Back to My Labs
            </Link>
          </div>
        ) : error ? (
          <p role="alert" className="p-xl text-body text-danger">
            {error}
          </p>
        ) : detail === null ? (
          <div className="flex h-full items-center justify-center">
            <Skeleton className="h-3/4 w-11/12" />
          </div>
        ) : (
          (() => {
            const guide = (
              <GuidePane
                slug={detail.lab.slug}
                pages={detail.pages}
                completedPages={detail.completedPages}
                onProgressChange={handleProgressChange}
                selectedFile={selectedFile ?? detail.pages[0]?.file ?? null}
                onSelectFile={setSelectedFile}
                fontSize={docFontSize}
                onChangeFontSize={updateDocFontSize}
              />
            )
            // Remote Session pane: Credentials is a secondary switch inside it,
            // not a co-equal primary (creds aren't always needed). Reused in both
            // the >=1280 split and the <1280 tabbed layout.
            const remoteSession = (
              <Tabs
                value={sessionTab}
                onValueChange={(v) => setSessionTab(v as "remote" | "credentials")}
                className="flex h-full min-h-0 flex-col"
              >
                <TabsList className="m-sm w-fit shrink-0">
                  <TabsTrigger value="remote">Remote Session</TabsTrigger>
                  <TabsTrigger value="credentials">Credentials</TabsTrigger>
                </TabsList>
                <TabsContent
                  value="remote"
                  className="min-h-0 flex-1 overflow-y-auto duration-[var(--duration-base)] ease-standard animate-in fade-in"
                >
                  <RemotePanel session={session} label={detail.lab.title} />
                </TabsContent>
                <TabsContent
                  value="credentials"
                  className="min-h-0 flex-1 overflow-y-auto duration-[var(--duration-base)] ease-standard animate-in fade-in"
                >
                  <CredentialsPanel credentials={detail.credentials} />
                </TabsContent>
              </Tabs>
            )

            return isDesktop ? (
              <ResizablePanelGroup
                orientation="horizontal"
                className="h-full"
                defaultLayout={loadSplit()}
                onLayoutChanged={(layout) =>
                  localStorage.setItem(SPLIT_KEY, JSON.stringify(layout))
                }
              >
                {/* Drag floors tuned to the 1280 design floor: docs never below
                    ~360px (29%), RDP never below ~420px (33%). NB in v4 a numeric
                    minSize is *pixels*; a bare/`%` string is a percentage — so
                    these MUST be strings or the constraint is a ~30px no-op. */}
                <ResizablePanel id="docs" minSize="29%">
                  {guide}
                </ResizablePanel>
                {/* Only the drag handle should rebalance the split. v4 wires a
                    native keydown resize on the separator; it early-returns when
                    the event is already defaultPrevented, so preventing arrow
                    keys in the capture phase (before that native listener) is
                    enough to disable keyboard resizing without touching drag. */}
                <ResizableHandle
                  onKeyDownCapture={(e) => {
                    if (e.key.startsWith("Arrow")) e.preventDefault()
                  }}
                />
                <ResizablePanel id="remote" minSize="33%">
                  {remoteSession}
                </ResizablePanel>
              </ResizablePanelGroup>
            ) : (
              <Tabs defaultValue="docs" className="flex h-full min-h-0 flex-col">
                <TabsList className="m-sm w-fit shrink-0">
                  <TabsTrigger value="docs">Docs</TabsTrigger>
                  <TabsTrigger value="remote-session">Remote Session</TabsTrigger>
                </TabsList>
                <TabsContent
                  value="docs"
                  className="min-h-0 flex-1 overflow-hidden duration-[var(--duration-base)] ease-standard animate-in fade-in"
                >
                  {guide}
                </TabsContent>
                <TabsContent
                  value="remote-session"
                  className="min-h-0 flex-1 overflow-hidden duration-[var(--duration-base)] ease-standard animate-in fade-in"
                >
                  {remoteSession}
                </TabsContent>
              </Tabs>
            )
          })()
        )}
      </div>
    </AppShell>
  )
}
