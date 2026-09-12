---
description: Execute a spike brief from docs/plan/spikes/ end to end
argument-hint: <spike id, e.g. SP-004>
---

You are running spike **$1** for the Morch project. Follow this procedure exactly.

## 1. Claim it, before anything else

The board is GitHub issues, not a file. Find $1's issue:

```
gh issue list --label spike --state all --search "$1 in:title" --json number,state,labels,title
```

Stop, and say why, if any of these is true:

- the issue is **closed** — the spike is done
- it carries **`in-progress`** — another session has it
- it carries **`blocked`**, or any `depends_on` issue is still open
- an **open PR** already names $1 (`gh pr list --state open --search "$1"`)
- its `kind` is **`research`** or **`decision`** — a person decides those. Do the reading, write the options and trade-offs into the brief's Notes and as a comment on the issue, add `needs-decision`, and end the session. `CLAUDE.md`'s scope guardrail is why: nothing in `docs/ROADMAP.md`'s Next or Later starts without a logged `DECISIONS.md` entry, and that entry is not yours to write.

Otherwise claim it now, before reading anything:

```
gh issue edit <n> --add-label in-progress
gh issue comment <n> --body "Claimed by a Claude Code session: <session url>"
```

Claiming first is the point. A session that reads for ten minutes and then claims has left a ten-minute window for another run to start the same work.

## 2. Load

Read, in this order, and actually open the files:

1. `CLAUDE.md` — the four Core Principles are non-negotiable; every step of the brief has to survive them.
2. `docs/plan/spikes/$1*.md` — the brief, in full.
3. Every path in its **Read first** list.
4. `docs/SPEC.md` — the source of truth for scope; `DECISIONS.md` — what is already settled.
5. `.claude/skills/github-workflow/SKILL.md` — commit conventions, and when `DECISIONS.md` changes in the same commit.

## 3. Plan, and check yourself

Restate the goal in one sentence and list the files you will create or modify. If anything is genuinely ambiguous — a decision with real trade-offs the spec does not settle, or a step that would bend a Core Principle — **stop here**: comment the options and trade-offs on the issue, add the `needs-decision` label, and end the session. An agent brings options at ambiguity rather than deciding alone.

## 4. Build

Work on the branch this environment gives you; never commit to `main`. Implement only what is under **Build exactly this**. Standing rules:

- No forced structure on the user's workspace. Detection and recommendation, never a requirement.
- AI is described as a tool in every string, comment and document — never as an agent with intent.
- A disabled instruction is archived where the AI cannot read it, never deleted.
- Structural and AI-facing files are written in English.
- Do not edit `docs/SPEC.md`, `docs/PRD.md`, `docs/USER_FLOWS.md`, `DESIGN.md` or `BRAND.md`. Those are decided. If one is wrong, that is a finding for the PR body, not an edit.
- An architecture, framework or persistence choice gets its `DECISIONS.md` entry in the same commit.

Anything worth doing that is out of scope: write a new brief from `docs/plan/spikes/TEMPLATE.md`, open its issue (`node scripts/sync-spikes-to-issues.mjs`, or the `board` workflow's manual run), and leave the work undone.

## 5. Verify — evidence, not claims

Run the brief's **Verify** block, then `npx tsc --noEmit`, `npm run build` and `cd src-tauri && cargo test`.

Walk the acceptance criteria one at a time. For each, state PASS or FAIL **and the evidence**: the command output, the measured number, the test name. "Looks correct" is not evidence.

If a criterion fails and you cannot fix it inside this spike's scope: comment the reason on the issue, open the PR as a draft labelled `blocked`, leave `in-progress` on, and end the session. Never report a spike done with a failing criterion.

## 6. Close

- Fill the brief's **Notes** and **Outcome** sections. The brief has no `status` key — do not add one.
- If the issue carries `needs-decision`, append the answer to `DECISIONS.md`: what, why, alternatives discarded. The issue keeps the conversation; the repository keeps the conclusion.
- Open a PR using the repository's template. The title carries the spike id as its scope — `feat($1): …` or `fix($1): …` — because the branch name may not. The body **must** contain `Closes #<n>` naming this spike's issue — merging it is what marks the spike done, and the scope guard refuses auto-merge without the link.
- The criteria table with pass/fail and evidence goes in the PR body.

Do not close the issue by hand and do not touch `ready`/`blocked` labels — merging closes the issue, and the workflows recompute readiness for everything this spike unblocked.

Report: which spike, what shipped, criteria results, decisions recorded, and any new spikes you filed.
