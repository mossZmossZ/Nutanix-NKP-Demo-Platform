import fs from "fs";
import path from "path";
import { env } from "../config/env";

export interface WikiPage {
  file: string;
  order: number;
  title: string;
}

const PAGE_PATTERN = /^(\d+)-.*\.md$/;
const IMAGE_CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

function labDir(slug: string, root: string): string {
  return path.join(root, slug);
}

/** Reject filenames that could escape the lab directory. */
function assertSafeFile(file: string): void {
  if (file.includes("/") || file.includes("\\") || file.includes("..")) {
    throw new Error(`Invalid wiki page filename: ${file}`);
  }
}

/** Create wiki/<slug>/ with a starter 01-intro.md if it doesn't already exist. */
export function scaffoldLab(slug: string, root: string = env.wikiDir): void {
  const dir = labDir(slug, root);
  if (fs.existsSync(dir)) return;
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "01-intro.md"), `# Introduction\n\nTODO: write this lab.\n`);
}

/** List ordered page metadata for a lab, derived from wiki/<slug>/NN-*.md filenames. */
export function listPages(slug: string, root: string = env.wikiDir): WikiPage[] {
  const dir = labDir(slug, root);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .map((file) => ({ file, match: PAGE_PATTERN.exec(file) }))
    .filter((entry): entry is { file: string; match: RegExpExecArray } => entry.match !== null)
    .map(({ file, match }) => {
      const content = fs.readFileSync(path.join(dir, file), "utf8");
      const heading = /^#\s+(.+)$/m.exec(content);
      return {
        file,
        order: Number(match[1]),
        title: heading ? heading[1].trim() : file,
      };
    })
    .sort((a, b) => a.order - b.order);
}

/** Read one page's markdown content. */
export function readPage(slug: string, file: string, root: string = env.wikiDir): string {
  assertSafeFile(file);
  return fs.readFileSync(path.join(labDir(slug, root), file), "utf8");
}

/** Read one lab image's raw bytes + content-type from wiki/<slug>/images/. */
export function readImage(
  slug: string,
  file: string,
  root: string = env.wikiDir,
): { data: Buffer; contentType: string } {
  assertSafeFile(file);
  const contentType = IMAGE_CONTENT_TYPES[path.extname(file).toLowerCase()];
  if (!contentType) {
    throw new Error(`Unsupported image type: ${file}`);
  }
  const data = fs.readFileSync(path.join(labDir(slug, root), "images", file));
  return { data, contentType };
}

/** Write/overwrite one page's markdown content. */
export function writePage(
  slug: string,
  file: string,
  content: string,
  root: string = env.wikiDir,
): void {
  assertSafeFile(file);
  const dir = labDir(slug, root);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, file), content);
}

/**
 * Create a new page from a title: filename is NN-<slugified-title>.md where NN
 * is one past the highest existing page number, seeded with a `# <title>`
 * heading. Returns the new page's metadata. No renumbering of siblings.
 */
export function createPage(
  slug: string,
  title: string,
  root: string = env.wikiDir,
): WikiPage {
  const pages = listPages(slug, root);
  const order = (pages.length ? Math.max(...pages.map((p) => p.order)) : 0) + 1;
  const nn = String(order).padStart(2, "0");
  const namePart = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const file = `${nn}-${namePart || "page"}.md`;
  writePage(slug, file, `# ${title}\n`, root);
  return { file, order, title };
}

/**
 * Reorder a page by swapping its NN- filename prefix with its neighbour in the
 * given direction. Renaming is done via a temp name so pages that share a name
 * part never collide mid-swap. A move at the first/last edge is a no-op.
 * Returns the updated ordered page list.
 */
export function movePage(
  slug: string,
  file: string,
  direction: "up" | "down",
  root: string = env.wikiDir,
): WikiPage[] {
  assertSafeFile(file);
  const pages = listPages(slug, root);
  const idx = pages.findIndex((p) => p.file === file);
  if (idx === -1) throw new Error(`Wiki page not found: ${file}`);

  const neighborIdx = direction === "up" ? idx - 1 : idx + 1;
  if (neighborIdx < 0 || neighborIdx >= pages.length) return pages; // already at the edge

  const dir = labDir(slug, root);
  const a = pages[idx].file;
  const b = pages[neighborIdx].file;
  const prefix = (f: string) => f.slice(0, f.indexOf("-"));
  const rest = (f: string) => f.slice(f.indexOf("-") + 1);
  const aNew = `${prefix(b)}-${rest(a)}`; // a takes b's position (prefix)
  const bNew = `${prefix(a)}-${rest(b)}`; // b takes a's position (prefix)

  const tmp = path.join(dir, `.tmp-${a}`);
  fs.renameSync(path.join(dir, a), tmp);
  fs.renameSync(path.join(dir, b), path.join(dir, bNew));
  fs.renameSync(tmp, path.join(dir, aNew));

  return listPages(slug, root);
}

/** Delete one page file. Caller enforces the "keep at least one page" rule. */
export function deletePage(slug: string, file: string, root: string = env.wikiDir): void {
  assertSafeFile(file);
  fs.rmSync(path.join(labDir(slug, root), file), { force: true });
}

/** Recursively remove wiki/<slug>/. */
export function removeLab(slug: string, root: string = env.wikiDir): void {
  fs.rmSync(labDir(slug, root), { recursive: true, force: true });
}
