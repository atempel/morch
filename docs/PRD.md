# PRD — Morch

**Status**: Draft v1 · **Owner**: Alexandre · **Last updated**: 2026-07-09

Synthesized from `SPEC.md`, `USER_FLOWS.md`, `DECISIONS.md`, `ROADMAP.md`, and `PARSING_VALIDATION.md`. This is the canonical requirements document for Phase One; those source docs remain the detailed backing material.

---

## 1. Problem Statement

People who work with AI coding agents (Claude Code, Cursor, etc.) accumulate instructions across markdown files — CLAUDE.md, AGENTS.md, SKILLS/, DECISIONS.md — as their workspace matures. There's no way to see everything that's currently "active" at a glance, and no safe way to temporarily silence an instruction without permanently deleting it or manually hunting through files to comment it out. As workspaces grow past a few dozen instructions, this becomes genuine cognitive load: users lose track of what the AI is actually being told, and stop trusting their own documentation. The cost of not solving this is workspace rot — instructions become stale or contradictory because pruning them feels risky and tedious.

This is a single-user, personal-productivity problem first (Alexandre's own workspace), not an enterprise multi-tenant one — the PRD scopes accordingly.

## 2. Goals

- Give the user a single dashboard view of every instruction across their managed markdown files, replacing manual file-reading as the way they audit their workspace.
- Make disabling an instruction a reversible, one-click action with zero data loss — the instruction is never deleted, only relocated.
- Guarantee that a disabled instruction is verifiably invisible to the AI agent reading the workspace (this is a trust requirement, not just a UX one).
- Keep bidirectional sync accurate: external edits (e.g., Claude Code rewriting CLAUDE.md) must show up in the dashboard without a restart, and dashboard toggles must write back to disk immediately.
- Ship Phase One (instructions only) fast enough to start generating real usage data that answers the open research questions in §7, rather than over-designing upfront.

## 3. Non-Goals

- **Skill and context-block management** — explicitly deferred to Phase Two. Managing SKILLS/ file *contents* as instructions is in scope; treating skills as a distinct manageable entity type is not.
- **Multi-user / shared workspace collaboration** — this is a local, single-user desktop tool. No sync-across-devices or team permission model in v1.
- **AI-assisted instruction generation or rewriting** — Morch manages state (on/off, alias), it does not author or edit instruction content on the user's behalf.
- **Enforcing a structural schema on markdown files** — per Core Principle #1 in CLAUDE.md, the app must never require reorganizing an existing workspace. This is a hard constraint, not a v1-only limitation.
- **Automatic handling of multi-line logical blocks** (e.g., DECISIONS.md-style Decision/Rationale/Status entries) — confirmed as a real gap in `PARSING_VALIDATION.md`, deferred because a general block-boundary heuristic is easy to get wrong. v1 mitigation is to let the user exclude log-style files from management via the wizard.

## 4. User Stories

All stories use the persona **workspace owner** — the person who maintains their own AI-facing markdown files and wants control over them without leaving a dashboard.

**Onboarding**
- As a workspace owner, I want Morch to scan my workspace directory and show me candidate files, so I don't have to manually register every file I want managed.
- As a workspace owner, I want to check/uncheck which discovered files Morch manages, so log-style or irrelevant files aren't force-included.
- As a workspace owner, I want to manually add a file Morch didn't auto-detect, so my setup isn't limited by the scanner's heuristics.

**Managing instructions**
- As a workspace owner, I want to see every instruction in a managed file as an individual toggle, so I can audit what's active without opening the raw file.
- As a workspace owner, I want to hover an instruction to see its full text, so short aliases don't hide meaning I need.
- As a workspace owner, I want to assign a short alias to an instruction, so I can recognize it at a glance later.
- As a workspace owner, I want to toggle an instruction off and have it disappear from the file the AI reads, so I can trust that "off" actually means off.
- As a workspace owner, I want to toggle a disabled instruction back on, so experimentation is reversible and low-risk.

**Sync**
- As a workspace owner, I want changes Claude Code makes directly to CLAUDE.md to show up in my dashboard without restarting the app, so the dashboard never goes stale relative to the filesystem.
- As a workspace owner, I want my own toggle actions to write to disk immediately, so there's no "save" step to forget.

**Archive**
- As a workspace owner, I want to browse what I've disabled and when, so I can audit my own history and reconsider old decisions.
- As a workspace owner, I want the disabled archive to be somewhere the AI agent never reads, so disabling something is a real guarantee, not a UI-only illusion.

## 5. Requirements

### Must-Have (P0)
1. **Workspace scan & onboarding wizard** — detect candidate files, present checklist, allow manual add/remove, persist config. *Acceptance*: first launch on a real workspace (this project's own root) correctly detects CLAUDE.md, AGENTS.md, DECISIONS.md, docs/*.md.
2. **Line-based markdown parser** — extract instructions line-by-line, skip headers/blank lines (per `PARSING_VALIDATION.md` finding #1), preserve original line numbers. *Acceptance*: parsing this project's own CLAUDE.md produces exactly the bullet/numbered items as instructions, zero header lines surfaced as toggles.
3. **Toggle off → disabled archive** — remove line from active file, write to `.morch-disabled/<file>` mirror, preserve enough metadata to restore. *Acceptance*: toggling an instruction off removes it from the file Claude Code would read, and it reappears verbatim on toggle-on.
4. **Toggle on → restore** — move instruction back from archive to its original position (or end of file if position is ambiguous after other edits). *Acceptance*: no data loss across 10 consecutive toggle-off/toggle-on cycles on the same instruction.
5. **File watcher with loop prevention** — detect external edits, re-parse, update dashboard; must not re-trigger on the app's own writes. *Acceptance*: editing CLAUDE.md externally (e.g., via a text editor) updates the dashboard within a debounce window without the app re-processing its own prior write as a new external change.
6. **Alias assignment** — user can set/edit/clear a short name per instruction, persisted across restarts.
7. **Dashboard UI** — per-file columns, toggle switches, hover-to-preview.

### Nice-to-Have (P1)
1. Visual grouping of instructions that originated from the same markdown list (ordered or unordered) — mitigates the sequence-dependent-list finding in `PARSING_VALIDATION.md`.
2. Onboarding wizard flags log-style files (e.g., DECISIONS.md) as poor per-line-toggle candidates, without blocking the user from managing them anyway.
3. Instruction `type` metadata (directive vs. context) surfaced in the UI, informed by the "prose paragraph" finding.
4. Basic usage stats (how often files are toggled) to start answering §7 open research questions.

### Future Considerations (P2)
1. Multi-line instruction block grouping (general solution to the DECISIONS.md block-splitting problem).
2. AI-suggested aliases based on instruction content.
3. Skill and context-block management (Phase Two, requires an explicit `DECISIONS.md` entry to unlock per CLAUDE.md's scope-creep guardrail).
4. Search/filter across all managed instructions.
5. Instruction versioning/history beyond the disabled-archive timestamp.

## 6. Success Metrics

This is a solo-user personal tool, so classic adoption/NPS/revenue metrics don't apply. Success is measured against the trust and reliability bar the product needs to clear to be usable at all:

**Correctness (must hold from day one, not "improve over time")**
- Zero instances of a disabled instruction still being visible to the AI agent, verified by direct inspection of the active file after every toggle-off.
- Zero data loss or corruption across toggle cycles, verified by round-tripping every instruction in this project's own CLAUDE.md/AGENTS.md through 10 toggle cycles with a diff check against the original.

**Usability (self-assessed, since there's one user)**
- Time to answer "what's currently active in my workspace" drops from "open and read N files" to "open one dashboard" — qualitative, but the whole point of the tool.
- Sync latency: external edit → dashboard update should feel instant (target: under 1 second, debounce window included).

**Learning (feeds Phase Two decisions)**
- After ~30 days of real use, usage data should be enough to answer at least 2 of the 5 open research questions in §7 below (e.g., toggle-vs-delete frequency, common instruction formatting patterns).

## 7. Open Questions

Carried forward from `SPEC.md` §8 — genuinely unresolved, meant to be answered by usage, not upfront design:

- What is the best way to format instructions in markdown files? *(engineering + usage data)*
- How do users naturally structure their workspaces, beyond this project's own conventions? *(usage data — relevant if Morch is ever used by anyone besides Alexandre)*
- What metadata is most useful for instruction discovery/organization? *(usage data, informs P1 item on `type` metadata)*
- Should Morch suggest instruction aliases, or should the user always assign them manually? *(product decision, deferred to post-launch feedback)*
- How often do users toggle instructions on/off vs. delete them permanently? *(usage data — directly shapes whether the disabled-archive UX is even the right primary mechanism)*

**New from this PRD pass:**
- Should `.orchestrator/` (the app's own config directory) be renamed to `.morch/` for branding consistency with `.morch-disabled/`? Currently left as-is; flagged in `ROADMAP.md` item 1. *(product decision — Alexandre)*
- Does SQLite fully replace the JSON `config.json` schema documented in `FILE_STRUCTURE.md` §6.3, or do both coexist (JSON for simple settings, SQLite for instruction/alias data at scale)? *(engineering — blocking for ROADMAP item 1, the scaffolding step)*

## 8. Timeline Considerations

No hard external deadline — this is self-directed. Phasing follows `ROADMAP.md`:

- **Now**: 10 sequenced Phase One build tasks (scaffold → scanner → wizard → parser → archive manager → watcher → instruction manager → dashboard → sync → QA).
- **Next**: multi-line block support, `type` metadata, usage analytics — start once Phase One is in daily use.
- **Later**: skills/context management, search, versioning, collaboration — explicitly gated behind a logged `DECISIONS.md` entry before any work starts, per CLAUDE.md's scope-creep guardrail.

Dependency to flag: the interface prototype (Nord-themed, in progress) should inform the Dashboard UI requirement (§5, P0 item 7) before that task starts, so the build isn't guessing at layout twice.
