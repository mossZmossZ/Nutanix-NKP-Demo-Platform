import { useEffect, useState, useCallback, useMemo, type FormEvent } from "react";
import { AppShell } from "@/layouts/AppShell";
import { adminNav } from "./adminNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  HardDrive,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Cpu,
  MemoryStick,
  MonitorSmartphone,
  Server,
  Wifi,
  WifiOff,
  Loader2,
  Terminal,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { toast } from "sonner";
import { ConsoleTerminal } from "@/components/ConsoleTerminal";

type MachineStatus = "free" | "assigned";

type Machine = {
  id: string;
  name?: string;
  rdpHost: string;
  rdpPort: number;
  rdpUser: string;
  rdpPassword: string;
  status: MachineStatus;
  vcpu?: number;
  memory?: string;
  os?: string;
  drive?: string;
  sshPort: number;
};

type HealthState = Record<string, { reachable: boolean; checking: boolean }>;

const PASSWORD_CHARSET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";

function generatePassword(length = 16): string {
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (v) => PASSWORD_CHARSET[v % PASSWORD_CHARSET.length]).join("");
}

const OS_OPTIONS = ["", "Windows", "Linux", "Other"];
const VCPU_OPTIONS = ["", "2", "4", "8", "10", "12"];
const MEMORY_OPTIONS = ["", "0.5 GB", "1 GB", "2 GB", "4 GB", "8 GB", "16 GB"];

type FormState = {
  name: string;
  rdpHost: string;
  rdpPort: string;
  rdpUser: string;
  rdpPassword: string;
  os: string;
  vcpu: string;
  memory: string;
  drive: string;
  sshPort: string;
};

const emptyForm: FormState = {
  name: "",
  rdpHost: "",
  rdpPort: "3389",
  rdpUser: "labuser",
  rdpPassword: "",
  os: "",
  vcpu: "",
  memory: "",
  drive: "",
  sshPort: "22",
};

const POLL_INTERVAL = 30_000;

