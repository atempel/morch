# Spikes — how development runs on this project after Phase One

Phase One (M1–M10 in `docs/IMPLEMENTATION_PLAN.md`) was tracked as ten milestone issues, built by sessions and merged by hand after a second agent's review. It shipped. What comes next is smaller and more frequent, and it is done by scheduled sessions that start from nothing — so the unit of work has to carry everything a session needs, and the state has to live somewhere a session can read without a person in the loop.

A **spike** is one self-contained unit of work, written so that a session can execute it without asking what to do. It is not a ticket. A ticket says what someone wants; a spike says exactly what to read, what to build, what "done" looks like, and how to prove it.

## Where things live

Two artifacts, and they never repeat each other.

| | Where | Why there |
|---|---|---|
| **What to build** — goal, reading list, steps, acceptance criteria | the brief, `SP-NNN-*.md` in this folder | It is content. It changes with the code, in the same PR as the code. |
| **State** — not done / done / taken | the GitHub issue | It changes faster than merges do. A file on `main` is only true at merge time. |

```
open issue                → not done
closed issue              → done
label `in-progress`       → a session has claimed it
label `ready` / `blocked` → derived from whether every dependency is closed
```

`gh issue list --label spike --state open` is the board. `--state closed` is the history. The brief carries no status key, and `scripts/validate-spikes.mjs` refuses one.

## Anatomy

Every file uses `TEMPLATE.md`. YAML frontmatter carries the machine-readable part:

```yaml
id: SP-004
title: Short imperative title
milestone: next        # next | later | maintenance — docs/ROADMAP.md's buckets
depends_on: [SP-001]   # the issue is blocked until each one is closed
estimate: M            # S ≈ half a session · M ≈ one session · L ≈ split it
kind: build            # build | research | decision
```

Only `kind: build` runs unattended. `research` produces evidence and a recommendation; `decision` prepares a product choice. Both end with the options written into the brief's Notes and `needs-decision` on the issue — a person decides. This is `CLAUDE.md`'s scope guardrail as a mechanism rather than a reminder: nothing in `docs/ROADMAP.md`'s Next or Later starts without a logged `DECISIONS.md` entry, and the routine cannot write one.

## Running one

With the `/spike` command in `.claude/commands/spike.md`:

```
/spike SP-004
```

Rules the runner must follow:

- **Claim before reading.** Add `in-progress` to the issue and comment with the session link, first thing. A spike that is closed, labelled `in-progress`, or has an open linked PR is taken — pick the next one.
- **Read before writing.** `CLAUDE.md` and the brief's reading list are not optional and not a summary — open the files.
- **Do not exceed scope.** Anything discovered but out of scope becomes a new brief plus a new issue, not an extra commit.
- **Stop at ambiguity.** Comment the options and trade-offs on the issue, add `needs-decision`, and stop. Do not decide alone.
- **Leave the repo green.** `npx tsc --noEmit`, `npm run build` and `cd src-tauri && cargo test` pass, or the spike isn't done.
- **Close the issue from the PR.** `Closes #<n>` in the PR body. The scope guard checks the link exists; merging does the rest.
- **Record the outcome.** Fill Notes and Outcome in the brief. If the issue carries `needs-decision`, append the answer to `DECISIONS.md` — the issue keeps the conversation, the repo keeps the conclusion.

## What merges itself, and what does not

`auto-merge.yml` merges a PR when CI is green **and** `scripts/check-pr-scope.mjs` says the PR is structurally legal: it names a `kind: build` spike, closes that spike's issue, touches no decided document (`docs/SPEC.md`, `docs/PRD.md`, `docs/USER_FLOWS.md`, `DESIGN.md`, `BRAND.md`), appends to `DECISIONS.md` rather than rewriting it, updates its own brief, and edits nothing under `.github/workflows/`. Anything else is labelled `needs-review` with the guard's output in a comment, and takes the second-agent review `.claude/skills/github-workflow/SKILL.md` describes. The guard is a structural review; it does not judge whether the code is good.

Two more locks run without anyone asking: `dedupe.yml` closes a second PR opened for a spike that already has one, and `issue-hygiene.yml` releases a claim when its issue closes and recomputes `ready`/`blocked` for everything that unblocked.

## Adding a spike

Write the brief from `TEMPLATE.md`. Its issue is created by the `board` workflow's manual run (Actions → board → Run workflow), or by `node scripts/sync-spikes-to-issues.mjs` from a checkout with `gh` authenticated. CI runs the same script with `--check` and fails a PR if a brief has no issue, or a readiness label disagrees with the dependency graph. An issue whose brief is still on an unmerged branch is a warning, not a failure — no other PR can fix it.

## Ordering

Dependencies are declared in frontmatter, so the next runnable spike is derivable rather than remembered: an issue is `ready` when every `depends_on` issue is closed.
