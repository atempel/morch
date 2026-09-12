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

**Spike PRs merge themselves.** A PR whose title names a `kind: build` spike
(`feat(SP-004): …`) is merged by `.github/workflows/auto-merge.yml` once CI is green and
`scripts/check-pr-scope.mjs` finds it structurally in scope — right spike, `Closes #<n>`
naming its issue, no edit to a decided document, `DECISIONS.md` appended not rewritten, the
brief updated, no workflow touched. The guard is the review for that class of change; see
`docs/plan/spikes/README.md` and the 2026-09-12 entry in `DECISIONS.md`.

**Everything else — big updates or changes that are not a build spike — must go through a
PR and be reviewed by another agent before merging.** The guard labels those `needs-review`
and says why. This includes new milestones/features, architecture or persistence changes, and
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

## Tracking work

Phase One's M1–M10 (`docs/IMPLEMENTATION_PLAN.md`) are closed. Work since is spikes:
`docs/plan/spikes/SP-NNN-*.md` is the brief, the issue titled `SP-NNN — Title` is the
state. `gh issue list --label spike --state open` is the board. Issues are created from
briefs by `scripts/sync-spikes-to-issues.mjs` (or the `board` workflow's manual run), never
by hand — a hand-written spike issue drifts from its brief.

## Cowork's docs-only workflow

Alexandre also edits this repo from Claude (Cowork mode), separately from Claude Code
sessions. Cowork is scoped to documentation only — `docs/`, `DECISIONS.md`, `README.md`,
`CLAUDE.md`, `BRAND.md`, `brand/`, skill files like this one — never `src/` or `src-tauri/`.

Cowork commits through a persistent `cowork-docs` branch (created 2026-07-13) using git
plumbing (`hash-object`/`read-tree`/`commit-tree`/`update-ref`) rather than a checked-out
worktree, since `git worktree add` and `git clone` aren't reliable in its sandbox (both have
corrupted `.git/config` there). It pushes using a fine-grained GitHub PAT — Contents and
Issues, read/write, scoped to this repo only — stored locally at `.morch-cowork-token`
(gitignored, never committed, never displayed in chat). If you see that file in the repo
root, it's expected — don't delete it without checking with Alexandre first.
