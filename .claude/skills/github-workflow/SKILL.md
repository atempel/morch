---
name: github-workflow
description: Use when committing, pushing, opening issues/PRs, or making any git/GitHub
  operation in the Morch repo — covers branch strategy, commit conventions, and when
  DECISIONS.md needs updating alongside a git change.
---

## Repo

`github.com/atempel/morch` — public, MIT licensed.

## Branch strategy

Single `main`. Small, routine changes (config tweaks, doc fixes, permission allowlist
updates) can be committed directly — no PR needed for those.

**Big updates or changes must go through a PR and be reviewed by another agent before
merging.** This includes new milestones/features, architecture or persistence changes, and
anything otherwise significant enough to warrant a `DECISIONS.md` entry. Open a branch, push
it, `gh pr create`, get another agent's review, then merge — don't merge your own PR without
that review. There's no branch protection enforcing this yet, so it's on the honor system
until collaborators are added.

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
