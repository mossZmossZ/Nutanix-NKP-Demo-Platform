import { useEffect, useRef, useState, type FormEvent } from "react";
import { AppShell } from "@/layouts/AppShell";
import { adminNav } from "./adminNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { BookOpen, FileText, Layers, Pencil, Trash2, BarChart3, Download, Upload, Plus, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";

type Difficulty = "Beginner" | "Intermediate" | "Advanced";

// Raw Mongoose doc from GET /admin/labs — id field is `_id`, not `id`.
interface Lab {
  _id: string;
  slug: string;
  title: string;
  summary?: string;
  difficulty: Difficulty;
  duration: string;
  order: number;
  pageCount: number;
}

interface WikiPage {
  file: string;
  order: number;
  title: string;
}

interface LabDetail extends Lab {
  pages: WikiPage[];
}

const selectClass =
  "h-10 rounded-md border border-input bg-surface px-sm py-xs text-body text-foreground " +
  "outline-none transition-[color,border-color,box-shadow] duration-[var(--duration-fast)] ease-standard " +
  "hover:border-ink-500/40 focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/12";

const textareaClass =
  "min-h-[24rem] w-full flex-1 resize-none rounded-md border border-input bg-surface px-sm py-xs " +
  "font-mono text-body-sm text-foreground outline-none transition-[color,border-color,box-shadow] " +
  "duration-[var(--duration-fast)] ease-standard hover:border-ink-500/40 " +
  "focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/12";

// Compact summary field (~3 rows) — the page-editor `textareaClass` bakes in a
// 24rem min-height that would make the lab dialogs taller than the viewport.
const summaryClass =
  "min-h-20 w-full resize-none rounded-md border border-input bg-surface px-sm py-xs " +
  "text-body text-foreground outline-none transition-[color,border-color,box-shadow] " +
  "duration-[var(--duration-fast)] ease-standard hover:border-ink-500/40 " +
  "focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/12";

const emptyForm = { slug: "", title: "", summary: "", difficulty: "Beginner" as Difficulty, duration: "", order: 0 };

