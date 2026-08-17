---
name: reservation-integrity
description: >-
  Holds, payment, and gate. Use when touching seats, holds, orders, tickets, or
  scans. Prevents double sale and forged QR codes.
---

# Seat and ticket integrity

Source: `docs/PRD.md` and `docs/SDD.md`.

Full and half quantities on the session detail, then the map. Sum ≤ cap (default 6). 10-minute hold on continue. Success issues one Ticket per seat (`kind` full|half). Decline, cancel, or expiry frees seats.

DB uniqueness. Transaction on hold and on confirm. Second request for the same seat: conflict.

Cap and prices enforced in the API. Omitted half price on the session = half of full. Gate validates the QR, not the ticket category.

Ticket: `code` in the QR; `shareToken` on the public GET. Scan marks used with `validatedByUserId` in the same transaction. Outcomes: valid, invalid, already_used, wrong_event (ticket.eventId ≠ gate session).

**Implementation:** hold and uniqueness in Postgres. Release expired holds on checkout or a simple job. Role authorization in Nest.
