---
name: mantine-ui
description: >-
  React UI for this project. Use when building pages, forms, seat map, gate, or
  theme. Follows docs/visual.md and Mantine.
---

# Mantine and visual

Source: `docs/visual.md`. Product reference: Sympla (hierarchy, not a clone).

**Roboto** via `theme.fontFamily` (`@fontsource/roboto` or equivalent). Weights 400, 500, 700.

Colors: Black `#161A1D`, Primary `#660708`, Support `#BA181B`, Success `#2D6A4F`, White `#F5F3F4`. Gate “valid” and approved payment use Success.

Use Mantine components (form, modal, notifications, Button, etc.). One primary action per screen.

Gate: active session name always visible. Scan result large.

Seat map: free, held by me, taken, selected. Short legend.

Must and Should screens are listed in `docs/visual.md`.
