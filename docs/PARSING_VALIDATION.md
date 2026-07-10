# Parsing Validation — "Each Line Is a Candidate Instruction"

Findings from testing the line-based parsing assumption (SPEC.md §8, DECISIONS.md) against this project's own CLAUDE.md, AGENTS.md, and DECISIONS.md.

## What Works

Bulleted and numbered list items map cleanly to one-instruction-per-line:

- `AGENTS.md` under "Parsing Engine" / "File Watching / Sync" / "Disabled Archive" — every line is a self-contained, independently toggleable rule.
- `CLAUDE.md` under "Core Principles" and "Working on This Project" — same pattern.

This is the common case in both files and validates the core assumption for imperative-style instruction files.

## Edge Cases Found

1. **Headers and blank lines are noise.** A raw line-by-line parser would surface `## Core Principles (Non-Negotiable)` as a toggleable "instruction," which is meaningless to disable. The parser needs to skip heading lines and blank lines rather than presenting them as toggles — this is a parsing filter, not a structural requirement on the user's file, so it doesn't conflict with Core Principle #1.

2. **Prose paragraphs become one long "instruction."** CLAUDE.md's "Project Purpose" section is a single unwrapped line of descriptive text. Line-based parsing treats it as one instruction, which is technically correct but semantically different from an actionable rule — it's background context, not a directive. Confirms the open research question in SPEC.md §8 ("what metadata is most useful for instruction discovery") — a `type` field (e.g., `directive` vs. `context`) may be worth adding, but isn't required to ship Phase One.

3. **Ordered, sequence-dependent lists.** AGENTS.md's "Handoff Notes" numbered list (read README → SPEC → DECISIONS → TECHNICAL_ARCHITECTURE) still parses fine line-by-line, but toggling item 3 off while leaving 1, 2, 4 on silently breaks the intended reading order. Not a parser bug, but a UX consideration: the dashboard should probably show list items as visually grouped/ordered rather than as independent flat toggles when they came from the same list.

4. **Multi-line logical blocks break under pure line-based parsing.** This is the one real failure case. DECISIONS.md entries look like:

   ```
   **Decision**: Build on Tauri v2 with SQLite...
   **Rationale**: Alexandre already has working Tauri v2...
   **Status**: Locked in.
   ```

   Treated as three separate lines, toggling off the "Rationale" line but keeping "Decision" and "Status" produces a nonsensical, orphaned entry. DECISIONS.md is a **log**, not an instruction file — it's append-only history, not AI-facing directives the way CLAUDE.md/AGENTS.md are. Recommendation: Phase One's onboarding wizard (SPEC.md §3.1/§3.7) should let users exclude log-style files like DECISIONS.md from management, rather than the parser trying to guess block boundaries. Multi-line block detection (grouping consecutive lines under one toggle) is a real feature gap, but solving it generally is Phase Two work, not a blocker for Phase One.

## Conclusion

The line-based assumption holds well for the primary use case (bullet/numbered directives in CLAUDE.md-style files) and doesn't need to change for Phase One. Three follow-ups come out of this validation, tracked in the Phase One task list:

- Parser must skip headers and blank lines (display filter, not user-facing structure requirement).
- Dashboard should visually group list items that originate from the same markdown list.
- Onboarding wizard should flag/deprioritize log-style files (e.g., DECISIONS.md) as poor candidates for per-line toggling, without blocking the user from managing them anyway if they choose to.
