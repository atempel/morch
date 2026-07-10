---
name: github-workflow
description: Use when committing, pushing, opening issues/PRs, or making any git/GitHub
  operation in the Morch repo — covers branch strategy, commit conventions, and when
  DECISIONS.md needs updating alongside a git change.
---

## Repo

`github.com/atempel/morch` — public, MIT licensed.

## Branch strategy

Single `main`, direct commits — no PR workflow, no branch protection, for solo Phase One
work (per `docs/IMPLEMENTATION_PLAN.md`). Revisit this once collaborators are added.

## Commit message style

Short imperative subject, optionally referencing the milestone, e.g.:

```
M6: add debounced file watcher
```

## Lockfiles

`package-lock.json` and `src-tauri/Cargo.lock` are committed, not ignored — this is an app,
not a library, so pinned dependency versions travel with the repo.

## What's gitignored vs. tracked in `.claude/`

- `.claude/settings.local.json` is gitignored — local/machine-specific (permission
  allowlists, session state), not shared.
- `.claude/settings.json` and `.claude/skills/**` ARE tracked and shared — they're project
  configuration (e.g. the statusline command) and skills, not machine-specific state.

## Decisions

Before committing any change that reflects an architecture, framework, or persistence
decision (per `CLAUDE.md`'s rule), update `DECISIONS.md` in the SAME commit, not after.

## Using `gh`

`gh` CLI is authenticated and available — prefer it over manual GitHub web steps for
anything scriptable (issues, PRs, repo settings).

## Tracking milestones

Track progress against `docs/IMPLEMENTATION_PLAN.md`'s M1–M10. If using issues per
milestone, reference the milestone ID (M6, M7, ...) in the title via `gh issue create`.
