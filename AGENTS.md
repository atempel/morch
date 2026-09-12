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

## How work is done here

Phase One (M1–M10) is shipped. Work is now defined as **spikes** — self-contained briefs in `docs/plan/spikes/`, each with a mandatory reading list, numbered build steps naming real file paths, binary acceptance criteria, and a verification command. Read `docs/plan/spikes/README.md` before starting anything.

**The board is GitHub issues, not a file.** The brief says what to build; the issue says whether it is done. They never repeat each other.

```
gh issue list --label spike --label ready --state open    # what to work on
gh issue list --label spike --state closed                # what already happened
```

An open issue is not done, a closed one is done, and `in-progress` means a session has claimed it. Claim before reading: add the label and comment with the session link. Run a spike with `/spike SP-NNN`.

Only `kind: build` spikes run unattended. `research` and `decision` briefs end with options on the issue and `needs-decision` — a person decides, because `CLAUDE.md`'s scope guardrail says every step into `docs/ROADMAP.md`'s Next or Later needs a logged `DECISIONS.md` entry first.

Stop at ambiguity: write the options and trade-offs into the brief's Notes and ask. Do not decide alone.

## Handoff Notes

When picking up this project fresh, read in this order:
1. `README.md`
2. `docs/SPEC.md`
3. `DECISIONS.md`
4. `docs/TECHNICAL_ARCHITECTURE.md`
5. `docs/plan/spikes/README.md` — how work is picked up, run and merged
