---
id: SP-001
title: Multi-line instruction blocks as one toggleable unit
milestone: next
depends_on: []
estimate: M
kind: decision
---

# SP-001 — Multi-line instruction blocks as one toggleable unit

## Goal

A logged `DECISIONS.md` entry exists that picks a direction (or explicitly defers again, with a reason) for grouping consecutive lines — like a `**Decision**`/`**Rationale**`/`**Status**` block — into one toggleable instruction, so a later `build` spike can implement it without re-litigating the trade-offs.

## Read first

In this order, before writing anything:

- `CLAUDE.md` — Core Principle 1 (no forced structure) bears directly on any block-boundary heuristic; Core Principle 2 (AI as tool, not agent) constrains how this brief and any option describe detection logic
- `docs/ROADMAP.md` — "Next — Immediately Post-Phase-One" names this item and its origin: "flagged as a real gap in `PARSING_VALIDATION.md`, deferred because it needs a block-boundary heuristic that's easy to get wrong"
- `docs/PARSING_VALIDATION.md` finding 4 — the concrete failure case (DECISIONS.md's Decision/Rationale/Status lines), and its Phase One workaround: let the onboarding wizard exclude log-style files rather than guess block boundaries
- `docs/SPEC.md` §3.2 — "the app treats each line in a markdown file as a potential instruction unit," the assumption this decision would partially revise
- `docs/SPEC.md` §8 — "what metadata is most useful for instruction discovery and organization?" is the open research question this decision partly answers
- `src-tauri/src/parser.rs` — `parse_markdown` and its test `does_not_attempt_block_grouping_on_log_style_content`, the exact current behavior (three independent lines) that any option changes
- `docs/FILE_STRUCTURE.md` §6.4 — the `Instruction` schema (`id`, `lineNumber`, `content`, …) that a block-grouping design would have to extend or reinterpret
- `DECISIONS.md`, 2026-07-09 "Flexible, line-based instruction parsing" and 2026-07-10 "Restoring a disabled instruction does not reinsert it at its original line position" — both decisions a block-grouping design must stay compatible with

## Build exactly this

Numbered, concrete steps. This is a `decision` brief: it prepares a decision for a person to make, it does not implement one.

1. Re-read `docs/PARSING_VALIDATION.md` finding 4 and confirm, by inspecting `DECISIONS.md`'s actual entries (e.g. the 2026-07-10 "Phase One persistence" entry), that the `**Label**: text` line shape is representative — note any entries that don't fit the pattern (e.g. multi-paragraph `**Rationale**` text, or entries without a `**Status**` line).
2. Run `cd src-tauri && cargo test parser::` and record in this file's Notes what `parse_markdown` currently returns for a DECISIONS.md-shaped input (already asserted by `does_not_attempt_block_grouping_on_log_style_content`), so the brief cites actual behavior, not a guess.
3. Draft at least three options in this file's Notes for how (or whether) to group multi-line blocks, each with: what it costs to build, what breaks or gets harder later, and which files it would eventually touch (`src-tauri/src/parser.rs`, `src/types.ts`, `docs/FILE_STRUCTURE.md` §6.4). At minimum consider: (a) a fixed heuristic — blank-line-delimited paragraphs, or consecutive `**Label**:` lines, become one block; (b) an explicit opt-in marker the user adds to their own files (tension with Core Principle 1's "no forced structure"); (c) keep per-line toggling forever and instead solve this at the wizard/UX layer per `PARSING_VALIDATION.md`'s own Phase One recommendation (flag log-style files, never auto-group).
4. For each option, state what happens to an instruction's `id` (`line_{n}_{file}`, per `parser.rs`) once a block spans multiple lines — this is the concrete mechanism question, not just a UX one — and how it interacts with the 2026-07-10 decision that disabled/restored instructions don't preserve original position.
5. Write the exact yes/no (or "which option") question for `DECISIONS.md` into this file's "Decision to record" section below.
6. Comment on the tracking issue with the options and trade-offs from Notes, add the `needs-decision` label, and stop.

Do not implement a heuristic, do not change `parser.rs`, and do not open a pull request against `src/` or `src-tauri/`.

## Out of scope

- Writing or modifying any block-detection code in `src-tauri/src/parser.rs`.
- Adding a `blockId` or similar field to `Instruction` in `src-tauri/src/instructions.rs` or `src/types.ts`.
- Changing `docs/SPEC.md` §3.2's line-based parsing description.
- Redesigning the onboarding wizard's file-flagging UI (that's the existing Phase One mitigation and is unaffected by this decision either way).
- Picking the option — that's a person's call, logged in `DECISIONS.md`, not this spike's.

## Acceptance criteria

- [ ] The tracking issue carries the `needs-decision` label.
- [ ] At least three options are written into this file's Notes, each with a stated cost and a stated downstream consequence.
- [ ] No file under `src/` or `src-tauri/` is changed.
- [ ] `docs/SPEC.md` is unchanged.
- [ ] The "Decision to record" section below states a single, answerable question in `DECISIONS.md`'s Decision/Rationale/Status style.

## Verify

```bash
git diff --stat origin/main -- src src-tauri docs/SPEC.md   # expect empty
node scripts/validate-spikes.mjs
```

## Decision to record

Should Morch group consecutive markdown lines into a single toggleable instruction block, and if so, by which rule — (a) a fixed heuristic parser change, (b) a user-authored opt-in marker, or (c) no grouping at all, staying with the Phase One wizard-level mitigation in `PARSING_VALIDATION.md` indefinitely? Record the chosen option, or explicit continued deferral, as a new `DECISIONS.md` entry before any `build` spike touches `parse_markdown`.

## Notes

<!-- Filled by the runner. Surprises, options considered, anything the next spike needs to know. -->

## Outcome

<!-- Filled by the runner: done / blocked / abandoned, and what shipped. -->
