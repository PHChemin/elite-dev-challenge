---
name: prd-moscow
description: >-
  Aligns code and docs to the PRD. Use when implementing a feature, opening an
  issue, or suggesting scope. Refuse extra Must work and Ticketmaster/GA floor
  in the minimum flow.
---

# PRD scope cut

Source: `docs/PRD.md`.

Must: login (seed with admin, organizer, customer, gate), TMDb, session with seat map, full/half qty before seats, cap (default 6), half price default = half of full, 10 min hold, simulated payment approve and decline, QR, public share link via shareToken, gate with session pick and four outcomes, seed, Jest success/fail per operation, README.

Should: customer registration, Admin creates organizer, simulated first access, organizer manages gate users, search, cancel within 24h, regenerate shareToken, Docker, Vercel, AI-usage section in README.

Could: live seat map, venue entity, Ticketmaster, GA/floor qty, staff assigned per session, real payment sandbox.

Won’t: invoice, peer resale, native app, password recovery, ticket email.

If the request is Could/Won’t while Must is incomplete: refuse and point at the open Must gap.
