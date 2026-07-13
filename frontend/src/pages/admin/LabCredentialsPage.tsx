import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AppShell } from "@/layouts/AppShell";
import { adminNav } from "./adminNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KeyRound, Link2, Plus, Trash2, Type as TypeIcon, FileCode, Search, FlaskConical } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { toast } from "sonner";

type VarType = "endpoint" | "yaml" | "text";
type CredentialVar = { _id: string; label: string; type: VarType };
type Lab = { _id: string; slug: string; title: string; credentialVars: CredentialVar[] };
type Assignment = {
  id: string;
  user: { id: string; username: string };
  lab: { id: string; slug: string; title: string };
  credentialValues: Record<string, string>;
};

const TYPE_OPTIONS: { value: VarType; label: string }[] = [
  { value: "text", label: "text — plain copy" },
  { value: "endpoint", label: "endpoint — URL" },
  { value: "yaml", label: "yaml — code block" },
];

const TYPE_META: Record<VarType, { icon: typeof Link2; hint: string }> = {
  endpoint: { icon: Link2, hint: "https://…" },
  yaml: { icon: FileCode, hint: "paste yaml…" },
  text: { icon: TypeIcon, hint: "" },
};

const textareaClass =
  "flex min-h-32 w-full resize-y rounded-md border border-input bg-surface px-sm py-sm font-mono text-body-sm text-foreground " +
  "placeholder:text-muted-foreground outline-none transition-[color,border-color,box-shadow] duration-[var(--duration-fast)] ease-standard " +
  "hover:border-ink-500/40 focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/12";

