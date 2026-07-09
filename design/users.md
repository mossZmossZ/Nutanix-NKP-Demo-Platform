# Dashboard - Online Learning Profile (Community) Design System

## Overview

This design system draft was generated from Figma and suggests a clear accent color for emphasis, a light and spacious background foundation, strong readable text contrast, structured layout patterns. It is intended as a working specification for UI generation, design system documentation, and AI-assisted layout exploration. Review semantic tokens and component rules before using it as a final source of truth.

---

## Colors

- Primary (#702DFF): Main call-to-action buttons, active highlights, and strong emphasis.
- Background (#FFFFFF): Page background and large canvas areas.
- Surface (#F0E5FC): Cards, panels, modals, and elevated containers.
- Text (#202020): Headings, body copy, and primary reading content.
- Border (#D9D9D9): Subtle dividers, input borders, and low-emphasis outlines.
- Muted Text (#9E9E9E): Secondary copy, helper text, and low-emphasis metadata.
- Supporting Color (#3F3F3F): Secondary or contextual color requiring manual semantic review before reuse as a primary accent.
- Supporting Color (#F13E3E): Secondary or contextual color requiring manual semantic review before reuse as a primary accent.
- Supporting Color (#5F5F5F): Secondary or contextual color requiring manual semantic review before reuse as a primary accent.

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

- md: 8px — Buttons, inputs, cards
- lg: 12px — Panels, larger containers
- full: 9999px — Pills, avatars, circular elements

## Elevation

- Gentle, diffused shadows are recommended unless stronger hierarchy is clearly required.
- sm: Buttons, chips, small overlays.
- DEFAULT: Cards, dropdowns, standard floating surfaces.
- md: Elevated cards, side panels, larger floating regions.
- lg: Modals and high-priority overlay containers.

## Components

### Buttons
- **Primary**: #702DFF fill, #FFFFFF text, no border, radius 8px.
- **Primary Hover**: #6529E6 fill, #FFFFFF text, no border.
- **Primary Focus**: #702DFF fill, #FFFFFF text, 3px ring #702DFF1F.
- **Primary Disabled**: #702DFF fill, #FFFFFF text, 40% opacity.

- **Secondary**: transparent fill, #202020 text, 1px #D9D9D9 border, radius 8px.
- **Secondary Hover**: #2020200A fill, #202020 text, 1px #D9D9D9 border.
- **Secondary Focus**: transparent fill, #202020 text, 1px #702DFF border, 3px ring #702DFF1F.
- **Secondary Disabled**: transparent fill, #9E9E9E text, 1px #D9D9D9 border, 40% opacity.

- **Ghost**: transparent fill, #9E9E9E text, no border, radius 8px.
- **Ghost Hover**: #20202006 fill, #202020 text, no border.
- **Ghost Focus**: transparent fill, #202020 text, 3px ring #702DFF1F.
- **Ghost Disabled**: transparent fill, #9E9E9E text, no border, 40% opacity.

### Cards
- **Default**: #F0E5FC fill, 1px #D9D9D9 border, radius 8px.
- **Elevated**: #F0E5FC fill, soft elevation, radius 8px.
- **Large Panel**: #F0E5FC fill, subtle border or elevation, radius 12px.

### Inputs
- **Default**: #F0E5FC fill, 1px #D9D9D9 border, text color #202020, radius 8px.
- **Hover**: #F0E5FC fill, 1px #B2B2B2 border, text color #202020.
- **Focus**: #F0E5FC fill, 1px #702DFF border, 3px ring #702DFF1F.
- **Error**: #F0E5FC fill, 1px #EF4444 border, 3px ring #EF44441F.
- **Disabled**: #F1E7FC fill, 1px #D9D9D9 border, text color #9E9E9E, 40% opacity.

### Layout Containers
- Use #F0E5FC for contained regions.
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

1. **Do** use #702DFF for key interactive emphasis only.
2. **Do** keep page backgrounds consistent with #FFFFFF.
3. **Do** preserve strong readability with #202020 for core reading content.
4. **Do** maintain a compact, repeatable radius and spacing rhythm across repeated UI.
5. **Don't** introduce additional accent colors unless intentionally extending the system.
6. **Don't** use supporting colors as new CTA colors without explicitly defining their role.
7. **Don't** replace Primary with other extracted blues unless explicitly promoted to a semantic token.
8. **Don't** mix unrelated shadow styles or multiple border treatments without purpose.

## Extracted Source Notes

- Auto-generated from Figma on 2026-07-09.
- Source of truth: Figma file.
- File: Dashboard - Online Learning Profile (Community)
- Scope: Selection
- Root nodes scanned: 1
- Auto layout containers found: 46
- This draft combines extracted signals with inferred semantic rules.
- Manual input required: Responsive
