# Implementation Plan — Morch

A handoff brief for the coding session (Claude Code). Read this file first, then the four docs listed in **Read first** below, before writing any code.

## Read first, in this order

1. `CLAUDE.md` — Core Principles (non-negotiable) and scope guardrails.
2. `docs/SPEC.md` — source of truth for feature scope.
3. `DECISIONS.md` — every architectural choice and why, including the two new entries this plan adds (SQLite scope, `.morch/` naming).
4. `DESIGN.md` — visual identity spec (colors, typography, components), validated via an interactive prototype. Build the UI directly against this file's token names, not ad-hoc values.
5. `docs/FILE_STRUCTURE.md` and `docs/PARSING_VALIDATION.md` — the on-disk schema and the real parsing edge cases already found by testing against this project's own files.
6. `docs/ROADMAP.md` — the sequenced "Now" list this plan expands into concrete milestones.

## Two architecture questions resolved (see DECISIONS.md for the logged entries)

**1. SQLite vs JSON config — resolved: JSON only for Phase One.**
`docs/FILE_STRUCTURE.md` §6.3 already fully specifies what Phase One needs to persist (`managedFiles`, `instructionAliases`, `disabledArchivePath`) and that data is small, low-write-frequency, and benefits from being human-inspectable (a user should be able to open `config.json` and understand exactly what Morch is tracking — this matches the "AI as tool, never opaque" spirit of Core Principle #2). Introducing SQLite now adds migration/schema-versioning overhead with no Phase One feature that needs it (no instruction history, no versioning, no large datasets). Recommendation: **skip SQLite entirely for Phase One.** `.morch/config.json` is the only persistence layer. Revisit SQLite for Phase Two if/when instruction history or versioning is scoped in — that's the point where a JSON file stops being the right tool.

**2. `.orchestrator/` vs `.morch/` — resolved: rename to `.morch/`.**
The disabled archive already carries the `.morch-` branding convention (`.morch-disabled/`). Since zero code and zero users exist yet, there's no migration cost to aligning the app's own config directory now rather than after shipping. Recommendation: **`.orchestrator/` becomes `.morch/`** throughout — update `docs/FILE_STRUCTURE.md`'s example tree accordingly when scaffolding.

Both are recommendations, not silent decisions — flag to Alexandre if either should be reconsidered before locking in DECISIONS.md.

## Repo setup (GitHub)

Claude in this session cannot create the GitHub repo directly (no authenticated GitHub connector in this workspace). When Alexandre creates it:

- `.gitignore`: standard Rust (`/target`), Node (`node_modules/`, `dist/`), and Tauri (`src-tauri/target/`) ignores. Also ignore any local `.morch/` test workspaces used during development, but **do not** gitignore `.morch/config.json` schema examples if they live under `docs/` or `fixtures/` — those are documentation, not runtime state.
- License: not yet decided — surface to Alexandre as an open question rather than defaulting to one.
- README: the existing `README.md` in this project folder is written as a spec-project readme (points at `docs/`). Once code exists, it should gain a short "Development" section (how to run `tauri dev`, how to run tests) without losing the current "what this is" framing.
- Branch strategy: no strong opinion needed for a solo-maintainer Phase One; a single `main` branch with direct commits is fine until collaborators are added.

## Milestones (expands `docs/ROADMAP.md`'s "Now" list)

Each milestone below maps 1:1 to a ROADMAP.md item. "Done when" is the acceptance bar — don't move to the next milestone until it's met.

**M1 — Scaffold**
Tauri v2 + React + TypeScript project (`npm create tauri-app`, React + TS template). No SQLite dependency (see resolution above). Set up `.morch/config.json` read/write with a minimal typed schema matching FILE_STRUCTURE.md §6.3.
*Done when:* app launches to a blank window, can read/write a `.morch/config.json` fixture on disk.

**M2 — File Scanner**
Walk a given workspace directory, detect candidate files (CLAUDE.md, AGENTS.md, SKILLS/*, etc. per SPEC.md §3.1). Read-only — no writes yet, per the onboarding "scanning is read-only" promise in DESIGN.md.
*Done when:* scanning this very project folder correctly lists CLAUDE.md, AGENTS.md, DECISIONS.md, and the SKILLS-equivalent files it contains, with correct flagged/unflagged classification for log-style files (DECISIONS.md should flag).

**M3 — Onboarding wizard UI**
Build against DESIGN.md's Onboarding section: step indicator, one-line description per detected file, the read-only/archive-not-delete reassurance stated once near the top, checklist selection, manual add option.
*Done when:* a first-time run against a real workspace produces a config matching what the user selected, and flagged files can still be selected (no dead-end blocking).

**M4 — Markdown Parser**
Line-based instruction extraction per PARSING_VALIDATION.md's findings: skip headers/blank lines, preserve original line numbers, treat each remaining line as a candidate instruction. Do not attempt block-grouping (deferred to Phase Two per ROADMAP.md "Next").
*Done when:* parsing this project's own CLAUDE.md and AGENTS.md produces instruction lists matching PARSING_VALIDATION.md's documented findings.

**M5 — Disabled Archive Manager**
`.morch-disabled/` mirror structure; move-on-disable, restore-on-enable. Must guarantee the AI-facing file no longer contains the line after disable (Core Principle #3 is the actual product promise being tested here).
*Done when:* disabling an instruction removes it from the active file, adds it to the mirrored archive path, and re-enabling round-trips with zero data loss (byte-for-byte line content preserved).

**M6 — File Watcher**
Debounced, hash-based change detection (TECHNICAL_ARCHITECTURE.md §5.5) that distinguishes the app's own writes from external edits (e.g. Claude Code editing CLAUDE.md live) to avoid sync loops.
*Done when:* editing a managed file externally while the app is open reflects in the UI within the debounce window, and the app's own toggle-driven writes do not trigger a spurious external-change event.

**M7 — Instruction Manager**
In-memory model wiring parser output + archive state + aliasing into one source of truth the UI reads from.
*Done when:* toggling state, alias assignment, and enabled/total counts are all correct and consistent across List and Board views without a full re-scan.

**M8 — Dashboard UI**
Build directly against DESIGN.md: List view (sidebar + single-file pane), Board view (Kanban columns), light/dark toggle, both drawers (disabled archive + ignored files, kept visually distinct per DESIGN.md's "two archives, two different jobs"), toggle switches, alias editing. The `morch_prototype_branded` interactive prototype built this session is the reference for interaction details, not a component to port directly — treat DESIGN.md as the spec and the prototype as a visual reference only.
*Done when:* every component in DESIGN.md's Components section exists and matches its documented token usage; switching List↔Board preserves search/filter state per the Layout section's requirement.

**M9 — Bidirectional sync end-to-end**
Wire UI→filesystem and filesystem→UI together, tested against USER_FLOWS.md §4.3's "Claude Code edits CLAUDE.md live" scenario specifically.
*Done when:* that scenario passes manually at least three times in a row with no missed updates or duplicate rows.

**M10 — QA pass**
Verify against SPEC.md §9 success metrics: a disabled instruction is genuinely invisible to the AI (test by having an AI agent read the active file and confirm the disabled line is absent), and zero data loss across repeated toggle cycles (scripted stress test: toggle every instruction off and back on 50 times, diff the file against its original state).
*Done when:* both checks pass with an automated test, not just manual spot-checking.

## Working conventions to carry into the coding session

- Every architectural choice gets a `DECISIONS.md` entry with rationale, before or immediately after making it — this project's established pattern, not a new rule.
- Re-read `DESIGN.md`/`DECISIONS.md` fresh immediately before editing either — this project has been touched by multiple concurrent agents/sessions and stale in-context copies have caused write conflicts before.
- Don't scope-creep into Phase Two items (see ROADMAP.md "Later") without a logged decision first, per `CLAUDE.md`.
