import { useId, useState, type FormEvent } from "react";
import { AppShell } from "@/layouts/AppShell";
import { adminNav } from "./adminNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { GitBranch, Server, Cpu, MemoryStick, User, Clock, ScrollText } from "lucide-react";

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

const initialMachines: Machine[] = [
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

const emptyForm = {
  name: "",
  version: "v1.29",
  nodes: "3",
  vcpu: "8",
  memory: "32 GiB",
};

export function MachinesPage() {
  const [machines, setMachines] = useState<Machine[]>(initialMachines);
  const [logOpen, setLogOpen] = useState(false);
  const [selected, setSelected] = useState<Machine | null>(null);
  const [provisionOpen, setProvisionOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const formId = useId();

  function openLogs(machine: Machine) {
    setSelected(machine);
    setLogOpen(true);
  }

  function openProvision() {
    setForm(emptyForm);
    setProvisionOpen(true);
  }

  function handleProvision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = form.name.trim();
    const nodes = Number(form.nodes);
    const vcpu = Number(form.vcpu);
    const memory = form.memory.trim();
    if (!name || !form.version.trim() || !memory || !Number.isFinite(nodes) || nodes <= 0 || !Number.isFinite(vcpu) || vcpu <= 0) {
      return;
    }

    const machine: Machine = {
      id: name,
      name,
      status: "provisioning",
      version: form.version.trim(),
      nodes,
      vcpu,
      memory,
      owner: "unassigned",
      uptime: "0d 0h",
    };

    setMachines((prev) => [...prev, machine]);
    setForm(emptyForm);
    setProvisionOpen(false);
  }

  return (
    <AppShell nav={adminNav} title="Machines">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Infrastructure Management</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Provision, monitor, and manage workshop machines
            </p>
          </div>
          <Button variant="primary" onClick={openProvision} className="gap-2">
            <svg className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Provision Machine
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-border/40 bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Machines</p>
                <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-foreground">{machines.length}</p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                <Server className="size-5" />
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border/40 bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Ready</p>
                <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-emerald-600">
                  {machines.filter(m => m.status === 'ready').length}
                </p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <svg className="size-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border/40 bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Provisioning</p>
                <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-amber-600">
                  {machines.filter(m => m.status === 'provisioning').length}
                </p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                <svg className="size-5 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border/40 bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Issues</p>
                <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-rose-600">
                  {machines.filter(m => m.status === 'error' || m.status === 'offline').length}
                </p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                <svg className="size-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Machines Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {machines.map((machine) => (
            <Card
              key={machine.id}
              className="group relative overflow-hidden border-border/40 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className={`flex size-10 items-center justify-center rounded-lg ${
                      machine.status === 'ready' ? 'bg-emerald-100 text-emerald-600' :
                      machine.status === 'provisioning' ? 'bg-amber-100 text-amber-600' :
                      machine.status === 'error' ? 'bg-rose-100 text-rose-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      <Server className="size-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{machine.name}</CardTitle>
                      <p className="mt-0.5 text-xs text-muted-foreground">{machine.id}</p>
                    </div>
                  </div>
                  <Badge
                    variant={statusVariant[machine.status]}
                    className={machine.status === "provisioning" ? "motion-safe:animate-pulse" : undefined}
                  >
                    <span className={`size-1.5 rounded-full ${
                      machine.status === 'ready' ? 'bg-emerald-500' :
                      machine.status === 'provisioning' ? 'bg-amber-500' :
                      machine.status === 'error' ? 'bg-rose-500' :
                      'bg-gray-500'
                    }`} />
                    {statusLabel[machine.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pb-3 text-sm">
                <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/30 p-3">
                  <div className="flex items-center gap-2">
                    <GitBranch className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Version</p>
                      <p className="font-mono text-xs font-medium tabular-nums text-foreground">{machine.version}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="size-4 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                    </svg>
                    <div>
                      <p className="text-xs text-muted-foreground">Nodes</p>
                      <p className="font-mono text-xs font-medium tabular-nums text-foreground">{machine.nodes}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Cpu className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">vCPU</p>
                      <p className="font-mono text-xs font-medium tabular-nums text-foreground">{machine.vcpu}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MemoryStick className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Memory</p>
                      <p className="font-mono text-xs font-medium tabular-nums text-foreground">{machine.memory}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
                  <div className="flex items-center gap-2">
                    <User className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Owner</p>
                      <p className="text-xs font-medium text-foreground">{machine.owner}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Uptime</p>
                      <p className="font-mono text-xs font-medium tabular-nums text-foreground">{machine.uptime}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-end border-t border-border/40 bg-muted/20 pt-3">
                <Button variant="secondary" onClick={() => openLogs(machine)} className="gap-2">
                  <ScrollText className="size-4" />
                  View Logs
                </Button>
              </CardFooter>
              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-violet-500 to-purple-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </Card>
          ))}
        </div>
      </div>

      {/* View logs modal */}
      <Dialog open={logOpen} onOpenChange={setLogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-xs">
              <Server className="size-4 shrink-0 text-muted-foreground" />
              {selected?.name ?? ""}
              {selected ? (
                <Badge
                  variant={statusVariant[selected.status]}
                  className={selected.status === "provisioning" ? "motion-safe:animate-pulse" : undefined}
                >
                  {statusLabel[selected.status]}
                </Badge>
              ) : null}
            </DialogTitle>
            {selected ? (
              <DialogDescription className="font-mono tabular-nums">
                {selected.version} &middot; {selected.nodes} nodes &middot; {selected.owner}
              </DialogDescription>
            ) : null}
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto rounded-md border border-border bg-canvas p-md">
            <div className="flex flex-col gap-xxs font-mono text-body-sm text-muted-foreground">
              {mockLog.map((line, i) => (
                <span key={i} className={line.className}>
                  {line.text}
                </span>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Provision machine modal */}
      <Dialog open={provisionOpen} onOpenChange={setProvisionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Provision machine</DialogTitle>
            <DialogDescription>Create a new machine from a mock Terraform + Ansible run.</DialogDescription>
          </DialogHeader>
          <form id={formId} onSubmit={handleProvision} className="flex flex-col gap-md">
            <div className="flex flex-col gap-xxs">
              <label htmlFor={`${formId}-name`} className="text-label text-muted-foreground">
                Name
              </label>
              <Input
                id={`${formId}-name`}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="nkp-node-05"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-md">
              <div className="flex flex-col gap-xxs">
                <label htmlFor={`${formId}-version`} className="text-label text-muted-foreground">
                  K8s version
                </label>
                <Input
                  id={`${formId}-version`}
                  value={form.version}
                  onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))}
                  required
                />
              </div>
              <div className="flex flex-col gap-xxs">
                <label htmlFor={`${formId}-nodes`} className="text-label text-muted-foreground">
                  Node count
                </label>
                <Input
                  id={`${formId}-nodes`}
                  type="number"
                  min={1}
                  value={form.nodes}
                  onChange={(e) => setForm((f) => ({ ...f, nodes: e.target.value }))}
                  required
                />
              </div>
              <div className="flex flex-col gap-xxs">
                <label htmlFor={`${formId}-vcpu`} className="text-label text-muted-foreground">
                  vCPU
                </label>
                <Input
                  id={`${formId}-vcpu`}
                  type="number"
                  min={1}
                  value={form.vcpu}
                  onChange={(e) => setForm((f) => ({ ...f, vcpu: e.target.value }))}
                  required
                />
              </div>
              <div className="flex flex-col gap-xxs">
                <label htmlFor={`${formId}-memory`} className="text-label text-muted-foreground">
                  Memory
                </label>
                <Input
                  id={`${formId}-memory`}
                  value={form.memory}
                  onChange={(e) => setForm((f) => ({ ...f, memory: e.target.value }))}
                  placeholder="32 GiB"
                  required
                />
              </div>
            </div>
          </form>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setProvisionOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" form={formId}>
              Provision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
