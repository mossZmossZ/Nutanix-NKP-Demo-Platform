import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { AppShell, type NavItem } from "@/layouts/AppShell"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { FlaskConical } from "lucide-react"
import { api, ApiError } from "@/lib/api"
import { GuidePane } from "./lab-view/GuidePane"
import { CredentialsPanel } from "./lab-view/CredentialsPanel"
import { RemotePanel } from "./lab-view/RemotePanel"

const nav: NavItem[] = [{ label: "My Labs", to: "/lab-access", icon: <FlaskConical /> }]

type LabDetail = {
  id: string
  lab: { slug: string; title: string; summary: string; difficulty: string; duration: string }
  pages: { file: string; order: number; title: string }[]
  completedPages: string[]
  connection: { rdpHost: string; rdpPort: number; rdpUser: string; rdpPassword: string }
}

export function LabViewPage() {
  const { slug } = useParams<{ slug: string }>()
  const [detail, setDetail] = useState<LabDetail | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    <AppShell nav={nav} title={detail?.lab.title ?? "Lab"}>
      <div className="-mx-xl -my-lg h-[calc(100vh-4rem)]">
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
          <ResizablePanelGroup orientation="horizontal" className="h-full">
            <ResizablePanel defaultSize={40} minSize={25}>
              <GuidePane
                slug={detail.lab.slug}
                pages={detail.pages}
                completedPages={detail.completedPages}
                onProgressChange={handleProgressChange}
              />
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={60} minSize={30}>
              <Tabs defaultValue="remote" className="flex h-full flex-col">
                <TabsList className="m-sm w-fit shrink-0">
                  <TabsTrigger value="remote">Remote</TabsTrigger>
                  <TabsTrigger value="credentials">Credentials</TabsTrigger>
                </TabsList>
                <TabsContent value="remote" className="flex-1 overflow-y-auto">
                  <RemotePanel />
                </TabsContent>
                <TabsContent value="credentials" className="flex-1 overflow-y-auto">
                  <CredentialsPanel connection={detail.connection} />
                </TabsContent>
              </Tabs>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
    </AppShell>
  )
}
