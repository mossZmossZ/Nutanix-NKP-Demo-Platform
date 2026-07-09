# Deupload - SaaS Cloud Storage Landing Pages (Community) Design System

## Overview

This design system draft was generated from Figma and suggests a clear accent color for emphasis, a light and spacious background foundation, strong readable text contrast, structured layout patterns. It is intended as a working specification for UI generation, design system documentation, and AI-assisted layout exploration. Review semantic tokens and component rules before using it as a final source of truth.

---

## Colors

- Primary (#651FFF): Main call-to-action buttons, active highlights, and strong emphasis.
- Background (#FFFFFF): Page background and large canvas areas.
- Surface (#ECECFE): Cards, panels, modals, and elevated containers.
- Text (#0B0D0E): Headings, body copy, and primary reading content.
- Border (#E2E4E9): Subtle dividers, input borders, and low-emphasis outlines.
- Muted Text (#5C5F6E): Secondary copy, helper text, and low-emphasis metadata.
- Supporting Color (#00E5FF): Secondary or contextual color requiring manual semantic review before reuse as a primary accent.
- Supporting Color (#0E0F10): Secondary or contextual color requiring manual semantic review before reuse as a primary accent.
- Supporting Color (#838696): Secondary or contextual color requiring manual semantic review before reuse as a primary accent.

## Typography

- Headline Font: [Manual input required]
- Body Font: [Manual input required]
- No local text styles found

---

## Spacing

Base unit: **8px**
- xs: 4px — Tight inline gaps
- sm: 8px — Compact component spacing
- md: 16px — Default padding
- lg: 24px — Card padding and section gutters
- xl: 32px — Larger section spacing

## Border Radius

- sm: 4px — Small tags, chips, compact corners
- md: 4px — Buttons, inputs, cards
- lg: 12px — Panels, larger containers

## Elevation

- Gentle, diffused shadows are recommended unless stronger hierarchy is clearly required.
- sm: Buttons, chips, small overlays.
- DEFAULT: Cards, dropdowns, standard floating surfaces.
- md: Elevated cards, side panels, larger floating regions.
- lg: Modals and high-priority overlay containers.

## Components

### Buttons
- **Primary**: #651FFF fill, #FFFFFF text, no border, radius 4px.
- **Primary Hover**: #5B1CE6 fill, #FFFFFF text, no border.
- **Primary Focus**: #651FFF fill, #FFFFFF text, 3px ring #651FFF1F.
- **Primary Disabled**: #651FFF fill, #FFFFFF text, 40% opacity.

- **Secondary**: transparent fill, #0B0D0E text, 1px #E2E4E9 border, radius 4px.
- **Secondary Hover**: #0B0D0E0A fill, #0B0D0E text, 1px #E2E4E9 border.
- **Secondary Focus**: transparent fill, #0B0D0E text, 1px #651FFF border, 3px ring #651FFF1F.
- **Secondary Disabled**: transparent fill, #5C5F6E text, 1px #E2E4E9 border, 40% opacity.

- **Ghost**: transparent fill, #5C5F6E text, no border, radius 4px.
- **Ghost Hover**: #0B0D0E06 fill, #0B0D0E text, no border.
- **Ghost Focus**: transparent fill, #0B0D0E text, 3px ring #651FFF1F.
- **Ghost Disabled**: transparent fill, #5C5F6E text, no border, 40% opacity.

### Cards
- **Default**: #ECECFE fill, 1px #E2E4E9 border, radius 4px.
- **Elevated**: #ECECFE fill, soft elevation, radius 4px.
- **Large Panel**: #ECECFE fill, subtle border or elevation, radius 12px.

### Inputs
- **Default**: #ECECFE fill, 1px #E2E4E9 border, text color #0B0D0E, radius 4px.
- **Hover**: #ECECFE fill, 1px #B9BBBF border, text color #0B0D0E.
- **Focus**: #ECECFE fill, 1px #651FFF border, 3px ring #651FFF1F.
- **Error**: #ECECFE fill, 1px #EF4444 border, 3px ring #EF44441F.
- **Disabled**: #EDEDFE fill, 1px #E2E4E9 border, text color #5C5F6E, 40% opacity.

### Layout Containers
- Use #ECECFE for contained regions.
- Use #FFFFFF for page-level background areas.
- Use 12px only for larger panels or special containers.
- Keep radii and spacing consistent across repeated containers.

---

## Layout Principles

- Use generous whitespace between sections and repeated content groups.
- Prefer card-based grouping for related content and modular page regions.
- Maintain spacing rhythm based on the 8px system.
- Keep page background and surface colors visually distinct when depth or grouping is needed.
- Reuse existing auto layout patterns instead of inventing one-off container structures.

## Do's and Don'ts

1. **Do** use #651FFF for key interactive emphasis only.
2. **Do** keep page backgrounds consistent with #FFFFFF.
3. **Do** preserve strong readability with #0B0D0E for core reading content.
4. **Do** maintain a compact, repeatable radius and spacing rhythm across repeated UI.
5. **Don't** introduce additional accent colors unless intentionally extending the system.
6. **Don't** use supporting colors as new CTA colors without explicitly defining their role.
7. **Don't** replace Primary with other extracted blues unless explicitly promoted to a semantic token.
8. **Don't** mix unrelated shadow styles or multiple border treatments without purpose.

## Extracted Source Notes

- Auto-generated from Figma on 2026-07-09.
- Source of truth: Figma file.
- File: Deupload - SaaS Cloud Storage Landing Pages (Community)
- Scope: Selection
- Root nodes scanned: 1
- Auto layout containers found: 1
- This draft combines extracted signals with inferred semantic rules.
- Manual input required: Responsive
