# Introduction

Welcome to the **Example Lab** — a reference workshop that exercises every feature
the guide reader supports. Import it, open it, and use the source file as a
copy-paste template when authoring your own labs.

## What this lab demonstrates

- Standard Markdown: headings, lists, links, **bold**, and inline `code`
- Fenced code blocks with syntax highlighting and a hover **copy** button
- YAML manifests rendered with highlighting
- Per-user **credentials** surfaced in the Credentials tab
- Images loaded from an absolute (S3) URL

## How labs are structured

Each lab is a set of ordered pages under `wiki/<slug>/NN-*.md`. Use the section
dropdown at the top to jump between pages, or the **Back / Next** buttons to move
through them in order. Mark a page complete when you're done — your progress is
saved per user.

| Field | Purpose |
| --- | --- |
| `slug` | URL-safe lab id (kebab-case) |
| `title` | Shown in the lab list and header |
| `credentialVars` | Per-user values shown in the Credentials tab |

Continue to the next page to see code and YAML highlighting.
