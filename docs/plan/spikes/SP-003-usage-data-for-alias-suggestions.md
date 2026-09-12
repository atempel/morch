---
id: SP-003
title: Usage data to inform alias suggestions
milestone: next
depends_on: []
estimate: M
kind: decision
---

# SP-003 — Usage data to inform alias suggestions

## Goal

A logged `DECISIONS.md` entry exists that settles whether Morch collects any usage data at all to inform alias suggestions, and if so what data, so a later `build` spike has a concrete, bounded scope instead of an open research question.

## Read first

In this order, before writing anything:

- `CLAUDE.md` — Core Principle 2 (AI must be described as a tool, never a creative entity) directly constrains how any "suggestion" feature is framed — it must not read as the AI deciding names on the user's behalf; Core Principle 1 (no forced structure) bears on whether declining suggestions has to stay a real, undegraded option
- `docs/ROADMAP.md` — "Next" section: "Usage analytics to inform naming/aliasing suggestions (SPEC.md §8 asks whether the app should suggest names)" and the "Open Question Carried Forward" note that SPEC.md §8's questions are "explicitly meant to be answered by usage data, not upfront design — don't try to resolve these before shipping Phase One"
- `docs/SPEC.md` §3.3 — the worked example this feature would eventually serve: "implement epistemically calibrated response patterns with uncertainty signals" → alias "uncertain-ai-fix" — the concrete input/output shape a suggestion engine would need to produce
- `docs/SPEC.md` §8 — "Should the app suggest instruction names, or should users always manually assign them?" is the literal research question this decision addresses; note it sits alongside three other open questions in the same section that are explicitly out of scope here
- `docs/FILE_STRUCTURE.md` §6.3 — `instructionAliases` in `.morch/config.json` is the only aliasing data that currently exists anywhere in the app; it is local, per-workspace, and unstructured beyond a flat `id → name` map
- `src-tauri/src/instructions.rs` — `set_alias` / `set_instruction_alias`, the only place alias data is written today; there is no event log, no timestamp, and no record of alias edits, overwrites, or removals over time
- `src/types.ts` — `MorchConfig.instructionAliases: Record<string, string>` — confirms there is no existing field anywhere to append usage events to without a schema change
- `DECISIONS.md`, 2026-07-09 "Desktop app format" and "Framework locked in: Tauri v2 + SQLite" — the desktop-only, direct-filesystem-access architecture with no server component; any usage-data proposal has to fit inside this already-decided shape, not introduce a new one

## Build exactly this

Numbered, concrete steps. This is a `decision` brief: it prepares a decision for a person to make, it does not implement one.

1. Search this repo (`docs/TECHNICAL_ARCHITECTURE.md`, `DECISIONS.md`) for any existing statement about telemetry, analytics, or data leaving the workspace directory, and record in this file's Notes what you find — confirm there is currently no analytics or telemetry mechanism of any kind, local or remote.
2. List, in this file's Notes, the concrete signals available to Morch without adding any new instrumentation: alias edits and removals (`set_alias`), toggle frequency (`toggle`/`disable`/`enable` in `src-tauri/src/instructions.rs`), instruction content (`ParsedInstruction.content`), and file-level stats already computed for the wizard (`ScannedFile.lineCount`/`wordCount` in `src/types.ts`). Note which of SPEC.md §8's questions each signal could actually answer (e.g. toggle frequency directly answers "how often do users toggle vs. delete").
3. Draft at least three options in this file's Notes, each with a cost and a downstream consequence: (a) local-only usage log — an append-only file under `.morch/` (e.g. `.morch/usage.jsonl`) recording toggle and alias events with no content beyond instruction ids, read only by Morch itself, never transmitted — cheapest to build, stays within the existing local-first, no-backend model, but produces a growing file with no defined retention or query plan; (b) derive suggestions from content alone with no event log — e.g. keyword extraction from `content` to propose a short alias at the moment a user assigns one, no usage history needed at all — sidesteps the whole "collect data" question but doesn't answer SPEC.md §8's "how do users naturally structure workspaces" question, which needs data across sessions; (c) do nothing yet — explicitly re-defer per `docs/ROADMAP.md`'s own framing that this needs to be "answered by usage data, not upfront design," and revisit only once enough workspaces exist to make either (a) or (b) worth building.
4. For each option, state explicitly whether it introduces a backend, network call, or any data leaving the user's machine — flag immediately if any option would. Morch's own architecture is already decided as desktop-only with direct filesystem access and no server component (`DECISIONS.md`, 2026-07-09 "Desktop app format"), and `.morch/config.json` is the sole persistence layer for Phase One (`DECISIONS.md`, 2026-07-10 "Phase One persistence"), so a network-dependent option is a much bigger scope change than "add a usage log" and must be named as such, not smuggled in as a detail.
5. Write the exact question for `DECISIONS.md` into the "Decision to record" section below.
6. Comment on the tracking issue with the options and trade-offs from Notes, add the `needs-decision` label, and stop.

Do not write a usage log, do not add fields to `MorchConfig` or `Instruction`, and do not implement any suggestion logic.

## Out of scope

- Writing any event-logging code in `src-tauri/src/instructions.rs` or a new module.
- Adding a `.morch/usage.jsonl` file or any new file under `.morch/`.
- A keyword-extraction or suggestion algorithm of any kind.
- Any telemetry that leaves the user's machine — this would itself require a separate, explicitly-flagged decision given `CLAUDE.md`'s local-first framing.
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

Should Morch collect any usage data to inform alias suggestions, and if so: what signals (alias edits, toggle events, instruction content) get recorded, where do they live (e.g. a local `.morch/` log versus no persistence at all), and does any of it ever leave the user's machine? Record the chosen option — including an explicit "no" if that's the answer — as a new `DECISIONS.md` entry before any `build` spike adds logging or suggestion code.

## Notes

<!-- Filled by the runner. Surprises, options considered, anything the next spike needs to know. -->

## Outcome

<!-- Filled by the runner: done / blocked / abandoned, and what shipped. -->
