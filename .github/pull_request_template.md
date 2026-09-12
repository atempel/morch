## Spike

<!-- SP-NNN — title. Link the brief: docs/plan/spikes/SP-NNN-*.md
     Not spike work (a routine fix, a docs change)? Delete this section; the PR
     is held for the second-agent review from .claude/skills/github-workflow/SKILL.md. -->

Closes #<!-- the spike's issue number. Required for a spike: merging this is what marks it done. -->

## What this does

<!-- One paragraph. What is true now that wasn't before. -->

## Acceptance criteria

<!-- Every criterion from the brief, with evidence — command output, a measured number, a test name. "Looks correct" is not evidence. -->

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | | ✅ / ❌ | |

## Checklist

- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` passes
- [ ] `cd src-tauri && cargo test` passes
- [ ] The diff touches only paths named in the brief's **Build exactly this**
- [ ] No decided document was edited (`docs/SPEC.md`, `docs/PRD.md`, `docs/USER_FLOWS.md`, `DESIGN.md`, `BRAND.md`) — findings go in this body
- [ ] `DECISIONS.md` was appended to, never rewritten — and has an entry if this is an architecture/framework/persistence decision, or the issue carried `needs-decision`
- [ ] The brief's Notes and Outcome are filled in
- [ ] Out-of-scope findings were filed as new briefs **and** new issues, not implemented here
- [ ] `CLAUDE.md`'s four Core Principles still hold (no forced structure · AI described as a tool · disabled means archived, not deleted · structural files in English)

New spikes filed: <!-- ids, or "none" -->

## Notes for the reviewer

<!-- Surprises, trade-offs taken, anything the plan gets wrong. Say it here rather than editing the specs. -->
