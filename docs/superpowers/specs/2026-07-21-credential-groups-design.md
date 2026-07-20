# Credential Groups — Design

**Date:** 2026-07-21
**Status:** Approved, ready for implementation

## Problem

Lab credentials render as one flat list, both in the admin console
(`LabCredentialsPage.tsx`) and the participant lab view (`CredentialsPanel.tsx`).
As labs accumulate more credentials, participants want them **organised into named
groups** (e.g. "Cluster access", "Registry", "Dashboards") instead of one long list.

## Requirement

- Admins can create/rename/delete **named groups** on a lab.
- Admins can assign each existing credential to **at most one group**.
- Credentials with no group still show, under an **"Other"** section.
- The participant lab view renders credentials **grouped** under their group headings.
- **No per-user credential value is ever lost** by any group operation.

## Decisions (from brainstorming)

- "Label" = the credential variable itself. No new tagging concept.
- A credential belongs to **at most one group**; ungrouped is allowed.
- Groups are **per-lab**.
- Admin assignment UX = **a Group dropdown per credential** (Approach A) — lightweight,
  no drag-and-drop dependency, moves credentials between groups without remove+re-add.

## Data model

Groups live on the `Lab` document, mirroring the existing `credentialVars` subdoc
pattern so `_id`s stay stable and per-user values (keyed by var `_id` on the
`Assignment`) survive.

```
Lab {
  credentialGroups: [{ _id, name, order }]              // NEW subdoc array
  credentialVars:   [{ _id, label, type, groupId? }]    // groupId ADDED (optional → a group _id)
}
```

- `groupId` optional. `null`/absent → ungrouped ("Other").
- Deleting a group **clears `groupId` on its vars** (they fall back to "Other"); it never
  deletes credentials or values.
- `Assignment.credentialValues` is untouched — still keyed by var `_id`.
- **No migration:** existing labs have zero groups → everything ungrouped → renders exactly
  as today.

## Backend API (all under `adminLabsRouter`, RBAC already applied)

- `POST   /admin/labs/:slug/credential-groups` — `{ name }` → returns groups (next `order`).
- `PATCH  /admin/labs/:slug/credential-groups/:groupId` — `{ name?, order? }` → rename / reorder.
- `DELETE /admin/labs/:slug/credential-groups/:groupId` → clears `groupId` on its vars, returns groups.
- `PATCH  /admin/labs/:slug/credential-vars/:varId` — `{ groupId: string | null }` → move a
  credential to a group **without** remove+re-add (preserves per-user values). Validates that
  `groupId` refers to a group on the same lab.

`GET /admin/labs` now includes `credentialGroups` and each var's `groupId`.

**Lab-view output** (`GET /me/labs/:slug`): add an ordered `groups: [{ id, name }]` array;
each `credentials[]` item carries its `groupId`. Backward-compatible — the existing
`credentials` shape only *gains* a field.

## Frontend

**Admin (`LabCredentialsPage.tsx`)** — Variables card:
- A **Groups** strip: existing groups as editable chips (inline rename, hover-trash delete,
  matching the existing var-delete idiom) + a "＋ New group" inline input.
- Each credential row gains a compact **Group** `Select` (options: each group + "No group");
  changing it calls the var PATCH.
- Credentials are visually **clustered by group** (group name as a small subheading) so the
  admin previews the participant's structure.

**Lab view (`CredentialsPanel.tsx`)**:
- Render credentials under group subheadings in group order; ungrouped go under **"Other"** last.
- If a lab has **no groups at all**, render exactly as today (flat list, no "Other" heading).
- Copy buttons / endpoint·yaml·text rendering unchanged.

All styling from `design-v2.md` tokens (no inline hex); reuse `Card`, `Select`, `Badge`,
hover-trash idioms.

## Testing & success criteria

- **Backend:** group CRUD happy paths; deleting a group clears `groupId` but keeps vars +
  values; moving a var preserves its `credentialValues`; moving to a foreign group is rejected.
- **Frontend:** admin creates a group, assigns a credential, sees it cluster; lab view renders
  grouped with "Other" for ungrouped; a lab with no groups looks identical to today.
- **Success =** admin groups credentials → participant sees them grouped → **no per-user value
  is ever lost** by any group operation.

## Out of scope

- Drag-and-drop reordering of credentials within/between groups.
- Per-credential multi-group / tagging.
- Reordering individual credentials inside a group (they keep array order for now).
