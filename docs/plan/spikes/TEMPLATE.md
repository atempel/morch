---
id: SP-000
title: Short imperative title
milestone: next     # next | later | maintenance — the ROADMAP.md bucket this belongs to
depends_on: []      # SP-NNN ids; the issue is blocked until each one is closed
estimate: M         # S ≈ half a session · M ≈ one session · L ≈ split it
kind: build         # build | research | decision — only `build` runs unattended
---

# SP-000 — Short imperative title

## Goal

One or two sentences. What is true after this spike that isn't true now.

## Read first

In this order, before writing anything:

- `CLAUDE.md` — the four Core Principles; every step below has to survive them
- `path/to/file.md` — why it matters for this spike

## Build exactly this

Numbered, concrete steps. Name the files to create or edit (`src/…`, `src-tauri/src/…`).

1.
2.

## Out of scope

What a reasonable person might add and must not. Anything discovered here becomes a new spike file.

-

## Acceptance criteria

Each line passes or fails. No opinions.

- [ ]
- [ ]

## Verify

```bash
npx tsc --noEmit
npm run build
cd src-tauri && cargo test
```

## Decision to record

What goes into `DECISIONS.md`, or `none — no decision in this spike`.

## Notes

<!-- Filled by the runner. Surprises, options considered, anything the next spike needs to know. -->

## Outcome

<!-- Filled by the runner: done / blocked / abandoned, and what shipped. -->
