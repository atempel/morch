# Roadmap — Morch

Now/Next/Later view. Phase One scope per SPEC.md §7. Framework: Tauri v2 + SQLite (DECISIONS.md).

## Now — Phase One Build-Out

Sequenced implementation tasks. Each depends on the ones before it unless noted.

1. **Scaffold the app** — Tauri v2 + React project, reusing the GamerDash stack pattern. Persistence is JSON only for Phase One (`.morch/config.json` per FILE_STRUCTURE.md §6.3) — SQLite is not wired in at scaffold time (see DECISIONS.md, 2026-07-10). App config directory is `.morch/` (renamed from `.orchestrator/`, see DECISIONS.md, 2026-07-10). See `docs/IMPLEMENTATION_PLAN.md` for the full milestone breakdown (M1–M10) and acceptance criteria.
2. **File Scanner** — walk a workspace directory, detect candidate files (CLAUDE.md, AGENTS.md, SKILLS/, etc.) per SPEC.md §3.1.
3. **Onboarding wizard UI** — checklist of detected files, manual add/remove, save config (USER_FLOWS.md §4.1).
4. **Markdown Parser** — line-based instruction extraction. Apply findings from `PARSING_VALIDATION.md`: skip headers/blank lines, preserve line numbers, don't special-case block structure yet (log-style files get flagged in the wizard instead, not auto-detected).
5. **Disabled Archive Manager** — `.morch-disabled/` mirror structure, move-on-toggle-off / restore-on-toggle-on logic (FILE_STRUCTURE.md §6.2).
6. **File Watcher** — debounced, hash-based change detection to avoid sync loops on the app's own writes (TECHNICAL_ARCHITECTURE.md §5.5).
7. **Instruction Manager** — in-memory instruction model, toggle/restore state transitions, alias assignment.
8. **Dashboard UI** — build directly against `DESIGN.md` (validated via an interactive prototype, see DECISIONS.md's design-system entries): List view (sidebar + single-file pane) and Board view (Kanban, one horizontally-scrolling column per file), a working light/dark toggle, the disabled-instruction archive AND the separate ignored-files drawer, toggles, hover-to-preview full text, alias editing. Group list-derived instructions visually per the ordered-list finding in `PARSING_VALIDATION.md`.
9. **Wire bidirectional sync end-to-end** — UI→filesystem and filesystem→UI, tested against the "Claude Code edits CLAUDE.md live" scenario (USER_FLOWS.md §4.3).
10. **QA pass against SPEC.md §9 success metrics** — verify a disabled instruction is actually invisible to the AI, verify zero data loss across toggle cycles.

## Next — Immediately Post-Phase-One

- Multi-line instruction block support (grouping consecutive lines like DECISIONS.md's Decision/Rationale/Status into one toggleable unit) — flagged as a real gap in `PARSING_VALIDATION.md`, deferred because it needs a block-boundary heuristic that's easy to get wrong.
- Instruction `type` metadata (directive vs. context) — informed by the "Project Purpose" prose-paragraph finding.
- Usage analytics to inform naming/aliasing suggestions (SPEC.md §8 asks whether the app should suggest names).
- **Configurable default Markdown editor**: let the user set a preferred external editor for managed files, then add an "open in editor" control next to each filename (sidebar item / board column header) alongside the existing ignore-file control — a quick way to jump from Morch straight into editing the underlying file. Needs a new config field (editor command/path) and a Rust command to launch it (likely `std::process::Command` or a Tauri shell-plugin call, scoped carefully since it's launching an arbitrary user-configured executable).
- **Confirm before ignoring a file**: the ignore-file action (`onIgnoreFile` in `ListView`/`BoardView`) currently fires immediately on click with no confirmation, unlike DESIGN.md's stated "one-click, one-click-reversible" intent for this control. Add a lightweight confirmation step (e.g. a small inline confirm rather than a full modal, to stay consistent with the product's general "reversible actions aren't scary" tone) before actually flipping the managed-file's `enabled` flag.

## Later — Phase Two+ (Explicitly Out of Scope for Now)

Per SPEC.md §7 and CLAUDE.md's scope-creep guardrail (any move here needs a logged DECISIONS.md entry first):

- Skill management
- Context block management
- Advanced search and filtering
- Instruction versioning and history
- Sharing/collaboration features
- AI-assisted instruction generation

## Open Question Carried Forward

SPEC.md §8's research questions (best instruction format, how users actually structure workspaces, alias suggestion, toggle-vs-delete frequency) are explicitly meant to be answered by **usage data**, not upfront design — don't try to resolve these before shipping Phase One.
