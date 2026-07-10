import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import {
  scaffoldLab,
  listPages,
  readPage,
  writePage,
  removeLab,
} from "../src/lib/wiki";

describe("wiki fs helper", () => {
  let root: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "wiki-test-"));
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("scaffoldLab creates the lab dir and a starter 01-intro.md", () => {
    scaffoldLab("my-lab", root);

    const dir = path.join(root, "my-lab");
    expect(fs.existsSync(dir)).toBe(true);
    expect(fs.existsSync(path.join(dir, "01-intro.md"))).toBe(true);
  });

  it("scaffoldLab is a no-op if the lab dir already exists", () => {
    scaffoldLab("my-lab", root);
    writePage("my-lab", "01-intro.md", "# Custom\n\ncontent", root);

    scaffoldLab("my-lab", root);

    expect(readPage("my-lab", "01-intro.md", root)).toBe("# Custom\n\ncontent");
  });

  it("listPages returns ordered pages with titles derived from headings", () => {
    scaffoldLab("my-lab", root);
    writePage("my-lab", "02-setup.md", "# Setup Steps\n\nDo this.", root);
    writePage("my-lab", "10-cleanup.md", "no heading here", root);

    const pages = listPages("my-lab", root);

    expect(pages.map((p) => p.file)).toEqual(["01-intro.md", "02-setup.md", "10-cleanup.md"]);
    expect(pages[0].order).toBe(1);
    expect(pages[1].title).toBe("Setup Steps");
    // Fallback to filename when no `# ` heading is present.
    expect(pages[2].title).toBe("10-cleanup.md");
  });

  it("readPage returns page content", () => {
    scaffoldLab("my-lab", root);
    expect(readPage("my-lab", "01-intro.md", root)).toContain("# Introduction");
  });

  it("writePage persists content that readPage then returns", () => {
    scaffoldLab("my-lab", root);
    writePage("my-lab", "03-more.md", "# More\n\nextra content", root);
    expect(readPage("my-lab", "03-more.md", root)).toBe("# More\n\nextra content");
  });

  it("rejects path traversal in readPage/writePage", () => {
    scaffoldLab("my-lab", root);
    expect(() => readPage("my-lab", "../secrets.md", root)).toThrow();
    expect(() => readPage("my-lab", "sub/dir.md", root)).toThrow();
    expect(() => writePage("my-lab", "../../evil.md", "x", root)).toThrow();
  });

  it("removeLab recursively deletes the lab dir", () => {
    scaffoldLab("my-lab", root);
    expect(fs.existsSync(path.join(root, "my-lab"))).toBe(true);

    removeLab("my-lab", root);

    expect(fs.existsSync(path.join(root, "my-lab"))).toBe(false);
  });
});
