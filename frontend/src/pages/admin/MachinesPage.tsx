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
      <div className="flex flex-col gap-xl">
        <div className="flex items-center justify-between gap-sm">
          <h2 className="text-h2 text-foreground">Machines</h2>
          <Button variant="primary" onClick={openProvision}>
            Provision machine
          </Button>
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
                  <Badge
                    variant={statusVariant[machine.status]}
                    className={machine.status === "provisioning" ? "motion-safe:animate-pulse" : undefined}
                  >
                    {statusLabel[machine.status]}
                  </Badge>
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