export function MachinesPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthState>({});
  const [sshHealth, setSshHealth] = useState<HealthState>({});
  const [deleteBlockedId, setDeleteBlockedId] = useState<string | null>(null);

  // Import dialog
  const [importOpen, setImportOpen] = useState(false);
  const [importForm, setImportForm] = useState<FormState>(emptyForm);
  const [showImportPassword, setShowImportPassword] = useState(false);

  // Edit dialog
  const [editMachine, setEditMachine] = useState<Machine | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Console drawer
  const [consoleMachine, setConsoleMachine] = useState<Machine | null>(null);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<Machine | null>(null);

  async function load() {
    try {
      setMachines(await api<Machine[]>("/admin/machines"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load machines");
    }
  }

  const checkHealth = useCallback(async (list: Machine[]) => {
    const ids = list.map((m) => m.id);
    setHealth((prev) => {
      const next = { ...prev };
      for (const id of ids) next[id] = { reachable: false, checking: true };
      return next;
    });

    const results = await Promise.allSettled(
      list.map((m) =>
        api<{ reachable: boolean }>(`/admin/machines/${m.id}/health`).then((r) => ({
          id: m.id,
          reachable: r.reachable,
        })),
      ),
    );

    setHealth((prev) => {
      const next = { ...prev };
      for (const result of results) {
        if (result.status === "fulfilled") {
          next[result.value.id] = { reachable: result.value.reachable, checking: false };
        } else {
          const id = list[results.indexOf(result)]?.id;
          if (id) next[id] = { reachable: false, checking: false };
        }
      }
      return next;
    });
  }, []);

  const checkSshHealth = useCallback(async (list: Machine[]) => {
    const ids = list.map((m) => m.id);
    setSshHealth((prev) => {
      const next = { ...prev };
      for (const id of ids) next[id] = { reachable: false, checking: true };
      return next;
    });

    const results = await Promise.allSettled(
      list.map((m) =>
        api<{ reachable: boolean }>(`/admin/machines/${m.id}/health/ssh`).then((r) => ({
          id: m.id,
          reachable: r.reachable,
        })),
      ),
    );

    setSshHealth((prev) => {
      const next = { ...prev };
      for (const result of results) {
        if (result.status === "fulfilled") {
          next[result.value.id] = { reachable: result.value.reachable, checking: false };
        } else {
          const id = list[results.indexOf(result)]?.id;
          if (id) next[id] = { reachable: false, checking: false };
        }
      }
      return next;
    });
  }, []);

  useEffect(() => {
    load().then(() => {});
  }, []);

  useEffect(() => {
    if (machines.length === 0) return;
    checkHealth(machines);
    checkSshHealth(machines);
    const interval = setInterval(() => {
      checkHealth(machines);
      checkSshHealth(machines);
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [machines, checkHealth, checkSshHealth]);

  function run(fn: () => Promise<unknown>) {
    setError(null);
    return fn()
      .then(load)
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Request failed");
        throw err;
      });
  }

  function closeImport(open: boolean) {
    setImportOpen(open);
    if (!open) {
      setImportForm(emptyForm);
      setShowImportPassword(false);
    }
  }

  async function onImport(e: FormEvent) {
    e.preventDefault();
    run(async () => {
      const machine = await api<Machine>("/admin/machines", {
        method: "POST",
        body: JSON.stringify({
          name: importForm.name || undefined,
          rdpHost: importForm.rdpHost,
          rdpPort: importForm.rdpPort ? Number(importForm.rdpPort) : undefined,
          rdpUser: importForm.rdpUser,
          rdpPassword: importForm.rdpPassword,
          os: importForm.os || undefined,
          vcpu: importForm.vcpu ? Number(importForm.vcpu) : undefined,
          memory: importForm.memory || undefined,
          drive: importForm.drive || undefined,
          sshPort: importForm.sshPort ? Number(importForm.sshPort) : undefined,
        }),
      });
      closeImport(false);
      toast.success("Machine imported", {
        description: `${machine.name || machine.rdpHost}:${machine.rdpPort} has been added to the pool.`,
      });
    }).catch(() => {});
  }

  function openEdit(m: Machine) {
    setEditMachine(m);
    setEditForm({
      name: m.name ?? "",
      rdpHost: m.rdpHost,
      rdpPort: String(m.rdpPort),
      rdpUser: m.rdpUser,
      rdpPassword: "",
      os: m.os ?? "",
      vcpu: m.vcpu != null ? String(m.vcpu) : "",
      memory: m.memory ?? "",
      drive: m.drive ?? "",
      sshPort: String(m.sshPort),
    });
    setShowEditPassword(false);
  }

  function closeEdit(open: boolean) {
    if (!open) {
      setEditMachine(null);
      setEditForm(emptyForm);
      setShowEditPassword(false);
    }
  }

  async function onSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editMachine) return;
    const id = editMachine.id;
    run(async () => {
      await api(`/admin/machines/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editForm.name || undefined,
          rdpHost: editForm.rdpHost,
          rdpPort: editForm.rdpPort ? Number(editForm.rdpPort) : undefined,
          rdpUser: editForm.rdpUser,
          ...(editForm.rdpPassword ? { rdpPassword: editForm.rdpPassword } : {}),
          os: editForm.os || undefined,
          vcpu: editForm.vcpu ? Number(editForm.vcpu) : undefined,
          memory: editForm.memory || undefined,
          drive: editForm.drive || undefined,
          sshPort: editForm.sshPort ? Number(editForm.sshPort) : undefined,
        }),
      });
      closeEdit(false);
    }).catch(() => {});
  }

  async function onDelete(m: Machine) {
    if (m.status === "assigned") {
      setDeleteBlockedId(m.id);
      return;
    }
    setDeleteConfirm(m);
  }

  async function confirmDelete() {
    if (!deleteConfirm) return;
    const m = deleteConfirm;
    setDeleteConfirm(null);
    run(async () => {
      await api(`/admin/machines/${m.id}`, { method: "DELETE" });
      toast.success("Machine deleted", {
        description: `${m.name || m.rdpHost}:${m.rdpPort} has been removed from the pool.`,
      });
    }).catch(() => {});
  }

  const total = machines.length;
  const free = machines.filter((m) => m.status === "free").length;
  const assigned = machines.filter((m) => m.status === "assigned").length;

  const combinedHealth = useMemo(() => {
    const result: HealthState = {};
    for (const m of machines) {
      const rdp = health[m.id];
      const ssh = sshHealth[m.id];
      const hasRdp = !!rdp;
      const hasSsh = !!ssh;
      if (!hasRdp && !hasSsh) continue;
      const checking = (rdp?.checking ?? false) && (ssh?.checking ?? false) ||
        ((rdp?.checking ?? true) && !hasSsh) ||
        ((ssh?.checking ?? true) && !hasRdp);
      const reachable = (rdp?.reachable ?? false) || (ssh?.reachable ?? false);
      result[m.id] = { reachable, checking };
    }
    return result;
  }, [health, sshHealth, machines]);

  const upCount = Object.values(combinedHealth).filter((h) => h.reachable).length;
  const downCount = Object.values(combinedHealth).filter((h) => !h.checking && !h.reachable).length;

  function healthBadge(id: string) {
    const h = combinedHealth[id];
    if (!h || h.checking) {
      return (
        <Badge variant="warning" className="motion-safe:animate-pulse">
          <Loader2 className="size-3 animate-spin" />
          Checking
        </Badge>
      );
    }
    if (h.reachable) {
      return (
        <Badge variant="success">
          <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
          UP
        </Badge>
      );
    }
    return (
      <Badge variant="danger">
        <span className="size-1.5 rounded-full bg-danger" aria-hidden="true" />
        DOWN
      </Badge>
    );
  }

  return (
    <AppShell nav={adminNav} title="Machines">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-h2 text-foreground">Infrastructure Management</h2>
            <p className="mt-1 text-body-sm text-muted-foreground">
              Import, monitor, and manage the RDP machine inventory for workshop assignments
            </p>
          </div>
          <Button type="button" variant="primary" onClick={() => setImportOpen(true)} className="gap-2">
            <HardDrive className="size-4" />
            Import Machine
          </Button>
        </div>

        {/* Stats bar */}
        <div className="grid gap-4 md:grid-cols-5">
          <div className="rounded-lg border border-border/40 bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Machines</p>
                <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-foreground">{total}</p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                <Server className="size-5" />
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border/40 bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Free</p>
                <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-foreground">{free}</p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <Wifi className="size-5" />
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border/40 bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Assigned</p>
                <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-foreground">{assigned}</p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <MonitorSmartphone className="size-5" />
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border/40 bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">UP</p>
                <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-foreground">{upCount}</p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-success/12 text-success">
                <Wifi className="size-5" />
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border/40 bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">DOWN</p>
                <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-foreground">{downCount}</p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-danger/12 text-danger">
                <WifiOff className="size-5" />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
            <div className="flex items-center gap-2">
              <svg className="size-5 text-destructive" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <p className="text-sm font-medium text-destructive">{error}</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {total === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border/60 bg-card px-6 py-16 text-center shadow-sm">
            <div className="flex size-12 items-center justify-center rounded-full bg-violet-100 text-violet-600">
              <Server className="size-6" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">No machines yet — import your first</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Machines imported here become available for lab credential assignment.
              </p>
            </div>
            <Button type="button" variant="primary" onClick={() => setImportOpen(true)} className="mt-2 gap-2">
              <HardDrive className="size-4" />
              Import Machine
            </Button>
          </div>
        ) : (
          /* Card grid */
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {machines.map((m) => {
              const blocked = m.status === "assigned";
              return (
                <Card
                  key={m.id}
                  className="group relative overflow-hidden border-border/40 shadow-sm transition-all duration-[var(--duration-fast)] ease-standard hover:-translate-y-0.5 hover:shadow-md"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                          <Server className="size-5" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-base truncate">{m.name || m.rdpHost}</CardTitle>
                          <p className="mt-0.5 font-mono text-xs text-muted-foreground tabular-nums truncate">
                            {m.rdpHost}:{m.rdpPort}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      {healthBadge(m.id)}
                      <Badge variant={m.status === "free" ? "success" : "neutral"}>
                        <span
                          className={`size-1.5 rounded-full ${m.status === "free" ? "bg-success" : "bg-muted-foreground"}`}
                          aria-hidden="true"
                        />
                        {m.status === "free" ? "Free" : "Assigned"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pb-3 text-sm">
                    {(m.os || m.vcpu != null || m.memory || m.drive) ? (
                      <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/30 p-3">
                        {m.os && (
                          <div className="flex items-center gap-2">
                            <MonitorSmartphone className="size-4 shrink-0 text-muted-foreground" />
                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground">OS</p>
                              <p className="font-mono text-xs font-medium tabular-nums text-foreground truncate">{m.os}</p>
                            </div>
                          </div>
                        )}
                        {m.vcpu != null && (
                          <div className="flex items-center gap-2">
                            <Cpu className="size-4 shrink-0 text-muted-foreground" />
                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground">vCPU</p>
                              <p className="font-mono text-xs font-medium tabular-nums text-foreground">{m.vcpu} Core</p>
                            </div>
                          </div>
                        )}
                        {m.memory && (
                          <div className="flex items-center gap-2">
                            <MemoryStick className="size-4 shrink-0 text-muted-foreground" />
                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground">Memory</p>
                              <p className="font-mono text-xs font-medium tabular-nums text-foreground truncate">{m.memory}</p>
                            </div>
                          </div>
                        )}
                        {m.drive && (
                          <div className="flex items-center gap-2">
                            <HardDrive className="size-4 shrink-0 text-muted-foreground" />
                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground">Drive</p>
                              <p className="font-mono text-xs font-medium tabular-nums text-foreground truncate">{m.drive}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-lg bg-muted/30 p-3 text-center">
                        <p className="text-xs text-muted-foreground">No hardware info configured</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2 rounded-lg bg-muted/30 p-3">
                      <MonitorSmartphone className="size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">User</p>
                        <p className="font-mono text-xs font-medium tabular-nums text-foreground truncate">{m.rdpUser}</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex items-center justify-end gap-2 border-t border-border/40 bg-muted/20 pt-3">
                    <Button type="button" variant="ghost" aria-label="Edit machine" className="size-8 p-0" onClick={() => openEdit(m)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      aria-label="Delete machine"
                      className="size-8 p-0 text-danger hover:bg-danger/10 hover:text-danger disabled:text-muted-foreground"
                      disabled={blocked}
                      title={blocked ? "Machine is assigned — unassign before deleting" : undefined}
                      onClick={() => onDelete(m)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="gap-2"
                      onClick={() => setConsoleMachine(m)}
                    >
                      <MonitorSmartphone className="size-4" />
                      Open Console
                    </Button>
                  </CardFooter>
                  {deleteBlockedId === m.id && (
                    <div className="px-4 pb-3">
                      <p className="text-xs font-medium text-destructive">Machine is assigned — unassign before deleting</p>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-violet-500 to-purple-500 opacity-0 transition-opacity duration-[var(--duration-fast)] ease-standard group-hover:opacity-100" />
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Console modal */}
      <Dialog open={consoleMachine !== null} onOpenChange={(open) => { if (!open) setConsoleMachine(null); }}>
        <DialogContent className="max-w-5xl gap-0 p-0">
          {/* Terminal chrome header */}
          {consoleMachine && (
            <div className="flex items-center justify-between rounded-t-lg bg-ink-900 px-5 py-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/15 shrink-0">
                  <Terminal className="size-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white truncate">
                      {consoleMachine.name || consoleMachine.rdpHost}
                    </p>
                    {sshHealth[consoleMachine.id] && (
                      <span className={`shrink-0 flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                        sshHealth[consoleMachine.id].checking
                          ? "bg-warning/15 text-warning"
                          : sshHealth[consoleMachine.id].reachable
                          ? "bg-success/15 text-success"
                          : "bg-destructive/15 text-destructive"
                      }`}>
                        <span className={`size-1.5 rounded-full ${
                          sshHealth[consoleMachine.id].checking ? "bg-warning animate-pulse" : sshHealth[consoleMachine.id].reachable ? "bg-success" : "bg-destructive"
                        }`} />
                        {sshHealth[consoleMachine.id].checking ? "Checking" : sshHealth[consoleMachine.id].reachable ? "Connected" : "Offline"}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-white/30 truncate">
                    {[
                      consoleMachine.os,
                      consoleMachine.vcpu != null && `${consoleMachine.vcpu} vCPU`,
                      consoleMachine.memory,
                    ]
                      .filter(Boolean)
                      .join("  ·  ") || "No hardware info"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono text-xs text-white/25 tabular-nums">
                  {consoleMachine.rdpHost}:{consoleMachine.sshPort}
                </span>
              </div>
            </div>
          )}
          {/* Terminal body */}
          <div className="h-[500px] rounded-b-lg overflow-hidden bg-[#1a1b26]">
            {consoleMachine && (
              <ConsoleTerminal
                machineId={consoleMachine.id}
                onDisconnected={() => setConsoleMachine(null)}
              />
            )}
          </div>
          <DialogClose className="absolute top-3.5 right-5 rounded-sm p-0.5 text-white/40 outline-none transition-colors hover:text-white/80 focus-visible:ring-[3px] focus-visible:ring-primary/30">
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogContent>
      </Dialog>

      {/* Import dialog */}
      <Dialog open={importOpen} onOpenChange={closeImport}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import machine</DialogTitle>
            <DialogDescription>Add a machine to the pool for workshop assignments.</DialogDescription>
          </DialogHeader>
          <form id="import-machine-form" onSubmit={onImport} className="flex flex-col gap-md">
            <label className="flex flex-col gap-xs">
              <span className="text-label text-muted-foreground">Name (optional)</span>
              <Input
                value={importForm.name}
                onChange={(e) => setImportForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="nkp-node-05"
              />
            </label>
            <div className="grid grid-cols-3 gap-md">
              <label className="flex flex-col gap-xs">
                <span className="text-label text-muted-foreground">RDP Host</span>
                <Input
                  value={importForm.rdpHost}
                  onChange={(e) => setImportForm((f) => ({ ...f, rdpHost: e.target.value }))}
                  placeholder="10.42.0.5"
                  className="font-mono"
                  required
                />
              </label>
              <label className="flex flex-col gap-xs">
                <span className="text-label text-muted-foreground">RDP Port</span>
                <Input
                  type="number"
                  value={importForm.rdpPort}
                  onChange={(e) => setImportForm((f) => ({ ...f, rdpPort: e.target.value }))}
                  placeholder="3389"
                />
              </label>
              <label className="flex flex-col gap-xs">
                <span className="text-label text-muted-foreground">SSH Port</span>
                <Input
                  type="number"
                  value={importForm.sshPort}
                  onChange={(e) => setImportForm((f) => ({ ...f, sshPort: e.target.value }))}
                  placeholder="22"
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-md">
              <label className="flex flex-col gap-xs">
                <span className="text-label text-muted-foreground">Username</span>
                <Input
                  value={importForm.rdpUser}
                  onChange={(e) => setImportForm((f) => ({ ...f, rdpUser: e.target.value }))}
                  required
                />
              </label>
              <label className="flex flex-col gap-xs">
                <span className="text-label text-muted-foreground">Password</span>
                <span className="flex items-start gap-xs">
                  <span className="relative flex-1">
                    <Input
                      type={showImportPassword ? "text" : "password"}
                      value={importForm.rdpPassword}
                      onChange={(e) => setImportForm((f) => ({ ...f, rdpPassword: e.target.value }))}
                      className="pr-9"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowImportPassword((v) => !v)}
                      aria-label={showImportPassword ? "Hide password" : "Show password"}
                      className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground outline-none transition-colors duration-[var(--duration-fast)] ease-standard hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-primary/12"
                    >
                      {showImportPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setImportForm((f) => ({ ...f, rdpPassword: generatePassword() }))}
                    className="shrink-0"
                  >
                    Generate
                  </Button>
                </span>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-md">
              <label className="flex flex-col gap-xs">
                <span className="text-label text-muted-foreground">OS</span>
                <Select
                  value={importForm.os}
                  onValueChange={(v) => setImportForm((f) => ({ ...f, os: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select OS" />
                  </SelectTrigger>
                  <SelectContent>
                    {OS_OPTIONS.map((o) => (
                      <SelectItem key={o || "__empty"} value={o} disabled={o === ""}>
                        {o || "Select OS"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <label className="flex flex-col gap-xs">
                <span className="text-label text-muted-foreground">vCPU</span>
                <Select
                  value={importForm.vcpu}
                  onValueChange={(v) => setImportForm((f) => ({ ...f, vcpu: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vCPU" />
                  </SelectTrigger>
                  <SelectContent>
                    {VCPU_OPTIONS.map((c) => (
                      <SelectItem key={c || "__empty"} value={c} disabled={c === ""}>
                        {c ? `${c} Core` : "Select vCPU"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <label className="flex flex-col gap-xs">
                <span className="text-label text-muted-foreground">Memory</span>
                <Select
                  value={importForm.memory}
                  onValueChange={(v) => setImportForm((f) => ({ ...f, memory: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select memory" />
                  </SelectTrigger>
                  <SelectContent>
                    {MEMORY_OPTIONS.map((mem) => (
                      <SelectItem key={mem || "__empty"} value={mem} disabled={mem === ""}>
                        {mem || "Select memory"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <label className="flex flex-col gap-xs">
                <span className="text-label text-muted-foreground">Drive</span>
                <Input
                  value={importForm.drive}
                  onChange={(e) => setImportForm((f) => ({ ...f, drive: e.target.value }))}
                  placeholder="100 GB SSD"
                />
              </label>
            </div>
          </form>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => closeImport(false)}>
              Cancel
            </Button>
            <Button type="submit" form="import-machine-form" variant="primary">
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editMachine !== null} onOpenChange={closeEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit machine — {editMachine?.name || editMachine?.rdpHost}</DialogTitle>
            <DialogDescription>Update connection details and hardware info. Leave password blank to keep it unchanged.</DialogDescription>
          </DialogHeader>
          <form id="edit-machine-form" onSubmit={onSaveEdit} className="flex flex-col gap-md">
            <label className="flex flex-col gap-xs">
              <span className="text-label text-muted-foreground">Name (optional)</span>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              />
            </label>
            <div className="grid grid-cols-3 gap-md">
              <label className="flex flex-col gap-xs">
                <span className="text-label text-muted-foreground">RDP Host</span>
                <Input
                  value={editForm.rdpHost}
                  onChange={(e) => setEditForm((f) => ({ ...f, rdpHost: e.target.value }))}
                  className="font-mono"
                  required
                />
              </label>
              <label className="flex flex-col gap-xs">
                <span className="text-label text-muted-foreground">RDP Port</span>
                <Input
                  type="number"
                  value={editForm.rdpPort}
                  onChange={(e) => setEditForm((f) => ({ ...f, rdpPort: e.target.value }))}
                />
              </label>
              <label className="flex flex-col gap-xs">
                <span className="text-label text-muted-foreground">SSH Port</span>
                <Input
                  type="number"
                  value={editForm.sshPort}
                  onChange={(e) => setEditForm((f) => ({ ...f, sshPort: e.target.value }))}
                  placeholder="22"
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-md">
              <label className="flex flex-col gap-xs">
                <span className="text-label text-muted-foreground">Username</span>
                <Input
                  value={editForm.rdpUser}
                  onChange={(e) => setEditForm((f) => ({ ...f, rdpUser: e.target.value }))}
                  required
                />
              </label>
              <label className="flex flex-col gap-xs">
                <span className="text-label text-muted-foreground">New password (optional)</span>
                <span className="flex items-start gap-xs">
                  <span className="relative flex-1">
                    <Input
                      type={showEditPassword ? "text" : "password"}
                      value={editForm.rdpPassword}
                      onChange={(e) => setEditForm((f) => ({ ...f, rdpPassword: e.target.value }))}
                      placeholder="Leave blank to keep current password"
                      className="pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword((v) => !v)}
                      aria-label={showEditPassword ? "Hide password" : "Show password"}
                      className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground outline-none transition-colors duration-[var(--duration-fast)] ease-standard hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-primary/12"
                    >
                      {showEditPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setEditForm((f) => ({ ...f, rdpPassword: generatePassword() }))}
                    className="shrink-0"
                  >
                    Generate
                  </Button>
                </span>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-md">
              <label className="flex flex-col gap-xs">
                <span className="text-label text-muted-foreground">OS</span>
                <Select
                  value={editForm.os}
                  onValueChange={(v) => setEditForm((f) => ({ ...f, os: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select OS" />
                  </SelectTrigger>
                  <SelectContent>
                    {OS_OPTIONS.map((o) => (
                      <SelectItem key={o || "__empty"} value={o} disabled={o === ""}>
                        {o || "Select OS"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <label className="flex flex-col gap-xs">
                <span className="text-label text-muted-foreground">vCPU</span>
                <Select
                  value={editForm.vcpu}
                  onValueChange={(v) => setEditForm((f) => ({ ...f, vcpu: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vCPU" />
                  </SelectTrigger>
                  <SelectContent>
                    {VCPU_OPTIONS.map((c) => (
                      <SelectItem key={c || "__empty"} value={c} disabled={c === ""}>
                        {c ? `${c} Core` : "Select vCPU"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <label className="flex flex-col gap-xs">
                <span className="text-label text-muted-foreground">Memory</span>
                <Select
                  value={editForm.memory}
                  onValueChange={(v) => setEditForm((f) => ({ ...f, memory: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select memory" />
                  </SelectTrigger>
                  <SelectContent>
                    {MEMORY_OPTIONS.map((mem) => (
                      <SelectItem key={mem || "__empty"} value={mem} disabled={mem === ""}>
                        {mem || "Select memory"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <label className="flex flex-col gap-xs">
                <span className="text-label text-muted-foreground">Drive</span>
                <Input
                  value={editForm.drive}
                  onChange={(e) => setEditForm((f) => ({ ...f, drive: e.target.value }))}
                  placeholder="100 GB SSD"
                />
              </label>
            </div>
          </form>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => closeEdit(false)}>
              Cancel
            </Button>
            <Button type="submit" form="edit-machine-form" variant="primary">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteConfirm !== null} onOpenChange={(open) => { if (!open) setDeleteConfirm(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete machine</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete{" "}
              <span className="font-medium text-foreground">{deleteConfirm?.name || deleteConfirm?.rdpHost}</span>
              {" "}from the pool? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button type="button" variant="primary" className="bg-danger hover:bg-danger/90" onClick={confirmDelete}>
              <Trash2 className="size-4" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

