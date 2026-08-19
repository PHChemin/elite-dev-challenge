---
description: Use dayjs (via common/dates) for all API date work
globs: apps/api/**/*.ts
alwaysApply: false
---

# Dates: dayjs only

Do not use `new Date()`, `Date.now()`, or `getTime()` arithmetic in `apps/api`.

Use `apps/api/src/common/dates.ts`: `toDate`, `nowUtc`, `toIsoString`, `addMs`, `isAfter`.

Prisma `DateTime` still receives a `Date`. Build it with those helpers, not with the native constructor.

```ts
// BAD
const now = new Date();
const expiresAt = new Date(Date.now() + HOLD_TTL_MS);

// GOOD
const now = nowUtc();
const expiresAt = addMs(now, HOLD_TTL_MS);
```
