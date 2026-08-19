---
name: tdd-api
description: >-
  Nest API implementation. Use when opening an issue, writing a test, or coding a
  controller, service, or module. Issue tests first; implementation second.
---

# Tests first

Source: `docs/github-issues.md` (cases on the issue) and `docs/SDD.md`.

Order for every API module:

1. Read the issue: feature, flows, requirements, success and fail cases.
2. Write the tests (routes and services named in the issue).
3. Run them: they must fail.
4. Implement Prisma, service, controller until tests pass.
5. Do not close the issue with a red suite.

Each operation has at least one success case (valid data) and one fail case (invalid data, wrong role, conflict, or business rule). Reservations, payment, and gate include seat races and second scan.

Test stack: Nest Jest (+ Supertest as needed). No browser E2E in Must.

Clock in tests: `toDate` / `nowUtc` / `addMs` from `common/dates.ts`. Do not construct `new Date(...)` in specs.
