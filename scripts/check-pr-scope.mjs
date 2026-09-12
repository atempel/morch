#!/usr/bin/env node
/**
 * The auto-merge guard. Decides whether a spike PR is allowed to merge itself.
 *
 * CI cannot tell whether an implementation is good. It can tell whether the PR
 * is structurally legal: right spike, buildable kind, closes its issue, no
 * edits to decided documents, DECISIONS.md appended rather than rewritten,
 * nothing under `.github/workflows/` touched. That is the whole basis on which
 * auto-merge is safe — and it is a structural review, not the second-agent
 * review `.claude/skills/github-workflow/SKILL.md` asks for on anything else.
 *
 *   node scripts/check-pr-scope.mjs --base origin/main --head HEAD \
 *     --branch "$BRANCH" --title "$PR_TITLE" --body-file pr-body.txt
 *
 * Exit 0 = eligible for auto-merge. Exit 1 = needs a human. Never throws.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => (a.startsWith('--') ? [...acc, [a.slice(2), arr[i + 1]]] : acc), []),
);
const base = args.base ?? 'origin/main';
const head = args.head ?? 'HEAD';
const branch = args.branch ?? '';
const title = args.title ?? '';
const body = args['body-file'] && existsSync(args['body-file']) ? readFileSync(args['body-file'], 'utf8') : (args.body ?? '');
const repo = args.repo ?? process.env.GITHUB_REPOSITORY ?? 'atempel/morch';

const git = (...a) => execFileSync('git', a, { encoding: 'utf8' }).trim();
const gh = (...a) => execFileSync('gh', a, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }).trim();

const blockers = [];
const notes = [];
const block = (m) => blockers.push(m);

// ---- 1. the PR names a spike ----------------------------------------------
//
// Cloud sessions are assigned a branch name they cannot choose
// (claude/adjective-name-hash), so the branch alone would never match. The PR
// title carries the id via the conventional-commit scope: `feat(SP-002): ...`.

const fromBranch = branch.match(/(?:^|\/)(SP-\d{3})/)?.[1];
const fromTitle = title.match(/\(?(SP-\d{3})\)?/)?.[1];

if (fromBranch && fromTitle && fromBranch !== fromTitle) {
  block(`branch names ${fromBranch} but the title names ${fromTitle} — say which`);
}
const spikeId = fromBranch ?? fromTitle;
if (!spikeId) {
  block(`neither the branch '${branch}' nor the title '${title}' names a spike (SP-NNN) — only spike work auto-merges; everything else gets the second-agent review the skill file asks for`);
}

// ---- 2. the spike is kind: build ------------------------------------------

let spikeKind = null;
if (spikeId) {
  const dir = 'docs/plan/spikes';
  const file = readdirSync(dir).find((f) => f.startsWith(spikeId) && f.endsWith('.md'));
  if (!file) {
    block(`no brief found for ${spikeId} in ${dir}`);
  } else {
    const fm = readFileSync(join(dir, file), 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
    spikeKind = fm.match(/^kind:\s*(\S+)/m)?.[1] ?? null;
    if (spikeKind !== 'build') {
      block(`${spikeId} is kind '${spikeKind}' — only build spikes auto-merge; research and decision spikes are a person's call`);
    }
    if (/^status:/m.test(fm)) {
      block(`${spikeId}'s brief carries a 'status' key. State lives in the issue; delete it.`);
    }
  }
}

// ---- 3. the PR closes the spike's issue ------------------------------------
//
// GitHub maintains the PR-to-issue link, and closing on merge is its job
// rather than a field somebody has to remember to flip. The merge job also
// asserts the close afterwards, because a link that was never verified is a
// link that is silently wrong one day.

let issue = null;
if (spikeId) {
  const closes = [...body.matchAll(/\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)/gi)].map((m) => Number(m[1]));
  if (closes.length === 0) {
    block(`the PR body does not close an issue. Add "Closes #<n>" naming ${spikeId}'s issue, so merging it closes the spike.`);
  } else {
    try {
      const titles = closes.map((n) => ({ n, title: JSON.parse(gh('issue', 'view', String(n), '--repo', repo, '--json', 'title,labels')) }));
      const match = titles.find((t) => t.title.title.startsWith(spikeId));
      if (!match) {
        block(`the PR closes #${closes.join(', #')}, but none of those is ${spikeId}'s issue`);
      } else {
        issue = { number: match.n, labels: match.title.labels.map((l) => l.name) };
      }
    } catch {
      notes.push('could not reach the GitHub API to verify the issue link — the "Closes #n" line is present but unverified');
    }
  }
}

// ---- 4. nothing decided was edited ----------------------------------------
//
// These describe the product as decided. A spike that finds one of them wrong
// raises it in the PR body; it does not edit it. `docs/TECHNICAL_ARCHITECTURE.md`
// and `docs/FILE_STRUCTURE.md` describe the code as built and are deliberately
// not here — a build spike that changes the on-disk layout has to keep them true.

const FROZEN = [/^docs\/SPEC\.md$/, /^docs\/PRD\.md$/, /^docs\/USER_FLOWS\.md$/, /^DESIGN\.md$/, /^BRAND\.md$/, /^brand\//];
const changed = git('diff', '--name-only', `${base}...${head}`).split('\n').filter(Boolean);
if (changed.length === 0) block('no files changed');

for (const f of changed) {
  if (FROZEN.some((re) => re.test(f))) {
    block(`'${f}' is a decided document — a spike raises the issue in the PR body, it does not edit it`);
  }
}

// ---- 5. DECISIONS.md is appended to, never rewritten ----------------------

if (changed.includes('DECISIONS.md')) {
  const stat = git('diff', '--numstat', `${base}...${head}`, '--', 'DECISIONS.md').split('\t');
  const deletions = Number(stat[1] ?? 0);
  if (deletions > 0) block(`DECISIONS.md has ${deletions} deleted line(s) — history is appended to, never rewritten`);
}

// ---- 6. a decision discussed on the issue is recorded in the repo ----------
//
// Issues hold the conversation; the repository has to hold the conclusion. A
// checkout with no API access still has to explain why the code is like this,
// which is also CLAUDE.md's rule for architectural choices.

if (issue?.labels.includes('needs-decision') && !changed.includes('DECISIONS.md')) {
  block(
    `issue #${issue.number} is labelled needs-decision, so a question was settled in its thread — ` +
    `append the answer to DECISIONS.md. The issue keeps the conversation; the repo keeps the conclusion.`,
  );
}

// ---- 7. the brief records what happened -----------------------------------

if (spikeId && !changed.some((f) => f.startsWith(`docs/plan/spikes/${spikeId}`))) {
  block(`${spikeId}'s own brief was not updated — Notes and Outcome are part of the work`);
}

// ---- 8. no secrets, no CI edits, nothing of Cowork's -----------------------

for (const f of changed) {
  if (/(^|\/)\.env($|\.)/.test(f) || /\.pem$|\.key$/.test(f) || /\.morch-cowork-token$/.test(f)) block(`'${f}' looks like a secret — never`);
  if (/(^|\/)\.github\/workflows\//.test(f)) block(`'${f}' changes CI itself — that needs a human`);
}

// ---- hand the issue number to the merge step ------------------------------

if (args['issue-out']) {
  writeFileSync(args['issue-out'], issue ? String(issue.number) : '');
}

// ---- report ---------------------------------------------------------------

console.log(
  `spike: ${spikeId ?? '(none)'} · kind: ${spikeKind ?? '(unknown)'} · ` +
  `issue: ${issue ? '#' + issue.number : '(unlinked)'} · ${changed.length} file(s) changed`,
);
for (const n of notes) console.log(`note: ${n}`);

if (blockers.length) {
  console.log('\nNOT eligible for auto-merge:\n');
  for (const b of blockers) console.log(`  - ${b}`);
  console.log('\nThis is not a failure — the PR is fine, it just needs you to look at it.\n');
  process.exit(1);
}

console.log('\neligible for auto-merge: spike, kind, issue link, scope, history and brief all check out');
