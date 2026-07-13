import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AppShell } from "@/layouts/AppShell";
import { adminNav } from "./adminNav";
import { Button } from "@/components/ui/button";
import { KeyRound, Plus, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";

const selectClass =
  "h-10 rounded-md border border-input bg-surface px-sm py-xs text-body text-foreground " +
  "outline-none transition-[color,border-color,box-shadow] duration-[var(--duration-fast)] ease-standard " +
  "hover:border-ink-500/40 focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/12 " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const inputClass =
  "h-10 w-full rounded-md border border-input bg-surface px-sm py-xs text-body text-foreground " +
  "outline-none transition-[color,border-color,box-shadow] duration-[var(--duration-fast)] ease-standard " +
  "hover:border-ink-500/40 focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/12";

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
  { value: "text", label: "text (plain copy)" },
  { value: "endpoint", label: "endpoint (URL)" },
  { value: "yaml", label: "yaml (code block)" },
];

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
  const [saved, setSaved] = useState(false);

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
    setSaved(false);
  }, [labSlug]);

  // Prefill the value form from the selected user's saved values.
  useEffect(() => {
    setFormValues(selectedAssignment ? { ...selectedAssignment.credentialValues } : {});
    setSaveError(null);
    setSaved(false);
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
    setSaved(false);
    try {
      const { credentialValues } = await api<{ credentialValues: Record<string, string> }>(
        `/admin/assignments/${selectedAssignment.id}/credentials`,
        { method: "PATCH", body: JSON.stringify({ values: formValues }) },
      );
      setAssignments((prev) =>
        prev.map((a) => (a.id === selectedAssignment.id ? { ...a, credentialValues } : a)),
      );
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Failed to save values");
    }
  }

  const vars = selectedLab?.credentialVars ?? [];

  return (
    <AppShell nav={adminNav} title="Lab Credentials">
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Lab Credentials</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Define the credential variables a lab shows, then fill each participant&apos;s values.
          </p>
        </div>

        {error && (
          <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm font-medium text-destructive">
            {error}
          </p>
        )}

        {/* Lab picker */}
        <label className="flex max-w-sm flex-col gap-xs">
          <span className="text-label text-muted-foreground">Lab</span>
          <select className={selectClass} value={labSlug} onChange={(e) => setLabSlug(e.target.value)}>
            <option value="" disabled>
              Select a lab
            </option>
            {labs.map((l) => (
              <option key={l._id} value={l.slug}>
                {l.title}
              </option>
            ))}
          </select>
        </label>

        {selectedLab && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Section 1 — variable schema */}
            <section className="rounded-lg border border-border/40 bg-card p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground">Variables</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Shared by every participant of this lab. Edit = remove and re-add.
              </p>

              <ul className="mt-4 flex flex-col gap-2">
                {vars.length === 0 && (
                  <li className="text-sm text-muted-foreground">No variables yet.</li>
                )}
                {vars.map((v) => (
                  <li
                    key={v._id}
                    className="flex items-center justify-between gap-2 rounded-md border border-border/40 bg-muted/30 px-3 py-2"
                  >
                    <span className="font-mono text-sm text-foreground">{v.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{v.type}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        aria-label={`Remove ${v.label}`}
                        className="size-7 p-0 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        onClick={() => onRemoveVar(v._id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>

              <form onSubmit={onAddVar} className="mt-4 flex items-end gap-2">
                <label className="flex flex-1 flex-col gap-xs">
                  <span className="text-label text-muted-foreground">Label</span>
                  <input
                    className={inputClass}
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="e.g. nkp_dashboard"
                  />
                </label>
                <label className="flex flex-col gap-xs">
                  <span className="text-label text-muted-foreground">Type</span>
                  <select className={selectClass} value={newType} onChange={(e) => setNewType(e.target.value as VarType)}>
                    {TYPE_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </label>
                <Button type="submit" variant="primary" className="gap-1" disabled={!newLabel.trim()}>
                  <Plus className="size-4" />
                  Add
                </Button>
              </form>
              {varError && <p role="alert" className="mt-2 text-sm text-destructive">{varError}</p>}
            </section>

            {/* Section 2 — per-user values */}
            <section className="rounded-lg border border-border/40 bg-card p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground">Participant values</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Each value maps 1:1 to the selected user.
              </p>

              <label className="mt-4 flex flex-col gap-xs">
                <span className="text-label text-muted-foreground">User</span>
                <select
                  className={selectClass}
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  disabled={labAssignments.length === 0}
                >
                  <option value="" disabled>
                    {labAssignments.length === 0 ? "No users assigned to this lab" : "Select a user"}
                  </option>
                  {labAssignments.map((a) => (
                    <option key={a.id} value={a.user.id}>
                      {a.user.username}
                    </option>
                  ))}
                </select>
              </label>

              {selectedAssignment && (
                <form onSubmit={onSaveValues} className="mt-4 flex flex-col gap-4">
                  {vars.length === 0 && (
                    <p className="text-sm text-muted-foreground">Add a variable first.</p>
                  )}
                  {vars.map((v) => (
                    <label key={v._id} className="flex flex-col gap-xs">
                      <span className="text-label text-muted-foreground">
                        {v.label} <span className="text-muted-foreground/60">· {v.type}</span>
                      </span>
                      {v.type === "yaml" ? (
                        <textarea
                          className={`${inputClass} h-32 resize-y py-sm font-mono`}
                          value={formValues[v._id] ?? ""}
                          onChange={(e) => setFormValues((p) => ({ ...p, [v._id]: e.target.value }))}
                          placeholder="paste yaml…"
                        />
                      ) : (
                        <input
                          className={`${inputClass} font-mono`}
                          value={formValues[v._id] ?? ""}
                          onChange={(e) => setFormValues((p) => ({ ...p, [v._id]: e.target.value }))}
                          placeholder={v.type === "endpoint" ? "https://…" : ""}
                        />
                      )}
                    </label>
                  ))}
                  {vars.length > 0 && (
                    <div className="flex items-center gap-3">
                      <Button type="submit" variant="primary">
                        Save
                      </Button>
                      {saved && <span className="text-sm text-success">Saved</span>}
                    </div>
                  )}
                  {saveError && <p role="alert" className="text-sm text-destructive">{saveError}</p>}
                </form>
              )}
            </section>
          </div>
        )}

        {!selectedLab && (
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
            <KeyRound className="size-4" />
            Select a lab to manage its credentials.
          </div>
        )}
      </div>
    </AppShell>
  );
}
