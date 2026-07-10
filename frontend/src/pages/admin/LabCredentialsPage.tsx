import { useState } from "react";
import { AppShell } from "@/layouts/AppShell";
import { adminNav } from "./adminNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";

type AssignmentStatus = "active" | "pending" | "revoked";

type Assignment = {
  id: string;
  user: string;
  lab: string;
  machine: string;
  rdpHost: string;
  password: string;
  status: AssignmentStatus;
};

const assignments: Assignment[] = [
  {
    id: "asn-01",
    user: "alice",
    lab: "NKP Cluster Bootstrap",
    machine: "nkp-node-01",
    rdpHost: "10.42.0.5:3389",
    password: "Xk9$vLp2Qz",
    status: "active",
  },
  {
    id: "asn-02",
    user: "bshaw",
    lab: "Cluster API Upgrade",
    machine: "nkp-node-02",
    rdpHost: "10.42.0.7:3389",
    password: "Tr4!nWqm8s",
    status: "active",
  },
  {
    id: "asn-03",
    user: "unassigned",
    lab: "NKP Cluster Bootstrap",
    machine: "nkp-node-03",
    rdpHost: "10.42.0.9:3389",
    password: "N/A",
    status: "pending",
  },
  {
    id: "asn-04",
    user: "carter",
    lab: "Storage Failover Drill",
    machine: "nkp-node-04",
    rdpHost: "10.42.0.11:3389",
    password: "Hb7#eYcT31",
    status: "revoked",
  },
];

const statusLabel: Record<AssignmentStatus, string> = {
  active: "Active",
  pending: "Pending",
  revoked: "Revoked",
};

const statusVariant: Record<AssignmentStatus, "success" | "warning" | "danger"> = {
  active: "success",
  pending: "warning",
  revoked: "danger",
};

export function LabCredentialsPage() {
  const [revealedId, setRevealedId] = useState<string | null>(null);

  return (
    <AppShell nav={adminNav} title="Lab Credentials">
      <div className="flex flex-col gap-xl">
        <div className="flex items-center justify-between gap-sm">
          <div className="flex flex-col gap-xxs">
            <h2 className="text-h2 text-foreground">Lab Credentials</h2>
            <p className="text-body-sm text-muted-foreground">
              Assign a provisioned machine's RDP access to a participant.
            </p>
          </div>
          <Button variant="primary">Assign credentials</Button>
        </div>

        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="px-lg py-sm text-label text-muted-foreground">User</th>
                <th className="px-lg py-sm text-label text-muted-foreground">Lab</th>
                <th className="px-lg py-sm text-label text-muted-foreground">Machine</th>
                <th className="px-lg py-sm text-label text-muted-foreground">RDP Host</th>
                <th className="px-lg py-sm text-label text-muted-foreground">Password</th>
                <th className="px-lg py-sm text-label text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-b-0 hover:bg-foreground/[0.03]">
                  <td className="px-lg py-sm text-body-sm text-foreground">{a.user}</td>
                  <td className="px-lg py-sm text-body-sm text-muted-foreground">{a.lab}</td>
                  <td className="px-lg py-sm text-body-sm text-muted-foreground">{a.machine}</td>
                  <td className="px-lg py-sm text-body-sm font-mono tabular-nums text-foreground">{a.rdpHost}</td>
                  <td className="px-lg py-sm">
                    <span className="flex items-center gap-xs">
                      <span className="font-mono text-body-sm tabular-nums text-foreground">
                        {revealedId === a.id ? a.password : "••••••••"}
                      </span>
                      <Button
                        variant="ghost"
                        aria-label="Copy password"
                        className="px-xs py-xs"
                        onClick={() => setRevealedId((id) => (id === a.id ? null : a.id))}
                      >
                        <Copy className="size-3.5" />
                      </Button>
                    </span>
                  </td>
                  <td className="px-lg py-sm">
                    <Badge variant={statusVariant[a.status]}>{statusLabel[a.status]}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
