---
id: SP-002
title: Instruction type metadata: directive versus context
milestone: next
depends_on: []
estimate: S
kind: decision
---

# SP-002 — Instruction type metadata: directive versus context

## Goal

A logged `DECISIONS.md` entry exists that settles whether Phase Two adds a `type` field (e.g. `directive` vs. `context`) to the `Instruction` schema, so a later `build` spike has a schema and a migration path instead of an open question.

## Read first

In this order, before writing anything:

- `CLAUDE.md` — Core Principle 1 (no forced structure: a `type` field must not become a requirement the user has to satisfy to use the app) and Core Principle 2 (AI as tool, never a creative entity — any "directive vs. context" language in the UI must stay descriptive, not imply the AI is choosing what matters)
- `docs/FILE_STRUCTURE.md` §6.3/§6.4 plus `DECISIONS.md`'s own convention of logging schema-affecting choices (see the 2026-07-10 `n0`/`n6` entry for the shape of a narrowly-scoped schema-adjacent decision) — this project's own precedent for treating a schema/token change as something that gets a dated entry, not a silent edit
- `docs/ROADMAP.md` — "Next" section: "Instruction `type` metadata (directive vs. context) — informed by the 'Project Purpose' prose-paragraph finding"
- `docs/PARSING_VALIDATION.md` finding 2 — the exact origin case: CLAUDE.md's "Project Purpose" paragraph parses as one syntactically valid instruction that is semantically background context, not an actionable rule; the finding explicitly floats a `type` field as "worth adding, but isn't required to ship Phase One"
- `docs/SPEC.md` §8 — "What metadata is most useful for instruction discovery and organization?" is the research question this decision would resolve, at least partially
- `docs/FILE_STRUCTURE.md` §6.4 — the current `Instruction` fields (`id`, `file`, `lineNumber`, `content`, `alias`, `enabled`, plus the not-yet-populated `createdAt`/`disabledAt`) that a `type` field would extend
- `src-tauri/src/instructions.rs` — the `Instruction` struct's doc comment explaining why `createdAt`/`disabledAt` were left out of Phase One despite being in the FILE_STRUCTURE.md schema; a `type` field faces the same "populate with what, exactly, and when" question
- `src/types.ts` — the `Instruction` and `ParsedInstruction` interfaces that mirror the Rust structs 1:1; any new field has to land in both

## Build exactly this

Numbered, concrete steps. This is a `decision` brief: it prepares a decision for a person to make, it does not implement one.

1. Confirm the "Project Purpose" finding still holds by reading `CLAUDE.md`'s current "Project Purpose" section and checking it still parses as a single non-header, non-blank line under `parse_markdown` (`src-tauri/src/parser.rs`) — note the line number and content in this file's Notes.
2. Identify where `type` would have to be populated: `parse_markdown` (parse-time, from the source file, e.g. a heuristic distinguishing prose paragraphs from bulleted/numbered lines) versus `InstructionManager::load` (post-processing, e.g. relying on user input) versus never — a UI-only distinction fed by the alias workflow (`set_instruction_alias` in `src-tauri/src/instructions.rs`) instead of a stored field.
3. Draft at least three options in this file's Notes, each with a cost and a downstream consequence: (a) auto-classify at parse time by a heuristic (e.g. "line matches a list-item pattern" = directive, else = context) — cheap to add, but risks silently mislabeling content, and any heuristic bug is now baked into stored data; (b) leave classification manual, a user-set field alongside `alias` — respects Core Principle 1 (nothing forced) but adds a UI affordance and a decision burden for every instruction, likely low completion rate; (c) do not add a stored field at all — treat "directive vs. context" as a filter/tag computed on the fly in the dashboard, never persisted, avoiding a schema and migration entirely.
4. For each option, state what changes it would require in `docs/FILE_STRUCTURE.md` §6.4, `src-tauri/src/instructions.rs`'s `Instruction` struct, `src/types.ts`'s `Instruction`/`ParsedInstruction` interfaces, and whether existing `.morch/config.json` files would need a migration (per `DECISIONS.md`'s 2026-07-10 JSON-only persistence decision, migrations are a real cost since there is no database to version).
5. Write the exact question for `DECISIONS.md` into the "Decision to record" section below.
6. Comment on the tracking issue with the options and trade-offs from Notes, add the `needs-decision` label, and stop.

Do not add a `type` field to any struct or interface, and do not touch `parse_markdown`.

## Out of scope

- Adding `type`, `kind`, or any similarly-named field to `Instruction` in `src-tauri/src/instructions.rs` or `src/types.ts`.
- Writing a classification heuristic in `src-tauri/src/parser.rs`.
- Any dashboard UI for filtering or displaying instruction type.
- A `.morch/config.json` migration script.
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

Should Morch add a stored `type` field (e.g. `directive` | `context`) to the `Instruction` schema, and if so, is it assigned by a parse-time heuristic, by explicit user input, or not stored at all (computed only in the UI)? Record the chosen option as a new `DECISIONS.md` entry, including whether it requires a `.morch/config.json` migration, before any `build` spike edits `src-tauri/src/instructions.rs` or `src/types.ts`.

## Notes

<!-- Filled by the runner. Surprises, options considered, anything the next spike needs to know. -->

## Outcome

<!-- Filled by the runner: done / blocked / abandoned, and what shipped. -->
