---
name: sdd-constraints
description: >-
  Enforce the SDD when generating code or folders. Use on scaffold, new routes,
  backend library choice, or deploy. Project SDD overrides generic Nest/Prisma tips.
---

# SDD constraints

Source: `docs/SDD.md`.

- `apps/web`: Vite, React, Mantine, Roboto.
- `apps/api`: NestJS, Express.
- Business rules live in the API.
- Postgres. **Prisma only** (not TypeORM, not Mongoose). TMDb only on the API. ER diagram in `docs/SDD.md`; new field = migration + update the mermaid.
- JWT Bearer with `role` (`admin` | `organizer` | `customer` | `gate`). Nest guards.
- Must modules: auth, catalog, events, reservations, tickets, gate.
- Front on Vercel (Should). API on a long-running host.
- API issues: Jest tests (success and fail) before controller/service. Skill `tdd-api`.

## Override vs community skills

- `nestjs-expert` may mention TypeORM/Mongoose. **Ignore that for this repo** — use Prisma + `prisma-expert`.
- Prefer Express adapter already chosen in the SDD.
- Anything listed under **Out of Must design** in the SDD stays out of the minimum flow.
