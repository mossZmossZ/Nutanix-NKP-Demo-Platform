---
slug: example-lab
title: Example Lab — Feature Showcase
summary: A reference lab that exercises every guide feature. Import it, read it, and copy it as a template for authoring your own labs.
difficulty: Beginner
duration: 15 min
order: 0
credentialVars:
  - label: API endpoint
    type: endpoint
  - label: Kubeconfig
    type: yaml
  - label: Cluster join token
    type: text
---

<!-- page: 01-introduction.md -->

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

<!-- page: 02-yaml-and-commands.md -->

# Code & YAML

Fenced code blocks are syntax-highlighted and get a **copy** button when you hover
over them.

## Shell commands

Run these from your desktop terminal:

```bash
kubectl get nodes -o wide
kubectl apply -f cluster.yaml
```

## A YAML manifest

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: nkp-demo
  labels:
    workshop: example-lab
```

Hover over either block and click the copy icon in the corner to grab the raw
contents — handy for pasting long commands or manifests into your lab machine.

<!-- page: 03-credentials.md -->

# Credentials

This lab defines three **credential variables** in its frontmatter. Each
participant gets their **own** values, filled in by the admin when the lab is
assigned. Open the **Credentials** tab (top of the lab view) to see and copy them:

- **API endpoint** (`endpoint`) — rendered as a clickable link with a copy button
- **Kubeconfig** (`yaml`) — rendered as a highlighted, copyable YAML block
- **Cluster join token** (`text`) — rendered as monospace text with a copy button

Unfilled variables are hidden, so a participant only ever sees the values that
have been set for them.

## Using a credential

Copy your **Cluster join token** from the Credentials tab, then register your node:

```bash
nkp join --token <PASTE_YOUR_TOKEN_HERE>
```

Credential values live on your assignment — revoking the assignment clears them.

<!-- page: 04-images.md -->

# Images

Guide pages can embed images. Because a lab can be exported and imported as a
single file, images are referenced by **absolute URL** — host them anywhere your
browser can reach (a public S3 object works well):

![NKP console](https://placehold.co/800x400/702dff/ffffff?text=NKP+Console)

<!--
  Swap the placeholder above for your own hosted image, e.g. a public S3 object:
  ![NKP console](https://my-bucket.s3.ap-southeast-1.amazonaws.com/labs/example/console.png)

  Local dev only: you may instead drop files in wiki/<slug>/images/ and reference
  them relatively, e.g. ![console](images/console.png). Relative paths are NOT
  carried by export/import — use absolute URLs for portable labs.
-->

## You've reached the end

That's every feature: Markdown, highlighted code and YAML, copy buttons, per-user
credentials, and images. Duplicate this file, edit the frontmatter and pages, and
you have a new lab. Mark this page complete to finish.
