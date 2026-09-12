#!/usr/bin/env node
/**
 * The spike board is GitHub issues. This script is the bridge from the briefs
 * (content, versioned with the code) to the issues (state, which changes faster
 * than merges do).
 *
 *   open issue                  → not done
 *   closed issue                → done
 *   label `in-progress`         → a session has claimed it
 *   label `ready` / `blocked`   → derived from whether every dependency is closed
 *
 * Nothing here is a mirror of state. The labels are recomputed from the issues
 * themselves; the briefs never carry status. Writing the same fact in two
 * places is how boards drift, so there is exactly one.
 *
 *   node scripts/sync-spikes-to-issues.mjs --dry-run   # show what would change
 *   node scripts/sync-spikes-to-issues.mjs             # apply
 *   node scripts/sync-spikes-to-issues.mjs --check     # CI: fail on drift, write nothing
 *
 * Needs the gh CLI, authenticated. This script never handles a token itself.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DRY = process.argv.includes('--dry-run');
const CHECK = process.argv.includes('--check');
const DIR = 'docs/plan/spikes';
const REPO = process.env.GITHUB_REPOSITORY ?? 'atempel/morch';

const gh = (...a) => execFileSync('gh', a, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }).trim();
const say = (m) => console.log(`${DRY ? '[dry-run] ' : CHECK ? '[drift] ' : ''}${m}`);

// ---- briefs ----------------------------------------------------------------

const spikes = readdirSync(DIR)
  .filter((f) => /^SP-\d{3}.*\.md$/.test(f))
  .sort()
  .map((file) => {
    const text = readFileSync(join(DIR, file), 'utf8');
    const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
    const get = (k) => fm.match(new RegExp(`^${k}:\\s*(.*)$`, 'm'))?.[1]?.replace(/\s+#.*$/, '').trim().replace(/^(['"])(.*)\1$/, '$2') ?? '';
    return {
      file,
      id: get('id'),
      title: get('title'),
      milestone: get('milestone'),
      kind: get('kind'),
      estimate: get('estimate'),
      dependsOn: get('depends_on').match(/SP-\d{3}/g) ?? [],
      goal: text.match(/## Goal\r?\n+([\s\S]*?)\r?\n## /)?.[1]?.trim() ?? '',
    };
  });

// ---- issues ----------------------------------------------------------------

// An issue is a spike's issue only if its title is the canonical
// `SP-NNN — Title`. An issue that merely mentions a spike at the start of its
// title (say, "SP-003 needs a human decision") is not that spike's issue, and
// matching it as one makes the script skip creating the real one.
const TITLE = /^(SP-\d{3})\s+[—–-]\s+\S/;

const issues = new Map();
for (const issue of JSON.parse(
  gh('issue', 'list', '--repo', REPO, '--state', 'all', '--limit', '300', '--json', 'number,title,state,labels'),
)) {
  const id = issue.title.match(TITLE)?.[1];
  if (id) issues.set(id, { ...issue, labels: issue.labels.map((l) => l.name) });
}

const isClosed = (id) => issues.get(id)?.state === 'CLOSED';

// ---- labels ----------------------------------------------------------------

const LABELS = [
  ['spike', '0E8A16', 'A unit of work from docs/plan/spikes'],
  ['ready', '0E8A16', 'Every dependency is closed — runnable now'],
  ['blocked', '5319E7', 'Waiting on a dependency'],
  ['in-progress', 'FBCA04', 'Claimed by a session — do not start'],
  ['kind:build', '1D76DB', 'Ships code — the routine may run it'],
  ['kind:research', 'D93F0B', 'Produces evidence and a recommendation — a human decides, the routine never runs it'],
  ['kind:decision', 'D93F0B', 'Needs a product decision before work can start — the routine never runs it'],
  ['needs-decision', 'D93F0B', 'Stopped on an open question — the PR must record the answer'],
  ['needs-review', 'FBCA04', 'Auto-merge withheld'],
  ['next', 'C5DEF5', 'docs/ROADMAP.md — Next'],
  ['later', 'C5DEF5', 'docs/ROADMAP.md — Later'],
  ['maintenance', 'C5DEF5', 'Keeps the repo and its automation working; not a roadmap item'],
];

if (!DRY && !CHECK) {
  for (const [name, color, desc] of LABELS) {
    try {
      gh('label', 'create', name, '--repo', REPO, '--color', color, ...(desc ? ['--description', desc] : []));
    } catch {
      try { gh('label', 'edit', name, '--repo', REPO, '--color', color); } catch { /* fine */ }
    }
  }
}

// ---- body ------------------------------------------------------------------