export function LabCredentialsPage() {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [labSlug, setLabSlug] = useState("");
  const [userId, setUserId] = useState("");

  // Add-variable row
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<VarType>("text");
  const [varError, setVarError] = useState<string | null>(null);

  // Per-user value form
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  const selectedLab = useMemo(() => labs.find((l) => l.slug === labSlug) ?? null, [labs, labSlug]);
  const labAssignments = useMemo(
    () => assignments.filter((a) => a.lab.slug === labSlug),
    [assignments, labSlug],
  );
  const selectedAssignment = useMemo(
    () => labAssignments.find((a) => a.user.id === userId) ?? null,
    [labAssignments, userId],
  );

  async function load() {
    try {
      const [l, a] = await Promise.all([
        api<Lab[]>("/admin/labs"),
        api<Assignment[]>("/admin/assignments"),
      ]);
      setLabs(l);
      setAssignments(a);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load lab credentials");
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Reset the user selection + form whenever the lab changes.
  useEffect(() => {
    setUserId("");
    setFormValues({});
  }, [labSlug]);

  // Prefill the value form from the selected user's saved values.
  useEffect(() => {
    setFormValues(selectedAssignment ? { ...selectedAssignment.credentialValues } : {});
    setSaveError(null);
  }, [selectedAssignment]);

  async function onAddVar(e: FormEvent) {
    e.preventDefault();
    if (!selectedLab || !newLabel.trim()) return;
    setVarError(null);
    try {
      const vars = await api<CredentialVar[]>(`/admin/labs/${selectedLab.slug}/credential-vars`, {
        method: "POST",
        body: JSON.stringify({ label: newLabel.trim(), type: newType }),
      });
      setLabs((prev) => prev.map((l) => (l.slug === selectedLab.slug ? { ...l, credentialVars: vars } : l)));
      setNewLabel("");
      setNewType("text");
    } catch (err) {
      setVarError(err instanceof ApiError ? err.message : "Failed to add variable");
    }
  }

  async function onRemoveVar(varId: string) {
    if (!selectedLab) return;
    setVarError(null);
    try {
      const vars = await api<CredentialVar[]>(
        `/admin/labs/${selectedLab.slug}/credential-vars/${varId}`,
        { method: "DELETE" },
      );
      setLabs((prev) => prev.map((l) => (l.slug === selectedLab.slug ? { ...l, credentialVars: vars } : l)));
      // The server unset this key from every assignment on the lab — mirror that
      // locally so stale values don't reappear when re-selecting a user.
      setAssignments((prev) =>
        prev.map((a) => {
          if (a.lab.slug !== selectedLab.slug) return a;
          const { [varId]: _removed, ...rest } = a.credentialValues;
          return { ...a, credentialValues: rest };
        }),
      );
      setFormValues((prev) => {
        const { [varId]: _removed, ...rest } = prev;
        return rest;
      });
    } catch (err) {
      setVarError(err instanceof ApiError ? err.message : "Failed to remove variable");
    }
  }

  async function onSaveValues(e: FormEvent) {
    e.preventDefault();
    if (!selectedAssignment) return;
    setSaveError(null);
    try {
      const { credentialValues } = await api<{ credentialValues: Record<string, string> }>(
        `/admin/assignments/${selectedAssignment.id}/credentials`,
        { method: "PATCH", body: JSON.stringify({ values: formValues }) },
      );
      setAssignments((prev) =>
        prev.map((a) => (a.id === selectedAssignment.id ? { ...a, credentialValues } : a)),
      );
      toast.success("Credentials saved", {
        description: `${selectedAssignment.user.username}'s values have been updated.`,
      });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to save values";
      setSaveError(msg);
      toast.error("Failed to save credentials", { description: msg });
    }
  }

  const vars = selectedLab?.credentialVars ?? [];

  return (
    <AppShell nav={adminNav} title="Lab Credentials">
      <div className="flex flex-col gap-lg">
        {/* Header */}
        <div className="flex items-start gap-md">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <KeyRound className="size-5" />
          </div>
          <div>
            <h2 className="text-h2 text-foreground">Lab Credentials</h2>
            <p className="mt-xxs text-body-sm text-muted-foreground">
              Define the credential variables a lab shows, then fill in each participant&apos;s values.
            </p>
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded-md border border-destructive/20 bg-destructive/10 p-md text-body-sm font-medium text-destructive">
            {error}
          </p>
        )}

        {/* Lab picker — full-width context bar with icon */}
        <div className="flex flex-col gap-sm rounded-lg border border-border bg-surface p-md shadow-sm">
          <div className="flex flex-col gap-xs sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-sm">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <FlaskConical className="size-4" />
              </div>
              <div className="flex flex-col gap-xxs">
                <span className="text-label text-muted-foreground uppercase">Lab</span>
                {selectedLab ? (
                  <span className="text-body font-semibold text-foreground">{selectedLab.title}</span>
                ) : (
                  <span className="text-body-sm text-muted-foreground">No lab selected</span>
                )}
              </div>
            </div>
            <Select value={labSlug} onValueChange={setLabSlug}>
              <SelectTrigger className="w-full sm:w-72">
                <Search className="mr-2 size-4 shrink-0 text-muted-foreground" />
                <SelectValue placeholder="Select a lab…" />
              </SelectTrigger>
              <SelectContent>
                {labs.map((l) => (
                  <SelectItem key={l._id} value={l.slug}>
                    <span className="flex flex-col">
                      <span className="text-body-sm font-medium">{l.title}</span>
                      <span className="text-label text-muted-foreground">{l.slug}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedLab ? (
          <div className="grid gap-lg md:grid-cols-2">
            {/* Section 1 — variable schema */}
            <Card className="flex flex-col shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Variables
                  <Badge variant="neutral">{vars.length}</Badge>
                </CardTitle>
                <CardDescription>
                  Shared by every participant of this lab. Editing = remove and re-add.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-md">
                <ul className="flex flex-col gap-xs">
                  {vars.length === 0 && (
                    <li className="rounded-md border border-dashed border-border/60 px-md py-lg text-center text-body-sm text-muted-foreground">
                      No variables yet — add one below.
                    </li>
                  )}
                  {vars.map((v) => {
                    const Icon = TYPE_META[v.type].icon;
                    return (
                      <li
                        key={v._id}
                        className="group flex items-center gap-sm rounded-md border border-border bg-surface px-md py-sm transition-colors hover:border-ink-500/40"
                      >
                        <Icon className="size-4 shrink-0 text-muted-foreground" />
                        <span className="flex-1 truncate font-mono text-body-sm text-foreground">{v.label}</span>
                        <Badge variant="neutral" className="font-normal">{v.type}</Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          aria-label={`Remove ${v.label}`}
                          className="size-8 p-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100"
                          onClick={() => onRemoveVar(v._id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </li>
                    );
                  })}
                </ul>

                <form onSubmit={onAddVar} className="flex flex-col gap-sm rounded-md border border-border/60 bg-canvas p-md">
                  <div className="flex flex-col gap-sm sm:flex-row sm:items-end">
                    <label className="flex flex-1 flex-col gap-xs">
                      <span className="text-label text-muted-foreground">Label</span>
                      <Input
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        placeholder="e.g. nkp_dashboard"
                      />
                    </label>
                    <label className="flex flex-col gap-xs sm:w-44">
                      <span className="text-label text-muted-foreground">Type</span>
                      <Select value={newType} onValueChange={(v) => setNewType(v as VarType)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TYPE_OPTIONS.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </label>
                  </div>
                  <Button type="submit" variant="primary" className="gap-1 self-start" disabled={!newLabel.trim()}>
                    <Plus className="size-4" />
                    Add variable
                  </Button>
                  {varError && <p role="alert" className="text-body-sm text-destructive">{varError}</p>}
                </form>
              </CardContent>
            </Card>

            {/* Section 2 — per-user values */}
            <Card className="flex flex-col shadow-sm">
              <CardHeader>
                <CardTitle>Participant values</CardTitle>
                <CardDescription>Each value maps 1:1 to the selected user.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-md">
                <div className="flex flex-col gap-xs">
                  <span className="text-label text-muted-foreground">User</span>
                  <Select value={userId} onValueChange={setUserId} disabled={labAssignments.length === 0}>
                    <SelectTrigger>
                      <Search className="mr-2 size-4 shrink-0 text-muted-foreground" />
                      <SelectValue
                        placeholder={labAssignments.length === 0 ? "No users assigned to this lab" : "Select a user…"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {labAssignments.map((a) => (
                        <SelectItem key={a.id} value={a.user.id}>
                          {a.user.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {!selectedAssignment ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-sm rounded-md border border-dashed border-border/60 px-md py-xl text-center">
                    <Search className="size-8 text-muted-foreground/40" />
                    <p className="max-w-48 text-body-sm text-muted-foreground">
                      Select a user to fill their credential values.
                    </p>
                  </div>
                ) : vars.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-sm rounded-md border border-dashed border-border/60 px-md py-xl text-center">
                    <Plus className="size-8 text-muted-foreground/40" />
                    <p className="max-w-48 text-body-sm text-muted-foreground">
                      Add a variable first, then fill its value.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={onSaveValues} className="flex flex-col gap-md">
                    {vars.map((v) => (
                      <label key={v._id} className="flex flex-col gap-xs">
                        <span className="flex items-center gap-xs text-label text-muted-foreground">
                          <span className="font-mono normal-case text-foreground">{v.label}</span>
                          <Badge variant="neutral" className="font-normal">{v.type}</Badge>
                        </span>
                        {v.type === "yaml" ? (
                          <textarea
                            className={textareaClass}
                            value={formValues[v._id] ?? ""}
                            onChange={(e) => setFormValues((p) => ({ ...p, [v._id]: e.target.value }))}
                            placeholder={TYPE_META[v.type].hint}
                          />
                        ) : (
                          <Input
                            className="font-mono"
                            value={formValues[v._id] ?? ""}
                            onChange={(e) => setFormValues((p) => ({ ...p, [v._id]: e.target.value }))}
                            placeholder={TYPE_META[v.type].hint}
                          />
                        )}
                      </label>
                    ))}
                    <div className="flex items-center gap-sm">
                      <Button type="submit" variant="primary">Save values</Button>
                    </div>
                    {saveError && <p role="alert" className="text-body-sm text-destructive">{saveError}</p>}
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex items-center gap-sm rounded-md border border-dashed border-border/60 p-xl text-body-sm text-muted-foreground">
            <KeyRound className="size-4" />
            Select a lab to manage its credentials.
          </div>
        )}
      </div>
    </AppShell>
  );
}
