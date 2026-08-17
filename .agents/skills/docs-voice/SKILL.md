---
name: docs-voice
description: >-
  Writes or edits repo markdown (PRD, SDD, visual, README, issues, ai-process).
  Use whenever generating documentation or text for the evaluator.
---

# Docs voice

Readers: the evaluator and the model. One paragraph serves both.

## What to use where

- PRD, visual, issues, README: voice v3. Short sentences. Product only. PRD shape: vision, glossary, actors, MoSCoW user stories with acceptance, business rules, out of scope, NFRs (see `docs/PRD.md`).
- SDD and code skills: voice v4. Same clarity plus **Instruction for the AI** blockquotes and **Implementation** notes where the UI could lie (see `docs/SDD.md`).
- “The system shall” / RF-01: only with explicit author approval.
- Voice v1: never.

## Forbidden

Chat leftovers: “after we discussed”, “we settled on”, “in my view”, “as we agreed”.

Prompt negation: “this is not code”, “this section is not implementation”.

Filler: “it is important to note”, “worth mentioning”, “basically”, “in terms of”.

Internal debate labels (`1B`, `2B`) in evaluator-facing text. Must/Should/Could only as priorities defined in the PRD.

Do not list discarded alternatives mid-rule (fonts, stacks, libs). State what applies. Out-of-scope items go under **Out of scope** / **Out of Must design** as a short list.

## Required

Direct Portuguese in product docs (PRD, SDD, visual, README, issues for the evaluator). One idea per sentence. Technical terms when the rule is technical.

Skills under `.agents/skills/` are written in English.

## Canonical PRD sample (v3)

Each event has a per-purchase ticket cap. Default is 6. The organizer changes that cap when creating or editing the event (e.g. 10 for a regular screening, 6 for a premiere).

When moving to payment, selected seats are held for 10 minutes. Approved payment confirms the sale. Decline, cancel, or timeout returns seats to free.

Two customers do not buy the same seat. Purchase cap and room capacity are different rules.

## Canonical SDD sample (v4)

Same text as above, plus:

**Implementation:** enforce cap and hold on the server, not only in the UI. The hold rule applies with or without a live seat map.
