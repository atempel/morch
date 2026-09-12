#!/usr/bin/env node
/**
 * Validates the spike briefs as *content*: frontmatter shape, the dependency
 * DAG, and the sections a runnable brief must have. Zero dependencies, no
 * network — it says nothing about what is done.
 *
 * State is not in the brief. What is done is a closed GitHub issue; what is
 * taken is an open issue labelled `in-progress`. A brief that carries a
 * `status` key is asking for the same fact in two places, and this script
 * refuses it. See scripts/sync-spikes-to-issues.mjs.
 *
 *   node scripts/validate-spikes.mjs
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'docs/plan/spikes';
const KINDS = new Set(['build', 'research', 'decision']);
const ESTIMATES = new Set(['S', 'M', 'L']);
// The ROADMAP.md buckets. Phase One's M1–M10 were tracked as plain issues
// before the board existed and are closed; new work is filed against where it
// sits on the roadmap, not against a milestone number.
const MILESTONES = new Set(['next', 'later', 'maintenance']);
const REQUIRED = ['id', 'title', 'milestone', 'depends_on', 'estimate', 'kind'];
const SECTIONS = ['## Goal', '## Read first', '## Build exactly this', '## Acceptance criteria', '## Verify'];

const errors = [];
const warnings = [];
const fail = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

function parseFrontmatter(text, file) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) { fail(`${file}: no YAML frontmatter`); return null; }
  const out = {};
  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const i = line.indexOf(':');
    if (i === -1) { fail(`${file}: unparseable frontmatter line: ${line}`); continue; }
    const key = line.slice(0, i).trim();
    let value = line.slice(i + 1).replace(/\s+#.*$/, '').trim();
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    } else {
      value = value.replace(/^["']|["']$/g, '');
    }
    out[key] = value;
  }
  return out;
}

// ---- load ------------------------------------------------------------------

const files = readdirSync(DIR).filter((f) => /^SP-\d{3}.*\.md$/.test(f)).sort();
if (files.length === 0) fail(`${DIR}: no spike files found`);

const spikes = new Map();
for (const file of files) {
  const path = join(DIR, file);
  const text = readFileSync(path, 'utf8');
  const fm = parseFrontmatter(text, path);
  if (!fm) continue;

  for (const key of REQUIRED) if (!(key in fm)) fail(`${path}: missing frontmatter key '${key}'`);
  if ('status' in fm) {
    fail(`${path}: frontmatter carries 'status'. State lives in the GitHub issue — a closed issue is a done spike. Delete the key.`);
  }
  if (!/^SP-\d{3}$/.test(fm.id || '')) fail(`${path}: id '${fm.id}' is not SP-NNN`);
  if (!file.startsWith(fm.id)) fail(`${path}: filename does not start with its id '${fm.id}'`);
  if (fm.kind && !KINDS.has(fm.kind)) fail(`${path}: kind '${fm.kind}' not one of ${[...KINDS].join(', ')}`);
  if (fm.estimate && !ESTIMATES.has(fm.estimate)) fail(`${path}: estimate '${fm.estimate}' not S, M or L`);
  if (fm.milestone && !MILESTONES.has(fm.milestone)) fail(`${path}: milestone '${fm.milestone}' not one of ${[...MILESTONES].join(', ')} (docs/ROADMAP.md's buckets)`);
  if (!Array.isArray(fm.depends_on)) fm.depends_on = fm.depends_on ? [fm.depends_on] : [];

  for (const heading of SECTIONS) {
    if (!text.includes(heading)) fail(`${path}: missing required section '${heading}'`);
  }
  const criteria = (text.match(/^- \[[ xX]\] /gm) || []).length;
  if (criteria < 3) warn(`${path}: only ${criteria} acceptance criteria — briefs this thin tend to be ambiguous`);

  if (spikes.has(fm.id)) fail(`duplicate spike id ${fm.id}`);
  spikes.set(fm.id, { ...fm, file: path });
}

// ---- dependency graph ------------------------------------------------------

for (const [id, s] of spikes) {
  for (const dep of s.depends_on) {
    if (!spikes.has(dep)) fail(`${s.file}: depends_on '${dep}' does not exist`);
    if (dep === id) fail(`${s.file}: depends on itself`);
  }
}

const state = new Map();
function visit(id, trail) {
  if (state.get(id) === 'done') return;
  if (state.get(id) === 'open') { fail(`dependency cycle: ${[...trail, id].join(' -> ')}`); return; }
  state.set(id, 'open');
  for (const dep of spikes.get(id)?.depends_on ?? []) if (spikes.has(dep)) visit(dep, [...trail, id]);
  state.set(id, 'done');
}
for (const id of spikes.keys()) visit(id, []);

// ---- report ----------------------------------------------------------------

for (const w of warnings) console.warn(`warning: ${w}`);
if (errors.length) {
  console.error(`\n${errors.length} problem${errors.length === 1 ? '' : 's'} in the spike briefs:\n`);
  for (const e of errors) console.error(`  - ${e}`);
  console.error('');
  process.exit(1);
}

console.log(`spike briefs OK — ${spikes.size} spikes, acyclic, ${warnings.length} warning${warnings.length === 1 ? '' : 's'}`);
console.log('state lives in GitHub issues: gh issue list --label spike --state open');
