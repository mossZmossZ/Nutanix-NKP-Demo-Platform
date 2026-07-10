import { Link } from "react-router-dom";
import { AppShell } from "@/layouts/AppShell";
import { adminNav } from "./adminNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Server,
  FlaskConical,
  Radio,
  UserPlus,
  KeyRound,
  PlayCircle,
  UserCheck,
  AlertTriangle,
  LogIn,
} from "lucide-react";

const stats: {
  id: string;
  label: string;
  value: string;
  icon: typeof Users;
  sub: string;
  live?: boolean;
}[] = [
  { id: "users", label: "Users", value: "18", icon: Users, sub: "+2 this week" },
  { id: "machines", label: "Machines", value: "6", icon: Server, sub: "5 healthy" },
  { id: "active-labs", label: "Active labs", value: "4", icon: FlaskConical, sub: "across 3 workshops" },
  { id: "live-sessions", label: "Live sessions", value: "3", icon: Radio, sub: "Connected now", live: true },
];

const machineStatus = [
  { label: "ready", count: 3, dotClassName: "bg-success" },
  { label: "provisioning", count: 1, dotClassName: "bg-warning" },
  { label: "offline", count: 2, dotClassName: "bg-muted-foreground" },
];

const activity: { id: string; icon: typeof UserCheck; text: string; time: string }[] = [
  { id: "1", icon: UserCheck, text: "Assigned alice → NKP Cluster Basics", time: "2m ago" },
  { id: "2", icon: PlayCircle, text: "nkp-node-04 finished provisioning", time: "18m ago" },
  { id: "3", icon: UserPlus, text: "Added user bshaw", time: "1h ago" },
  { id: "4", icon: AlertTriangle, text: "nkp-node-02 reported a health check failure", time: "3h ago" },
  { id: "5", icon: LogIn, text: "carter logged in to the lab console", time: "5h ago" },
];

export function AdminPortalPage() {
  return (
    <AppShell nav={adminNav} title="Dashboard">
      <div className="flex flex-col gap-xl">
        <div>
          <p className="text-label uppercase tracking-wide text-primary">Overview</p>
          <h2 className="mt-xxs text-h2 text-foreground">Console dashboard</h2>
          <p className="mt-xs text-body text-muted-foreground">
            Monitor workshop capacity and jump into common admin tasks.
          </p>
        </div>

        <div className="grid gap-lg sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card
              key={stat.id}
              className="shadow-sm transition-[box-shadow,transform] duration-[var(--duration-fast)] ease-standard hover:-translate-y-px hover:shadow-md"
            >
              <CardContent className="flex flex-col gap-sm p-lg">
                <div className="flex items-center justify-between gap-xs">
                  <span className="text-label uppercase tracking-wide text-muted-foreground">{stat.label}</span>
                  <span className="grid size-8 shrink-0 place-items-center rounded-md bg-violet-100 text-violet-600">
                    <stat.icon className="size-4" />
                  </span>
                </div>
                <span className="font-mono text-h1 tabular-nums text-foreground">{stat.value}</span>
                {stat.live ? (
                  <span className="flex items-center gap-xs text-body-sm text-success">
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-success/60" />
                      <span className="relative inline-flex size-2 rounded-full bg-success" />
                    </span>
                    {stat.sub}
                  </span>
                ) : (
                  <span className="text-body-sm text-muted-foreground">{stat.sub}</span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-md text-body-sm text-muted-foreground">
          <span className="text-label uppercase tracking-wide text-muted-foreground">Machines by status</span>
          {machineStatus.map((s, i) => (
            <span key={s.label} className="flex items-center gap-xs">
              {i > 0 ? <span className="text-border">&middot;</span> : null}
              <span className={`size-2 rounded-full ${s.dotClassName}`} />
              <span className="font-mono tabular-nums text-foreground">{s.count}</span>
              {s.label}
            </span>
          ))}
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex flex-col">
              {activity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-sm border-t border-border px-lg py-sm first:border-t-0"
                >
                  <div className="flex items-center gap-xs">
                    <item.icon className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="text-body-sm text-foreground">{item.text}</span>
                  </div>
                  <span className="shrink-0 font-mono text-body-sm tabular-nums text-muted-foreground">
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center gap-sm">
          <Button variant="primary">Provision machine</Button>
          <Button asChild variant="secondary">
            <Link to="/admin/users">Add user</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/admin/lab-credentials">
              <KeyRound className="size-4" />
              Assign credentials
            </Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
