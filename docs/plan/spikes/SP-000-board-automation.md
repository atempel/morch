---
id: SP-000
title: A board that sessions can run from, and the locks that keep it honest
milestone: maintenance
depends_on: []
estimate: M
kind: build
---

# SP-000 — A board that sessions can run from, and the locks that keep it honest

## Goal

After this spike, a scheduled session can open this repository cold, find the next runnable unit of work in GitHub issues, do it, and have the result merge itself when CI is green and the change is structurally in scope — with the issue closed, its claim released, and its dependents relabelled, all without a person remembering any of it. Before this spike, work was tracked as ten hand-written milestone issues and merged by hand.

## Read first

- `CLAUDE.md` — the scope guardrail: nothing in Next/Later starts without a `DECISIONS.md` entry. The board has to enforce that, not restate it.
- `.claude/skills/github-workflow/SKILL.md` — the review rule this automation narrows: spike PRs merge on a structural check; everything else keeps the second-agent review.
- `docs/ROADMAP.md` — the Next/Later buckets that become the `milestone` vocabulary.
- `.github/workflows/ci.yml` — the two jobs whose completion auto-merge listens for.

## Build exactly this

1. `docs/plan/spikes/README.md` and `TEMPLATE.md` — the process and the brief shape. No `status` key anywhere.
2. `scripts/validate-spikes.mjs` — frontmatter, dependency DAG, required sections. Milestones are `next | later | maintenance`.
3. `scripts/sync-spikes-to-issues.mjs` — briefs → issues; `ready`/`blocked` derived from closed dependencies; `--check` for CI; an issue whose brief is not on the checkout is a warning, not drift.
4. `scripts/check-pr-scope.mjs` — the auto-merge guard: build spike, `Closes #n` naming its issue, no edits to `docs/SPEC.md`, `docs/PRD.md`, `docs/USER_FLOWS.md`, `DESIGN.md`, `BRAND.md`, `DECISIONS.md` append-only, the brief updated, no workflow or secret touched.
5. `.github/workflows/board.yml` (validate + `--check` on every PR; `workflow_dispatch` to create issues), `auto-merge.yml` (on CI completion; merges, closes the issue and asserts it, recomputes readiness), `dedupe.yml` (a later PR for a spike that already has one is closed), `issue-hygiene.yml` (release claims, recompute readiness, ask for a roadmap review when a bucket empties).
6. `ci.yml` — re-run on `ready_for_review`, so a PR that went green as a draft gets its second look.
7. `.claude/commands/spike.md`, `.github/pull_request_template.md`, `.github/ISSUE_TEMPLATE/spike-blocked.md` — how a session runs one, reports one, and stops on one.
8. `AGENTS.md`, `CLAUDE.md`, `README.md`, `docs/ROADMAP.md`, the skill file — point at the board. `DECISIONS.md` — one entry for the merge policy change.
9. Seed the board with the three items in `docs/ROADMAP.md`'s Next section as `kind: decision` briefs (SP-001, SP-002, SP-003), so the first thing the routine finds is three questions for a person, not three features to build.

## Out of scope

- Any change to `src/` or `src-tauri/`.
- Deciding anything in `docs/ROADMAP.md`'s Next or Later. The briefs seeded here ask; they do not answer.
- Branch protection or required checks — the guard is what stands in for them.

## Acceptance criteria

- [ ] `node scripts/validate-spikes.mjs` exits 0 on the seeded briefs
- [ ] Every workflow parses to exactly `name`, `on`, `permissions` (where declared) and `jobs`, and every `run:` block passes `bash -n`
- [ ] After merge, the Actions API lists `board`, `auto-merge`, `dedupe` and `issue-hygiene` by name, not by file path
- [ ] After the `board` workflow's manual run, every brief has an issue titled `SP-NNN — Title` with `spike`, its `kind:`, its bucket, and `ready` or `blocked`
- [ ] The three seeded decision briefs are labelled `kind:decision` and their issue bodies tell the runner to stop and ask
- [ ] The next `pull_request` run of `board` on a fresh PR exits 0

## Verify

```bash
node scripts/validate-spikes.mjs
python3 -c "import yaml,glob;[print(f,sorted(str(k) for k in yaml.safe_load(open(f)))) for f in glob.glob('.github/workflows/*.yml')]"
# after merge:
gh workflow list          # four new names, none shown as a path
gh issue list --label spike --state open
```

## Decision to record

That spike PRs merge on a structural check rather than a second agent's review, and why that is safe (the guard's rules), and what still needs the review (everything that is not a build spike, and every edit to CI). Entered in `DECISIONS.md` by this spike.

## Notes

The mechanism is a port of a board that runs another project of the same owner's, brought over as mechanism only: scripts, workflows, templates and the process document. Nothing from that project's content — its briefs, its decisions, its vocabulary — is here, and nothing here refers back to it; the two repositories stay isolated. Three things were adapted rather than copied:

- Milestones are `docs/ROADMAP.md`'s buckets (`next`, `later`, `maintenance`) instead of numbered milestones, because M1–M10 are done and were never spikes.
- `kind: decision` stops the routine as hard as `kind: research` does, because `CLAUDE.md` makes every step into Next/Later a logged product decision.
- The frozen-document list is this project's own decided set. `docs/TECHNICAL_ARCHITECTURE.md` and `docs/FILE_STRUCTURE.md` are deliberately editable, because they describe the code as built and a build spike that changes the on-disk layout has to keep them true.

Two defects that a port of this kind is prone to were checked for before the first push, because they are silent: a multi-line `--body "…"` string inside a `run:` block whose continuation lines start in column 0 ends the YAML block scalar and makes GitHub refuse the whole workflow with no error a PR check would show (the Actions API then lists the file by path instead of by `name:`); and a guard step ending in `| tee` reports `tee`'s exit code, so the merge decision reads success whatever the guard said. Every multi-line body here is a quoted heredoc written to a file, and the guard step sets `pipefail`.

## Outcome

**Done** — shipped by the PR that lands this file, merged by hand because it edits
`.github/workflows/` and the guard holds every such PR. Its own issue cannot exist
before the script that creates issues is on `main`, so the order is: merge, run the
`board` workflow once by hand, then close `SP-000`'s freshly created issue with a link
to the PR. The three decision briefs (SP-001, SP-002, SP-003) come up `ready` and
`kind:decision` — the first thing the routine finds is three questions for a person.
Criteria 3–6 are checked after the merge and recorded on the issue.