const body = (s) => `**Brief:** [\`${DIR}/${s.file}\`](https://github.com/${REPO}/blob/main/${DIR}/${s.file})

> The brief says *what to build* and is versioned with the code. This issue is
> *the state* — open means not done, closed means done, \`in-progress\` means a
> session has it. Neither repeats the other.

${s.goal}

| | |
|---|---|
| Roadmap bucket | \`${s.milestone}\` |
| Kind | \`${s.kind}\` |
| Estimate | ${s.estimate} |
| Depends on | ${s.dependsOn.length ? s.dependsOn.join(', ') : '—'} |

### For the runner

- Do not start this if it is closed, or labelled \`in-progress\`, or has an open linked PR.
- Claim it first: add \`in-progress\` and comment with the session link, before reading anything else.
${s.kind === 'build'
  ? '- Close this from the PR body with `Closes #<n>`. The scope guard checks that the link exists before auto-merging.'
  : '- **This one is not for the routine.** It is `kind: ' + s.kind + '`: comment with the options and trade-offs, add `needs-decision`, and stop. A person decides; `CLAUDE.md`\'s scope guardrail is why.'}

<sub>Synced from the briefs by \`scripts/sync-spikes-to-issues.mjs\`. Edit the brief, not this body.</sub>`;

// ---- sync ------------------------------------------------------------------

let created = 0, relabelled = 0, drift = 0;

for (const s of spikes) {
  const issue = issues.get(s.id);

  if (!issue) {
    say(`create ${s.id} — ${s.title}`);
    drift++;
    if (!DRY && !CHECK) {
      const labels = ['spike', `kind:${s.kind}`, s.milestone, s.dependsOn.every(isClosed) ? 'ready' : 'blocked'];
      gh('issue', 'create', '--repo', REPO, '--title', `${s.id} — ${s.title}`, '--body', body(s), '--label', labels.join(','));
    }
    created++;
    continue;
  }

  if (issue.state === 'CLOSED') {
    // a closed spike keeps no readiness label, and cannot still be claimed
    const stale = ['ready', 'blocked', 'in-progress'].filter((l) => issue.labels.includes(l));
    if (stale.length) {
      say(`#${issue.number} ${s.id}: closed, dropping ${stale.join(', ')}`);
      drift++;
      if (!DRY && !CHECK) gh('issue', 'edit', String(issue.number), '--repo', REPO, ...stale.flatMap((l) => ['--remove-label', l]));
      relabelled++;
    }
    continue;
  }

  const shouldBe = s.dependsOn.every(isClosed) ? 'ready' : 'blocked';
  const has = issue.labels.includes(shouldBe);
  const wrong = (shouldBe === 'ready' ? 'blocked' : 'ready');
  const hasWrong = issue.labels.includes(wrong);

  if (!has || hasWrong) {
    const why = shouldBe === 'blocked'
      ? `waiting on ${s.dependsOn.filter((d) => !isClosed(d)).join(', ')}`
      : 'every dependency closed';
    say(`#${issue.number} ${s.id}: ${shouldBe} (${why})`);
    drift++;
    if (!DRY && !CHECK) {
      const a = ['issue', 'edit', String(issue.number), '--repo', REPO, '--add-label', shouldBe];
      if (hasWrong) a.push('--remove-label', wrong);
      gh(...a);
    }
    relabelled++;
  }
}

// An issue with no brief is reported, not counted. It is the normal state of a
// spike filed from a branch: the filing session opens the issue the moment it
// runs this script, and the brief reaches `main` only when that PR merges. In
// between, no other PR can close the gap, so it must not fail anyone else's
// build. A deleted spike or a typo in a title still shows up here, on every run.
const orphans = [...issues.keys()].filter((id) => !spikes.some((s) => s.id === id));
for (const id of orphans) {
  console.warn(
    `warning: #${issues.get(id).number} ${id}: issue exists but no brief on this checkout — ` +
    'a spike filed from a branch that has not merged yet, a deleted spike, or a typo in the title',
  );
}

// ---- report ----------------------------------------------------------------

const open = spikes.filter((s) => issues.get(s.id) && issues.get(s.id).state === 'OPEN');
const ready = open.filter((s) => s.dependsOn.every(isClosed)).map((s) => s.id);

console.log(
  `\n${spikes.length} briefs · ${issues.size} issues · ${created} to create · ${relabelled} to relabel` +
  (orphans.length ? ` · ${orphans.length} without a brief here` : ''),
);
if (issues.size) console.log(`ready now: ${ready.length ? ready.join(', ') : 'none'}`);

// Bootstrap is not drift. Before the first sync run no brief has an issue, and
// failing CI for that would stall the routine on a state nobody caused. The
// test is "no brief is matched", not "the repo has no issues" — the repo holds
// Phase One's milestone issues, which are not spikes.
if (CHECK && !spikes.some((s) => issues.has(s.id))) {
  console.warn('\nno spike issues exist yet — run the `board` workflow by hand (workflow_dispatch) or `node scripts/sync-spikes-to-issues.mjs` to create them.');
  console.warn('not failing: you cannot drift from a board that has not been created.\n');
  process.exit(0);
}

if (CHECK && drift > 0) {
  console.error(`\n${drift} issue(s) out of step with the briefs. Run: node scripts/sync-spikes-to-issues.mjs\n`);
  process.exit(1);
}
if (DRY) console.log('nothing was written — drop --dry-run to apply');
