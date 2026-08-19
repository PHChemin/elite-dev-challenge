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

## Frontend folders (`apps/web/src`)

**Pages** — by actor and resource, then screen (`list` / `create` / `detail` / `edit`):

| Folder | Screens |
| ------ | ------- |
| `pages/auth/login/` | Login |
| `pages/exhibitions/{list,detail}/` | Public cartaz (vitrine and film page) |
| `pages/organizer/exhibitions/{list,create,detail}/` | Organizer cartaz |
| `pages/organizer/events/{create,edit}/` | Organizer sessão |

Do not nest organizer screens under `pages/exhibitions/`. Do not mix create and list in the same folder. Mirror `apps/api/src` (`exhibitions` vs `events`).

**Components**

| Folder | Use |
| ------ | --- |
| `components/UI/` | Custom visual primitives (e.g. `PageTitle`, `AsyncSection`, `QtyStepper`) |
| `components/Shared/` | Reused across domains (e.g. `BrandLogo`, `AppLayout`) |
| `pages/<domain>/_*.tsx` | Colocated UI (`pages/auth/_AuthCard.tsx`) |
| `pages/<domain>/_*.ts` | Colocated helpers, form payload, batch expand |
| `api/` | Axios client and request functions per resource (`exhibitions.ts`, `events.ts`, `catalog.ts`) |
| `routes/` | Route table, path builders, `RequireRole` |
| `utils/` | Cross-screen formatting (money, dates) |

Imports: `@/` alias → `src/` (see `vite.config.ts`).

Reads use `useApiResource` with a stable loader (module function or `useCallback`) and render through `AsyncSection`. Writes live in the submit handler: `ApiError.fieldErrors` go to `form.setErrors`, the rest to `notifications`.

Must and Should screens are listed in `docs/visual.md`.
