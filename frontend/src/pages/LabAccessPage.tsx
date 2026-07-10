import { AppShell, type NavItem } from "@/layouts/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, FlaskConical, GitBranch, Gauge, Clock, Server } from "lucide-react";

const nav: NavItem[] = [{ label: "My Labs", to: "/lab-access", icon: <FlaskConical /> }];

type LabStatus = "ready" | "provisioning" | "offline";
type LabDifficulty = "Beginner" | "Intermediate" | "Advanced";

const labs: {
  id: string;
  name: string;
  description: string;
  status: LabStatus;
  version: string;
  nodes: number;
  duration: string;
  difficulty: LabDifficulty;
}[] = [
  {
    id: "nkp-cluster-basics",
    name: "NKP Cluster Basics",
    description: "Provision a Nutanix Kubernetes Platform cluster and explore the core dashboard.",
    status: "ready",
    version: "v1.29",
    nodes: 3,
    duration: "45 min",
    difficulty: "Beginner",
  },
  {
    id: "nkp-app-deployment",
    name: "Application Deployment",
    description: "Deploy a multi-tier app onto NKP and configure autoscaling policies.",
    status: "provisioning",
    version: "v1.29",
    nodes: 4,
    duration: "60 min",
    difficulty: "Intermediate",
  },
  {
    id: "nkp-networking",
    name: "Networking & Ingress",
    description: "Configure ingress controllers and network policies on a live NKP cluster.",
    status: "offline",
    version: "v1.28",
    nodes: 5,
    duration: "75 min",
    difficulty: "Advanced",
  },
];

const statusLabel: Record<LabStatus, string> = {
  ready: "Ready",
  provisioning: "Provisioning",
  offline: "Offline",
};

const statusVariant: Record<LabStatus, "success" | "warning" | "danger"> = {
  ready: "success",
  provisioning: "warning",
  offline: "danger",
};

export function LabAccessPage() {
  return (
    <AppShell nav={nav} title="Lab Access">
      {labs.length === 0 ? (
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-col items-center rounded-lg border border-border bg-surface px-xl py-xxl text-center shadow-sm">
            <h2 className="text-h3 text-foreground">No labs assigned yet</h2>
            <p className="mt-xs max-w-md text-body text-muted-foreground">
              Your labs will appear here once an admin assigns you a machine.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-xl">
          <div>
            <p className="text-label uppercase tracking-wide text-primary">Your workshops</p>
            <h2 className="mt-xxs text-h2 text-foreground">Available labs</h2>
            <p className="mt-xs text-body text-muted-foreground">
              Pick up where you left off or start a new hands-on lab.
            </p>
          </div>

          <div className="grid gap-lg sm:grid-cols-2 lg:grid-cols-3">
            {labs.map((lab) => (
              <Card
                key={lab.id}
                className="shadow-sm transition-[box-shadow,transform] duration-[var(--duration-fast)] ease-standard hover:-translate-y-px hover:shadow-md"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-sm">
                    <div className="flex items-center gap-xs">
                      <FlaskConical className="size-4 shrink-0 text-muted-foreground" />
                      <CardTitle>{lab.name}</CardTitle>
                    </div>
                    <Badge variant={statusVariant[lab.status]}>{statusLabel[lab.status]}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-sm">
                  <CardDescription>{lab.description}</CardDescription>
                  <div className="flex flex-wrap items-center gap-sm text-body-sm text-muted-foreground">
                    <span className="flex items-center gap-xxs">
                      <GitBranch className="size-3.5 text-muted-foreground" />
                      <span className="font-mono tabular-nums">{lab.version}</span>
                    </span>
                    <span className="flex items-center gap-xxs">
                      <Server className="size-3.5 text-muted-foreground" />
                      <span className="font-mono tabular-nums">{lab.nodes} nodes</span>
                    </span>
                    <span className="flex items-center gap-xxs">
                      <Clock className="size-3.5 text-muted-foreground" />
                      {lab.duration}
                    </span>
                    <span className="flex items-center gap-xxs">
                      <Gauge className="size-3.5 text-muted-foreground" />
                      {lab.difficulty}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="justify-end">
                  <Button variant="primary" disabled={lab.status === "offline"}>
                    Open lab
                    <ArrowRight className="size-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}
