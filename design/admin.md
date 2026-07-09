# Free Admin Dashboard UI Kit (Community) Design System

## Overview

This design system draft was generated from Figma and suggests a clear accent color for emphasis, a light and spacious background foundation, strong readable text contrast, defined typography styles, named visual styles, structured layout patterns. It is intended as a working specification for UI generation, design system documentation, and AI-assisted layout exploration. Review semantic tokens and component rules before using it as a final source of truth.

---

## Colors

- Primary (#B388FE): Main call-to-action buttons, active highlights, and strong emphasis.
- Background (#F4F5F9): Page background and large canvas areas.
- Surface (#FFFFFF): Cards, panels, modals, and elevated containers.
- Text (#3A3541): Headings, body copy, and primary reading content.
- Border (#DBDCDE): Subtle dividers, input borders, and low-emphasis outlines.
- Muted Text (#89868D): Secondary copy, helper text, and low-emphasis metadata.
- Supporting Color (#E5E5E5): Secondary or contextual color requiring manual semantic review before reuse as a primary accent.
- Supporting Color (#6E39CB): Secondary or contextual color requiring manual semantic review before reuse as a primary accent.
- Supporting Color (#9255FD): Secondary or contextual color requiring manual semantic review before reuse as a primary accent.

## Typography

- Headline Font: Lato
- Body Font: Lato

- H1 / Heading: Lato / Bold / 40px
- Body: Lato / Medium / 18px
- Button: Lato / Medium / 16px
- Caption / Small Text: Lato / Regular / 12.640000343322754px

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
- md: 8px — Buttons, inputs, cards
- lg: 8px — Panels, larger containers
- full: 9999px — Pills, avatars, circular elements

## Elevation

- Gentle, diffused shadows are recommended unless stronger hierarchy is clearly required.
- sm: Buttons, chips, small overlays.
- DEFAULT: Cards, dropdowns, standard floating surfaces.
- md: Elevated cards, side panels, larger floating regions.
- lg: Modals and high-priority overlay containers.

## Components

### Buttons
- **Primary**: #B388FE fill, #FFFFFF text, no border, radius 8px.
- **Primary Hover**: #A17AE5 fill, #FFFFFF text, no border.
- **Primary Focus**: #B388FE fill, #FFFFFF text, 3px ring #B388FE1F.
- **Primary Disabled**: #B388FE fill, #FFFFFF text, 40% opacity.

- **Secondary**: transparent fill, #3A3541 text, 1px #DBDCDE border, radius 8px.
- **Secondary Hover**: #3A35410A fill, #3A3541 text, 1px #DBDCDE border.
- **Secondary Focus**: transparent fill, #3A3541 text, 1px #B388FE border, 3px ring #B388FE1F.
- **Secondary Disabled**: transparent fill, #89868D text, 1px #DBDCDE border, 40% opacity.

- **Ghost**: transparent fill, #89868D text, no border, radius 8px.
- **Ghost Hover**: #3A354106 fill, #3A3541 text, no border.
- **Ghost Focus**: transparent fill, #3A3541 text, 3px ring #B388FE1F.
- **Ghost Disabled**: transparent fill, #89868D text, no border, 40% opacity.

### Cards
- **Default**: #FFFFFF fill, 1px #DBDCDE border, radius 8px.
- **Elevated**: #FFFFFF fill, soft elevation, radius 8px.
- **Large Panel**: #FFFFFF fill, subtle border or elevation, radius 8px.

### Inputs
- **Default**: #FFFFFF fill, 1px #DBDCDE border, text color #3A3541, radius 8px.
- **Hover**: #FFFFFF fill, 1px #B4B4B6 border, text color #3A3541.
- **Focus**: #FFFFFF fill, 1px #B388FE border, 3px ring #B388FE1F.
- **Error**: #FFFFFF fill, 1px #EF4444 border, 3px ring #EF44441F.
- **Disabled**: #FFFFFF fill, 1px #DBDCDE border, text color #89868D, 40% opacity.

### Layout Containers
- Use #FFFFFF for contained regions.
- Use #F4F5F9 for page-level background areas.
- Use 8px only for larger panels or special containers.
- Keep radii and spacing consistent across repeated containers.

---

## Layout Principles

- Use generous whitespace between sections and repeated content groups.
- Prefer card-based grouping for related content and modular page regions.
- Maintain spacing rhythm based on the 8px system.
- Keep page background and surface colors visually distinct when depth or grouping is needed.
- Reuse existing auto layout patterns instead of inventing one-off container structures.

## Do's and Don'ts

1. **Do** use #B388FE for key interactive emphasis only.
2. **Do** keep page backgrounds consistent with #F4F5F9.
3. **Do** preserve strong readability with #3A3541 for core reading content.
4. **Do** maintain a compact, repeatable radius and spacing rhythm across repeated UI.
5. **Don't** introduce additional accent colors unless intentionally extending the system.
6. **Don't** use supporting colors as new CTA colors without explicitly defining their role.
7. **Don't** replace Primary with other extracted blues unless explicitly promoted to a semantic token.
8. **Don't** mix unrelated shadow styles or multiple border treatments without purpose.

## Extracted Source Notes

- Auto-generated from Figma on 2026-07-09.
- Source of truth: Figma file.
- File: Free Admin Dashboard UI Kit (Community)
- Scope: Selection
- Root nodes scanned: 1
- Auto layout containers found: 46
- This draft combines extracted signals with inferred semantic rules.
- Manual input required: Responsive
