# AGENTS.md — Morch

## Context

This file exists for any AI agent (Claude Code, Cursor, etc.) working on the Morch codebase once implementation begins. It complements `CLAUDE.md`.

## Agent Responsibilities by Area

### Parsing Engine
- Treat each line in a managed markdown file as a candidate instruction.
- Preserve original line numbers for accurate toggle/restore operations.
- No opinionated structure enforcement — see `CLAUDE.md` principle #1.

### File Watching / Sync
- Any change written by the app itself must not re-trigger a redundant re-parse (avoid sync loops — see `docs/TECHNICAL_ARCHITECTURE.md` §5.5).
- External edits (e.g., from Claude Code modifying CLAUDE.md directly) must be detected and reflected in the UI without requiring a restart.

### Disabled Archive
- Never write disabled instructions anywhere the AI's context-loading logic would read them.
- Mirror the active file structure in the archive (see `docs/FILE_STRUCTURE.md` §6.2, Option A).

## Handoff Notes

When picking up this project fresh, read in this order:
1. `README.md`
2. `docs/SPEC.md`
3. `DECISIONS.md`
4. `docs/TECHNICAL_ARCHITECTURE.md`
