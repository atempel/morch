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

### UI Components (Storybook)
- Before building or changing anything in `src/dashboard/` or `src/onboarding/`, check
  `list-all-documentation` / `get-documentation` (Storybook MCP) for an existing story
  covering the component — don't re-derive prop shapes from scratch if a story already
  documents them.
- Any new or changed presentational component gets a co-located `*.stories.tsx` (see
  `.claude/skills/storybook/SKILL.md` for the mocking convention for components that call
  `invoke`).
- Run `run-story-tests` (Storybook MCP) before considering UI work done — this is in
  addition to, not instead of, `tauri dev` verification for full-flow changes.
- Stories the MCP tooling auto-generates carry an `ai-generated` tag — review them and
  remove the tag once a human has actually checked the story against Figma; don't leave
  it tagged and call the work finished.

## Handoff Notes

When picking up this project fresh, read in this order:
1. `README.md`
2. `docs/SPEC.md`
3. `DECISIONS.md`
4. `docs/TECHNICAL_ARCHITECTURE.md`