export function LabManagementPage() {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit dialog
  const [editLab, setEditLab] = useState<Lab | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete confirm dialog
  const [deleteLab, setDeleteLab] = useState<Lab | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Import (file picker + overwrite-confirm dialog)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [overwrite, setOverwrite] = useState<{
    content: string;
    slug: string;
    assignmentCount: number;
  } | null>(null);

  // Guide-page editor dialog
  const [pagesLab, setPagesLab] = useState<Lab | null>(null);
  const [pages, setPages] = useState<WikiPage[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [savedContent, setSavedContent] = useState("");
  const [pagesError, setPagesError] = useState<string | null>(null);
  const [savingPage, setSavingPage] = useState(false);

  // New-page dialog (nested over the page editor)
  const [newPageOpen, setNewPageOpen] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPageError, setNewPageError] = useState<string | null>(null);
  const [creatingPage, setCreatingPage] = useState(false);

  // Delete-page confirm (nested over the page editor)
  const [deletePageTarget, setDeletePageTarget] = useState<WikiPage | null>(null);
  const [deletePageError, setDeletePageError] = useState<string | null>(null);

  async function load() {
    try {
      setLabs(await api<Lab[]>("/admin/labs"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load labs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setCreateForm(emptyForm);
    setCreateError(null);
    setCreateOpen(true);
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setCreateError(null);
    try {
      await api("/admin/labs", {
        method: "POST",
        body: JSON.stringify({
          slug: createForm.slug,
          title: createForm.title,
          summary: createForm.summary,
          difficulty: createForm.difficulty,
          duration: createForm.duration,
          order: Number(createForm.order) || 0,
        }),
      });
      setCreateOpen(false);
      await load();
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : "Failed to create lab");
    }
  }

  function openEdit(lab: Lab) {
    setEditLab(lab);
    setEditForm({
      slug: lab.slug,
      title: lab.title,
      summary: lab.summary ?? "",
      difficulty: lab.difficulty,
      duration: lab.duration,
      order: lab.order,
    });
    setEditError(null);
  }

  async function onEdit(e: FormEvent) {
    e.preventDefault();
    if (!editLab) return;
    setEditError(null);
    try {
      await api(`/admin/labs/${editLab.slug}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: editForm.title,
          summary: editForm.summary,
          difficulty: editForm.difficulty,
          duration: editForm.duration,
          order: Number(editForm.order) || 0,
        }),
      });
      setEditLab(null);
      await load();
    } catch (err) {
      setEditError(err instanceof ApiError ? err.message : "Failed to update lab");
    }
  }

  async function onDelete() {
    if (!deleteLab) return;
    setDeleteError(null);
    try {
      await api(`/admin/labs/${deleteLab.slug}`, { method: "DELETE" });
      setDeleteLab(null);
      await load();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "Failed to delete lab");
    }
  }

  // Export downloads the single-file .md archive. A same-origin anchor carries
  // the auth cookie, so the browser handles the download directly.
  function exportLab(lab: Lab) {
    const a = document.createElement("a");
    a.href = `/api/admin/labs/${lab.slug}/export`;
    a.download = `${lab.slug}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // POST the archive; a 409 means the slug exists and the admin must confirm an
  // overwrite. Raw fetch (not the api helper) so we can read the 409's body.
  async function postImport(content: string, mode?: "overwrite") {
    const res = await fetch("/api/admin/labs/import", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, mode }),
    });
    const body = await res.json().catch(() => ({}));
    return { status: res.status, body };
  }

  async function onImportFile(file: File) {
    const content = await file.text();
    try {
      const { status, body } = await postImport(content);
      if (status === 409) {
        setOverwrite({ content, slug: body.slug, assignmentCount: body.assignmentCount ?? 0 });
        return;
      }
      if (status >= 400) {
        toast.error(body.error ?? "Failed to import lab");
        return;
      }
      toast.success(`Imported "${body.slug}" (${body.pageCount} pages)`);
      await load();
    } catch {
      toast.error("Failed to read the lab file");
    }
  }

  async function onConfirmOverwrite() {
    if (!overwrite) return;
    const { status, body } = await postImport(overwrite.content, "overwrite");
    if (status >= 400) {
      toast.error(body.error ?? "Failed to overwrite lab");
      return;
    }
    setOverwrite(null);
    toast.success(`Overwrote "${body.slug}" (${body.pageCount} pages)`);
    await load();
  }

  async function openPages(lab: Lab) {
    setPagesLab(lab);
    setPages([]);
    setActiveFile(null);
    setContent("");
    setSavedContent("");
    setPagesError(null);
    try {
      const detail = await api<LabDetail>(`/admin/labs/${lab.slug}`);
      setPages(detail.pages);
      if (detail.pages.length > 0) {
        await openPage(lab.slug, detail.pages[0].file);
      }
    } catch (err) {
      setPagesError(err instanceof ApiError ? err.message : "Failed to load pages");
    }
  }

  async function openPage(slug: string, file: string) {
    setPagesError(null);
    try {
      const page = await api<{ file: string; content: string }>(`/admin/labs/${slug}/pages/${file}`);
      setActiveFile(page.file);
      setContent(page.content);
      setSavedContent(page.content);
    } catch (err) {
      setPagesError(err instanceof ApiError ? err.message : "Failed to load page");
    }
  }

  async function onSavePage() {
    if (!pagesLab || !activeFile) return;
    setSavingPage(true);
    setPagesError(null);
    try {
      const saved = await api<{ file: string; content: string }>(
        `/admin/labs/${pagesLab.slug}/pages/${activeFile}`,
        { method: "PUT", body: JSON.stringify({ content }) },
      );
      setSavedContent(saved.content);
    } catch (err) {
      setPagesError(err instanceof ApiError ? err.message : "Failed to save page");
    } finally {
      setSavingPage(false);
    }
  }

  async function onCreatePage(e: FormEvent) {
    e.preventDefault();
    if (!pagesLab) return;
    setNewPageError(null);
    setCreatingPage(true);
    try {
      const page = await api<WikiPage>(`/admin/labs/${pagesLab.slug}/pages`, {
        method: "POST",
        body: JSON.stringify({ title: newPageTitle.trim() }),
      });
      const detail = await api<LabDetail>(`/admin/labs/${pagesLab.slug}`);
      setPages(detail.pages);
      await openPage(pagesLab.slug, page.file);
      setNewPageOpen(false);
      setNewPageTitle("");
      toast.success(`Created "${page.title}"`);
      await load();
    } catch (err) {
      setNewPageError(err instanceof ApiError ? err.message : "Failed to create page");
    } finally {
      setCreatingPage(false);
    }
  }

  // Reorder a page; the swap renames files, so re-point activeFile at the same
  // page by its name part (everything after the NN- prefix, stable across moves).
  async function onMovePage(file: string, direction: "up" | "down") {
    if (!pagesLab) return;
    setPagesError(null);
    try {
      const updated = await api<WikiPage[]>(`/admin/labs/${pagesLab.slug}/pages/${file}/move`, {
        method: "POST",
        body: JSON.stringify({ direction }),
      });
      setPages(updated);
      if (activeFile) {
        const stem = (f: string) => f.replace(/^\d+-/, "");
        const next =
          updated.find((p) => p.file === activeFile) ??
          updated.find((p) => stem(p.file) === stem(activeFile));
        if (next) setActiveFile(next.file);
      }
    } catch (err) {
      setPagesError(err instanceof ApiError ? err.message : "Failed to reorder page");
    }
  }

  async function onDeletePage() {
    if (!pagesLab || !deletePageTarget) return;
    setDeletePageError(null);
    try {
      await api(`/admin/labs/${pagesLab.slug}/pages/${deletePageTarget.file}`, { method: "DELETE" });
      const detail = await api<LabDetail>(`/admin/labs/${pagesLab.slug}`);
      setPages(detail.pages);
      if (activeFile === deletePageTarget.file) {
        if (detail.pages.length > 0) await openPage(pagesLab.slug, detail.pages[0].file);
        else {
          setActiveFile(null);
          setContent("");
          setSavedContent("");
        }
      }
      setDeletePageTarget(null);
      toast.success(`Deleted "${deletePageTarget.title}"`);
      await load();
    } catch (err) {
      setDeletePageError(err instanceof ApiError ? err.message : "Failed to delete page");
    }
  }

  const dirty = content !== savedContent;
  const totalPages = labs.reduce((sum, lab) => sum + lab.pageCount, 0);

  return (
    <AppShell nav={adminNav} title="Labs">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-h1 text-foreground">Lab Management</h2>
            <p className="mt-1 text-body-sm text-muted-foreground">
              Create and curate hands-on lab guides for the workshop catalog
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,text/markdown"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImportFile(file);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
            >
              <Upload className="size-4" />
              Import
            </Button>
            <Button type="button" variant="primary" onClick={openCreate} className="gap-2">
              <span className="text-lg leading-none">+</span>
              New Lab
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-md border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-md bg-iris-100 text-iris-600">
                <BookOpen className="size-5" />
              </div>
              <div>
                <p className="text-label text-muted-foreground">Total Labs</p>
                <p className="font-mono text-2xl font-bold tabular-nums text-foreground">{labs.length}</p>
              </div>
            </div>
          </div>
          <div className="rounded-md border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-md bg-iris-100 text-iris-600">
                <FileText className="size-5" />
              </div>
              <div>
                <p className="text-label text-muted-foreground">Total Pages</p>
                <p className="font-mono text-2xl font-bold tabular-nums text-foreground">{totalPages}</p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div role="alert" className="rounded-md border border-destructive/20 bg-destructive/10 p-4">
            <p className="text-body-sm font-medium text-destructive">{error}</p>
          </div>
        )}

        {/* Labs list */}
        {!loading && labs.length === 0 && !error ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border bg-card px-lg py-xxl text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-iris-100 text-iris-600">
              <BookOpen className="size-6" />
            </div>
            <div>
              <p className="text-h4 text-foreground">No labs yet</p>
              <p className="mt-1 text-body-sm text-muted-foreground">Create your first lab to build the workshop catalog.</p>
            </div>
            <Button type="button" variant="primary" onClick={openCreate} className="mt-1 gap-2">
              <span className="text-lg leading-none">+</span>
              New Lab
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {labs.map((lab) => (
              <div
                key={lab._id}
                className="flex flex-col gap-3 rounded-md border border-border bg-card p-lg shadow-sm transition-[transform,box-shadow] duration-[var(--duration-fast)] ease-standard hover:-translate-y-px hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-h4 text-foreground">{lab.title}</h3>
                    <p className="truncate font-mono text-body-sm text-muted-foreground">{lab.slug}</p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-muted px-xs py-xxs text-label text-muted-foreground">
                    <BarChart3 className="size-3.5" />
                    {lab.difficulty}
                  </span>
                </div>

                {lab.summary ? (
                  <p className="line-clamp-2 text-body-sm text-muted-foreground">{lab.summary}</p>
                ) : null}

                <div className="mt-auto flex flex-wrap items-center gap-3 pt-2 text-body-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <FileText className="size-3.5" />
                    <span className="font-mono tabular-nums">{lab.pageCount}</span> pages
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Layers className="size-3.5" />
                    <span className="font-mono tabular-nums">{lab.order}</span> order
                  </span>
                  {lab.duration ? <span className="font-mono tabular-nums">{lab.duration}</span> : null}
                </div>

                <div className="flex items-center gap-2 border-t border-border pt-3">
                  <Button type="button" variant="secondary" className="flex-1 gap-1.5" onClick={() => openEdit(lab)}>
                    <Pencil className="size-3.5" />
                    Edit
                  </Button>
                  <Button type="button" variant="secondary" className="flex-1 gap-1.5" onClick={() => openPages(lab)}>
                    <FileText className="size-3.5" />
                    Pages
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    aria-label={`Export ${lab.title}`}
                    onClick={() => exportLab(lab)}
                  >
                    <Download className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    aria-label={`Delete ${lab.title}`}
                    onClick={() => {
                      setDeleteLab(lab);
                      setDeleteError(null);
                    }}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New lab</DialogTitle>
            <DialogDescription>Scaffold a new lab guide in the catalog.</DialogDescription>
          </DialogHeader>
          <form id="create-lab-form" onSubmit={onCreate} className="flex flex-col gap-md">
            <label className="flex flex-col gap-xs">
              <span className="text-label text-muted-foreground">Slug (kebab-case)</span>
              <Input
                value={createForm.slug}
                onChange={(e) => setCreateForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="nkp-cluster-bootstrap"
                className="font-mono"
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                required
              />
            </label>
            <label className="flex flex-col gap-xs">
              <span className="text-label text-muted-foreground">Title</span>
              <Input
                value={createForm.title}
                onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </label>
            <label className="flex flex-col gap-xs">
              <span className="text-label text-muted-foreground">Summary</span>
              <textarea
                className={summaryClass}
                value={createForm.summary}
                onChange={(e) => setCreateForm((f) => ({ ...f, summary: e.target.value }))}
              />
            </label>
            <div className="grid grid-cols-2 gap-md">
              <label className="flex flex-col gap-xs">
                <span className="text-label text-muted-foreground">Difficulty</span>
                <select
                  className={selectClass}
                  value={createForm.difficulty}
                  onChange={(e) => setCreateForm((f) => ({ ...f, difficulty: e.target.value as Difficulty }))}
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </label>
              <label className="flex flex-col gap-xs">
                <span className="text-label text-muted-foreground">Duration</span>
                <Input
                  value={createForm.duration}
                  onChange={(e) => setCreateForm((f) => ({ ...f, duration: e.target.value }))}
                  placeholder="45 min"
                />
              </label>
            </div>
            <label className="flex flex-col gap-xs">
              <span className="text-label text-muted-foreground">Order</span>
              <Input
                type="number"
                value={createForm.order}
                onChange={(e) => setCreateForm((f) => ({ ...f, order: Number(e.target.value) }))}
              />
            </label>
            {createError && <p className="text-body-sm font-medium text-destructive">{createError}</p>}
          </form>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="create-lab-form" variant="primary">
              Create lab
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editLab !== null} onOpenChange={(open) => !open && setEditLab(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit lab</DialogTitle>
            <DialogDescription>Update the lab's catalog details.</DialogDescription>
          </DialogHeader>
          <form id="edit-lab-form" onSubmit={onEdit} className="flex flex-col gap-md">
            <label className="flex flex-col gap-xs">
              <span className="text-label text-muted-foreground">Slug</span>
              <Input value={editForm.slug} disabled className="font-mono" />
            </label>
            <label className="flex flex-col gap-xs">
              <span className="text-label text-muted-foreground">Title</span>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </label>
            <label className="flex flex-col gap-xs">
              <span className="text-label text-muted-foreground">Summary</span>
              <textarea
                className={summaryClass}
                value={editForm.summary}
                onChange={(e) => setEditForm((f) => ({ ...f, summary: e.target.value }))}
              />
            </label>
            <div className="grid grid-cols-2 gap-md">
              <label className="flex flex-col gap-xs">
                <span className="text-label text-muted-foreground">Difficulty</span>
                <select
                  className={selectClass}
                  value={editForm.difficulty}
                  onChange={(e) => setEditForm((f) => ({ ...f, difficulty: e.target.value as Difficulty }))}
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </label>
              <label className="flex flex-col gap-xs">
                <span className="text-label text-muted-foreground">Duration</span>
                <Input
                  value={editForm.duration}
                  onChange={(e) => setEditForm((f) => ({ ...f, duration: e.target.value }))}
                  placeholder="45 min"
                />
              </label>
            </div>
            <label className="flex flex-col gap-xs">
              <span className="text-label text-muted-foreground">Order</span>
              <Input
                type="number"
                value={editForm.order}
                onChange={(e) => setEditForm((f) => ({ ...f, order: Number(e.target.value) }))}
              />
            </label>
            {editError && <p className="text-body-sm font-medium text-destructive">{editError}</p>}
          </form>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setEditLab(null)}>
              Cancel
            </Button>
            <Button type="submit" form="edit-lab-form" variant="primary">
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={deleteLab !== null} onOpenChange={(open) => !open && setDeleteLab(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete lab</DialogTitle>
            <DialogDescription>
              Delete <span className="font-medium text-foreground">{deleteLab?.title}</span> ({deleteLab?.slug})?
              This removes its guide pages and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteError && <p className="text-body-sm font-medium text-destructive">{deleteError}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setDeleteLab(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={onDelete}>
              Delete lab
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import overwrite-confirm dialog */}
      <Dialog open={overwrite !== null} onOpenChange={(open) => !open && setOverwrite(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Overwrite existing lab</DialogTitle>
            <DialogDescription>
              A lab with slug <span className="font-mono text-foreground">{overwrite?.slug}</span> already
              exists. Importing will replace its metadata and all guide pages.
              {overwrite && overwrite.assignmentCount > 0 ? (
                <>
                  {" "}
                  <span className="font-medium text-foreground">
                    {overwrite.assignmentCount} participant
                    {overwrite.assignmentCount === 1 ? " is" : "s are"} assigned
                  </span>{" "}
                  — their saved values for any credential variable removed in this file will be cleared.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOverwrite(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={onConfirmOverwrite}>
              Overwrite lab
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Guide-page editor dialog */}
      <Dialog open={pagesLab !== null} onOpenChange={(open) => !open && setPagesLab(null)}>
        <DialogContent className="max-w-[min(56rem,calc(100vw-2rem))]">
          <DialogHeader>
            <DialogTitle>Guide pages — {pagesLab?.title}</DialogTitle>
            <DialogDescription>Edit the markdown source for each page in this lab.</DialogDescription>
          </DialogHeader>
          {pagesError && <p className="text-body-sm font-medium text-destructive">{pagesError}</p>}
          <div className="flex gap-md">
            <div className="flex w-48 shrink-0 flex-col gap-xxs">
              {pages.length === 0 ? (
                <p className="text-body-sm text-muted-foreground">No pages found.</p>
              ) : (
                pages.map((p, i) => (
                  <div
                    key={p.file}
                    className={`group flex items-center rounded-md transition-colors duration-[var(--duration-fast)] ease-standard ${
                      activeFile === p.file
                        ? "bg-iris-100 text-iris-600"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => pagesLab && openPage(pagesLab.slug, p.file)}
                      className="min-w-0 flex-1 truncate px-sm py-xs text-left text-body-sm font-medium"
                    >
                      {p.title}
                    </button>
                    <button
                      type="button"
                      aria-label={`Move ${p.title} up`}
                      disabled={i === 0}
                      onClick={() => onMovePage(p.file, "up")}
                      className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-accent-foreground focus-visible:opacity-100 group-hover:opacity-100 disabled:pointer-events-none disabled:text-muted-foreground/40 disabled:hover:bg-transparent"
                    >
                      <ChevronUp className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Move ${p.title} down`}
                      disabled={i === pages.length - 1}
                      onClick={() => onMovePage(p.file, "down")}
                      className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-accent-foreground focus-visible:opacity-100 group-hover:opacity-100 disabled:pointer-events-none disabled:text-muted-foreground/40 disabled:hover:bg-transparent"
                    >
                      <ChevronDown className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${p.title}`}
                      disabled={pages.length <= 1}
                      onClick={() => {
                        setDeletePageTarget(p);
                        setDeletePageError(null);
                      }}
                      className="mr-1 shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100 disabled:pointer-events-none disabled:opacity-0"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))
              )}
              <Button
                type="button"
                variant="ghost"
                className="mt-1 justify-start gap-1.5 text-body-sm"
                onClick={() => {
                  setNewPageTitle("");
                  setNewPageError(null);
                  setNewPageOpen(true);
                }}
              >
                <Plus className="size-3.5" />
                New page
              </Button>
            </div>
            <div className="flex flex-1 flex-col gap-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-body-sm text-muted-foreground">{activeFile ?? ""}</span>
                <span className="text-label text-muted-foreground">{dirty ? "Unsaved changes" : "Saved"}</span>
              </div>
              <textarea
                className={textareaClass}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={!activeFile}
                spellCheck={false}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setPagesLab(null)}>
              Close
            </Button>
            <Button type="button" variant="primary" disabled={!activeFile || !dirty || savingPage} onClick={onSavePage}>
              {savingPage ? "Saving…" : "Save page"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New-page dialog (nested over the page editor) */}
      <Dialog open={newPageOpen} onOpenChange={(open) => !open && setNewPageOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New page</DialogTitle>
            <DialogDescription>
              Add a guide page to <span className="font-medium text-foreground">{pagesLab?.title}</span>. The
              filename is generated from the title.
            </DialogDescription>
          </DialogHeader>
          <form id="new-page-form" onSubmit={onCreatePage} className="flex flex-col gap-md">
            <label className="flex flex-col gap-xs">
              <span className="text-label text-muted-foreground">Page title</span>
              <Input
                value={newPageTitle}
                onChange={(e) => setNewPageTitle(e.target.value)}
                placeholder="Deploy the cluster"
                autoFocus
                required
              />
            </label>
            {newPageError && <p className="text-body-sm font-medium text-destructive">{newPageError}</p>}
          </form>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setNewPageOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="new-page-form"
              variant="primary"
              disabled={!newPageTitle.trim() || creatingPage}
            >
              {creatingPage ? "Creating…" : "Create page"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete-page confirm (nested over the page editor) */}
      <Dialog open={deletePageTarget !== null} onOpenChange={(open) => !open && setDeletePageTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete page</DialogTitle>
            <DialogDescription>
              Delete <span className="font-medium text-foreground">{deletePageTarget?.title}</span>{" "}
              (<span className="font-mono">{deletePageTarget?.file}</span>)? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deletePageError && <p className="text-body-sm font-medium text-destructive">{deletePageError}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setDeletePageTarget(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={onDeletePage}>
              Delete page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
