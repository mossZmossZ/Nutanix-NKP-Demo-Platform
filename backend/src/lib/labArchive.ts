import YAML from "yaml";

// A lab exports to a single .md file: YAML frontmatter (all structured fields +
// credentialVar _ids so re-import can preserve per-user values) followed by each
// guide page, delimited by an HTML-comment marker carrying the page filename.
// Images are S3 URLs living inside the page markdown, so they round-trip as text.

export type ArchiveCredentialVar = { _id?: string; label: string; type: string };

export interface ArchiveMeta {
  slug: string;
  title: string;
  summary?: string;
  difficulty?: string;
  duration?: string;
  order?: number;
  credentialVars?: ArchiveCredentialVar[];
}

export interface ArchivePage {
  file: string;
  content: string;
}

export class ArchiveError extends Error {}

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const PAGE_FILE_PATTERN = /^\d+-[a-z0-9-]*\.md$/i;
const CREDENTIAL_VAR_TYPES = ["endpoint", "yaml", "text"];
const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
const PAGE_MARKER = /<!-- page: (.+?) -->\r?\n?/g;

export function serializeLab(meta: ArchiveMeta, pages: ArchivePage[]): string {
  const frontmatter = YAML.stringify(meta).trimEnd();
  const body = pages
    .map((p) => `<!-- page: ${p.file} -->\n\n${p.content.trim()}\n`)
    .join("\n");
  return `---\n${frontmatter}\n---\n\n${body}`;
}

export function parseLabArchive(content: string): { meta: ArchiveMeta; pages: ArchivePage[] } {
  const fm = FRONTMATTER.exec(content);
  if (!fm) throw new ArchiveError("missing YAML frontmatter (--- block) at the top of the file");

  let raw: unknown;
  try {
    raw = YAML.parse(fm[1]);
  } catch {
    throw new ArchiveError("frontmatter is not valid YAML");
  }
  const meta = validateMeta(raw);

  const rest = content.slice(fm[0].length);
  const markers: { file: string; end: number; start: number }[] = [];
  PAGE_MARKER.lastIndex = 0;
  for (let m = PAGE_MARKER.exec(rest); m !== null; m = PAGE_MARKER.exec(rest)) {
    markers.push({ file: m[1].trim(), start: m.index, end: PAGE_MARKER.lastIndex });
  }
  if (markers.length === 0) {
    throw new ArchiveError("no pages found (expected `<!-- page: NN-name.md -->` markers)");
  }

  const pages = markers.map((marker, i) => {
    const bodyEnd = i + 1 < markers.length ? markers[i + 1].start : rest.length;
    if (!PAGE_FILE_PATTERN.test(marker.file)) {
      throw new ArchiveError(`invalid page filename: ${marker.file} (expected NN-name.md)`);
    }
    return { file: marker.file, content: `${rest.slice(marker.end, bodyEnd).trim()}\n` };
  });

  return { meta, pages };
}

function validateMeta(raw: unknown): ArchiveMeta {
  if (typeof raw !== "object" || raw === null) throw new ArchiveError("frontmatter must be a mapping");
  const m = raw as Record<string, unknown>;

  if (typeof m.slug !== "string" || !SLUG_PATTERN.test(m.slug)) {
    throw new ArchiveError("slug is required and must be kebab-case");
  }
  if (typeof m.title !== "string" || !m.title.trim()) {
    throw new ArchiveError("title is required");
  }
  if (m.difficulty !== undefined && !DIFFICULTIES.includes(m.difficulty as string)) {
    throw new ArchiveError("difficulty must be Beginner, Intermediate, or Advanced");
  }

  let credentialVars: ArchiveCredentialVar[] | undefined;
  if (m.credentialVars !== undefined) {
    if (!Array.isArray(m.credentialVars)) throw new ArchiveError("credentialVars must be a list");
    credentialVars = m.credentialVars.map((v) => {
      const item = v as Record<string, unknown>;
      if (typeof item?.label !== "string" || !item.label.trim()) {
        throw new ArchiveError("each credential variable needs a label");
      }
      if (!CREDENTIAL_VAR_TYPES.includes(item.type as string)) {
        throw new ArchiveError("each credential variable type must be endpoint, yaml, or text");
      }
      return {
        _id: typeof item._id === "string" ? item._id : undefined,
        label: item.label.trim(),
        type: item.type as string,
      };
    });
  }

  return {
    slug: m.slug,
    title: m.title,
    summary: typeof m.summary === "string" ? m.summary : undefined,
    difficulty: typeof m.difficulty === "string" ? m.difficulty : undefined,
    duration: typeof m.duration === "string" ? m.duration : undefined,
    order: typeof m.order === "number" ? m.order : undefined,
    credentialVars,
  };
}
