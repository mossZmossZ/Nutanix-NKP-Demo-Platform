import { useState } from "react";
import { AppShell } from "@/layouts/AppShell";
import { adminNav } from "./adminNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { GitBranch, Server, Cpu, MemoryStick, User, Clock, ScrollText, X } from "lucide-react";

type MachineStatus = "ready" | "provisioning" | "offline" | "error";

type Machine = {
  id: string;
  name: string;
  status: MachineStatus;
  version: string;
  nodes: number;
  vcpu: number;
  memory: string;
  owner: string;
  uptime: string;
};

const machines: Machine[] = [
  {
    id: "nkp-node-01",
    name: "nkp-node-01",
    status: "ready",
    version: "v1.29",
    nodes: 3,
    vcpu: 8,
    memory: "32 GiB",
    owner: "alice",
    uptime: "4d 12h",
  },
  {
    id: "nkp-node-02",
    name: "nkp-node-02",
    status: "error",
    version: "v1.29",
    nodes: 3,
    vcpu: 8,
    memory: "32 GiB",
    owner: "bshaw",
    uptime: "0d 3h",
  },
  {
    id: "nkp-node-03",
    name: "nkp-node-03",
    status: "provisioning",
    version: "v1.30",
    nodes: 4,
    vcpu: 16,
    memory: "64 GiB",
    owner: "unassigned",
    uptime: "0d 0h",
  },
  {
    id: "nkp-node-04",
    name: "nkp-node-04",
    status: "offline",
    version: "v1.28",
    nodes: 2,
    vcpu: 4,
    memory: "16 GiB",
    owner: "carter",
    uptime: "12d 1h",
  },
];

const statusLabel: Record<MachineStatus, string> = {
  ready: "Ready",
  provisioning: "Provisioning",
  offline: "Offline",
  error: "Error",
};

const statusVariant: Record<MachineStatus, "success" | "warning" | "danger"> = {
  ready: "success",
  provisioning: "warning",
  offline: "danger",
  error: "danger",
};

const mockLog: { text: string; className?: string }[] = [
  { text: "module.nkp_cluster.null_resource.provision: Creating..." },
  { text: "module.nkp_cluster.nutanix_virtual_machine.node[0]: Creating..." },
  { text: "module.nkp_cluster.nutanix_virtual_machine.node[1]: Creating..." },
  { text: "module.nkp_cluster.nutanix_virtual_machine.node[0]: Still creating... [10s elapsed]" },
  { text: "module.nkp_cluster.nutanix_virtual_machine.node[1]: Creation complete after 14s" },
  { text: "module.nkp_cluster.nutanix_virtual_machine.node[0]: Creation complete after 16s" },
  { text: "Apply complete! Resources: 4 added, 0 changed, 0 destroyed.", className: "text-success" },
  { text: "PLAY [Configure NKP nodes] ***********************************" },
  { text: "TASK [Gathering Facts] ****************************************" },
  { text: "ok: [nkp-node-01]" },
  { text: "ok: [nkp-node-02]" },
  { text: "TASK [Install containerd] *************************************" },
  { text: "changed: [nkp-node-01]" },
  { text: "changed: [nkp-node-02]" },
  { text: "warning: dpkg lock held, retrying...", className: "text-warning" },
  { text: "TASK [Bootstrap NKP control plane] *****************************" },
  { text: "changed: [nkp-node-01]" },
  { text: "PLAY RECAP *****************************************************" },
  { text: "nkp-node-01 : ok=12 changed=4 unreachable=0 failed=0" },
  { text: "nkp-node-02 : ok=12 changed=4 unreachable=0 failed=0" },
  { text: "Apply complete. Machine is ready.", className: "text-success" },
];

export function MachinesPage() {
  const [logOpen, setLogOpen] = useState(false);
  const [selected, setSelected] = useState<Machine | null>(null);

  function openLogs(machine: Machine) {
    setSelected(machine);
    setLogOpen(true);
  }

  function closeLogs() {
    setLogOpen(false);
  }

  return (
    <AppShell nav={adminNav} title="Machines">
      <div className="flex flex-col gap-xl">
        <div className="flex items-center justify-between gap-sm">
          <h2 className="text-h2 text-foreground">Machines</h2>
          <Button variant="primary">Provision machine</Button>
        </div>

        <div className="grid gap-lg sm:grid-cols-2 lg:grid-cols-3">
          {machines.map((machine) => (
            <Card
              key={machine.id}
              className="shadow-sm transition-[box-shadow,transform] duration-[var(--duration-fast)] ease-standard hover:-translate-y-px hover:shadow-md"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-sm">
                  <div className="flex items-center gap-xs">
                    <Server className="size-4 shrink-0 text-muted-foreground" />
                    <CardTitle>{machine.name}</CardTitle>
                  </div>
                  <Badge variant={statusVariant[machine.status]}>{statusLabel[machine.status]}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-xs text-body-sm text-muted-foreground">
                <span className="flex items-center gap-xxs">
                  <GitBranch className="size-3.5 text-muted-foreground" />
                  <span className="font-mono tabular-nums">{machine.version}</span>
                  <span className="text-border">&middot;</span>
                  <span className="font-mono tabular-nums">{machine.nodes} nodes</span>
                </span>
                <span className="flex items-center gap-xxs">
                  <Cpu className="size-3.5 text-muted-foreground" />
                  <span className="font-mono tabular-nums">{machine.vcpu} vCPU</span>
                  <span className="text-border">&middot;</span>
                  <MemoryStick className="size-3.5 text-muted-foreground" />
                  <span className="font-mono tabular-nums">{machine.memory}</span>
                </span>
                <span className="flex items-center gap-xxs">
                  <User className="size-3.5 text-muted-foreground" />
                  {machine.owner}
                </span>
                <span className="flex items-center gap-xxs">
                  <Clock className="size-3.5 text-muted-foreground" />
                  <span className="font-mono tabular-nums">{machine.uptime}</span>
                </span>
              </CardContent>
              <CardFooter className="justify-end">
                <Button variant="secondary" onClick={() => openLogs(machine)}>
                  <ScrollText className="size-4" />
                  View logs
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Log drawer */}
      <div
        aria-hidden={!logOpen}
        onClick={closeLogs}
        className={`fixed inset-0 z-40 bg-ink-900/40 transition-opacity duration-[var(--duration-slow)] ease-standard ${
          logOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <div
        role="dialog"
        aria-hidden={!logOpen}
        className={`fixed inset-y-0 right-0 z-50 flex w-[440px] max-w-full flex-col border-l border-border bg-surface shadow-lg transition-transform duration-[var(--duration-slow)] ease-standard ${
          logOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-lg">
          <div className="flex items-center gap-xs">
            <Server className="size-4 shrink-0 text-muted-foreground" />
            <span className="text-h4 text-foreground">{selected?.name ?? ""}</span>
            {selected ? <Badge variant={statusVariant[selected.status]}>{statusLabel[selected.status]}</Badge> : null}
          </div>
          <Button variant="ghost" onClick={closeLogs} aria-label="Close logs">
            <X className="size-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-lg py-md">
          <div className="flex flex-col gap-xxs font-mono text-body-sm text-muted-foreground">
            {mockLog.map((line, i) => (
              <span key={i} className={line.className}>
                {line.text}
              </span>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
