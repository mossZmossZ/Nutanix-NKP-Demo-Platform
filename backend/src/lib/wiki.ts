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

/** Recursively remove wiki/<slug>/. */
export function removeLab(slug: string, root: string = env.wikiDir): void {
  fs.rmSync(labDir(slug, root), { recursive: true, force: true });
}
