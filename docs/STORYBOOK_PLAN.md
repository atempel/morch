# Storybook Adoption Plan

Status: proposed, not yet implemented. This is a plan to review, not a done deal — flag
anything that should change before work starts.

## Why

M8 (dashboard UI rework) is currently verified the only way available: run `tauri dev`,
click around, screenshot it (see DECISIONS.md, 2026-07-11 "Figma is now the visual source
of truth"). That works but is slow to iterate on and doesn't isolate components from the
Tauri runtime or from real `.morch/config.json` state. Storybook gives us:

- Fast, isolated iteration on `src/dashboard/*` and `src/onboarding/*` components without
  booting the Tauri webview or a real workspace.
- A place to visually diff against Figma per-component instead of only at the full-screen
  level.
- Light/dark mode and edge-case states (empty lists, long instruction text, flagged files)
  as addressable, revisitable fixtures instead of transient manual test setups.

This is dev tooling, not a product feature — it doesn't touch Phase One scope
(CLAUDE.md's instruction-management guardrail is unaffected). It does earn two
`DECISIONS.md` entries once actually implemented rather than just planned: the
Tauri-mocking approach (Step 2) and adding the Storybook MCP server (Step 6) — both are
tooling/architecture choices per CLAUDE.md's logging rule, just not product-scope ones.

## Why it's not plug-and-play

Three things make this more than `npx storybook init`:

1. **Two components call `invoke()` directly.** `src/dashboard/Dashboard.tsx` (lines 58,
   106) and `src/onboarding/Onboarding.tsx` (line 92) import `invoke` from
   `@tauri-apps/api/core` and call real Tauri commands (`watch_managed_files`,
   `write_config`). Storybook runs in a plain browser context — there is no Tauri IPC
   bridge, so these calls will hang or throw. They need mocking, not just fixture props.
2. **Theming is a document-level attribute, not a prop.** Per `src/styles/tokens.css`,
   dark is the default `:root` and light is a `:root[data-theme="light"]` override,
   toggled by setting `data-theme` on `<html>` (M8). Storybook needs a global toolbar
   control that does the same thing, or stories will only ever render in dark mode.
3. **No component-scoped styles.** Everything reads from `global.css`/`tokens.css`
   custom properties, imported once at the app root (`src/main.tsx`). There's no
   CSS-modules/Tailwind boundary, so Storybook's preview needs to import the same global
   stylesheet, or components will render unstyled.

None of these are hard, but skipping any one of them gives you a Storybook that "works"
and shows you the wrong thing (unstyled, dark-only, or crashing on mount).

## Plan

### Step 1 — Install with the Vite builder

The project already runs on Vite (`vite.config.ts`, Vite 7). Use
`@storybook/react-vite`, not the webpack builder — it reuses the existing Vite
config/plugins (`@vitejs/plugin-react`) instead of introducing a second bundler
pipeline.

```
npx storybook@latest init --builder vite
```

Expect this to add `.storybook/main.ts`, `.storybook/preview.ts`, a `storybook`/
`build-storybook` npm script, and `@storybook/react-vite` + friends to
`devDependencies`. Verify it detects Vite automatically rather than defaulting to
webpack — if not, pass the builder flag explicitly and pin versions in
`package-lock.json` per the repo's "lockfiles are committed" convention
(`.claude/skills/github-workflow/SKILL.md`).

### Step 2 — Decide and log the Tauri-mocking approach

This is the one part of this plan that's an actual architectural choice, so it gets a
`DECISIONS.md` entry when we lock it in (per CLAUDE.md's rule on framework/tooling
decisions). Two realistic options:

- **(a) Vite alias swap.** In `.storybook/main.ts`'s `viteFinal`, alias
  `@tauri-apps/api/core` to a local mock module (e.g. `.storybook/mocks/tauri-core.ts`)
  that exports a stub `invoke()` — logs the call and returns canned data per command
  name. Zero changes to production component code.
- **(b) Extract an `invoke` wrapper.** Add `src/lib/tauriApi.ts` re-exporting `invoke`,
  have `Dashboard.tsx`/`Onboarding.tsx` import from there instead of
  `@tauri-apps/api/core` directly, then alias/mock that one module in Storybook. Slightly
  more indirection in production code, but makes the mock boundary explicit and
  greppable, and gives us one place to add e.g. a dev-mode console warning if `invoke` is
  ever called outside a real Tauri context.

Recommendation: **(a)**, since it touches zero production code and the two call sites are
few enough (3 call sites, 2 files) that a wrapper module isn't earning its keep yet.
Revisit (b) if `invoke` call sites grow. Either way, the stub needs per-command canned
responses for at least `write_config` and `watch_managed_files` (return shapes per
`src-tauri`'s command signatures / `src/types.ts`).

### Step 3 — Global preview setup

In `.storybook/preview.ts`:

- Import `src/styles/global.css` (which itself imports `tokens.css`) so components
  render with real tokens, not browser defaults.
- Add a toolbar global (`globalTypes` + a decorator) that toggles `data-theme` on the
  story root between unset (dark, default) and `"light"` — mirroring exactly the
  mechanism M8 already uses, not a parallel one.
- Set a default viewport/background close to the app's actual canvas (`--background`
  token) so stories aren't floating on Storybook's default white.

### Step 4 — Stories for presentational components first

Start with components that take plain props and don't call `invoke` — these are free
wins with no mocking needed:

- `src/dashboard/InstructionRow.tsx`
- `src/dashboard/WarningCard.tsx`
- `src/dashboard/Drawer.tsx`, `DisabledArchiveDrawer.tsx`, `IgnoredFilesDrawer.tsx`
- `src/dashboard/ListView.tsx`, `BoardView.tsx` (with mock `Instruction[]` fixtures built
  from `src/types.ts` shapes — include an empty-list state and a long-text/flagged-file
  state per DESIGN.md's documented edge cases)
- `src/onboarding/ChecklistStep.tsx`, `WorkspaceStep.tsx`

Each gets light + dark variants via the Step 3 toolbar control, checked by eye against
the Figma file referenced in DECISIONS.md (2026-07-11).

### Step 5 — Stories for the two `invoke`-calling components

`Dashboard.tsx` and `Onboarding.tsx` (the full-screen containers) using the Step 2 mock.
These are lower priority than Step 4 — they're closer to "pages" than reusable
components, so the marginal isolation value is lower, but they're what actually
exercises the mocking setup end-to-end.

### Step 6 — Storybook MCP server, so agents (Claude Code included) can use it

Per Storybook's AI setup docs (`storybook.js.org/docs/ai/setup`, `/docs/ai/mcp/overview`,
`/docs/ai/mcp/api` — fetched 2026-07-11; this is a **preview** feature and React+Vite-only,
which matches this project's stack), Storybook ships an MCP server that lets an agent
read component docs, generate/update stories, and run story tests against a live
Storybook — instead of guessing at prop shapes or skipping story-writing entirely. This
directly answers "I still did not configure any MCP server": there is none in this repo
yet (`.mcp.json` doesn't exist), and this is the one worth adding first since it's
purpose-built for exactly the kind of UI work M8 involved.

1. **Install the addon**: `npx storybook add @storybook/addon-mcp` (adds it to
   `.storybook/main.ts`'s `addons` array). It exposes three toggleable toolsets, all on
   by default:

   ```ts
   {
     name: "@storybook/addon-mcp",
     options: {
       toolsets: { dev: true, docs: true, test: true },
     },
   }
   ```

   - **dev**: `get-changed-stories`, `get-storybook-story-instructions`, `preview-stories`
   - **docs**: `list-all-documentation`, `get-documentation`,
     `get-documentation-for-story`
   - **test**: `run-story-tests` (runs tests + accessibility checks against a story)

2. **Prerequisite**: the MCP server is served *by the running Storybook dev server*
   (`http://localhost:6006/mcp` by default), not a standalone process — `npm run
   storybook` must be up for an agent to actually call these tools.

3. **Register it as a project-scoped MCP server** so every agent working in this repo
   picks it up automatically, not just whoever runs the one-off `init` flow. Add a
   `.mcp.json` at the repo root (currently absent):

   ```json
   {
     "mcpServers": {
       "storybook": {
         "type": "http",
         "url": "http://localhost:6006/mcp"
       }
     }
   }
   ```

   `.mcp.json` is meant to be committed (unlike `.claude/settings.local.json`) — same
   "shared project configuration, not machine-specific state" logic the
   `github-workflow` skill already applies to `.claude/settings.json`.

4. **Note the caveats explicitly** rather than silently relying on a preview feature:
   React+Vite-only support (fine here), API may change before GA, and stories the addon
   auto-generates are tagged `ai-generated` — those need human review before the tag is
   removed, they shouldn't be treated as done just because they build.

### Step 7 — Update agent-facing markdown

This is the other half of "agents in this directory can work properly with
Storybook" — the MCP server being reachable doesn't mean an agent knows *when* to reach
for it. Three files need concrete additions, not just a mention that Storybook exists:

**`CLAUDE.md`** — add one line under "Working on This Project" (next to the existing
`.claude/skills/github-workflow/SKILL.md` pointer):

```
- UI component work (`src/dashboard/`, `src/onboarding/`): see
  `.claude/skills/storybook/SKILL.md` before adding or changing a component.
```

**`AGENTS.md`** — add a new subsection under "Agent Responsibilities by Area", alongside
the existing Parsing Engine / File Watching / Disabled Archive ones:

```
### UI Components (Storybook)
- Before building or changing anything in `src/dashboard/` or `src/onboarding/`, check
  `list-all-documentation` / `get-documentation` (Storybook MCP) for an existing story
  covering the component — don't re-derive prop shapes from scratch if a story already
  documents them.
- Any new or changed presentational component gets a co-located `*.stories.tsx` (see
  `.claude/skills/storybook/SKILL.md` for the mocking convention for components that call
  `invoke`).
- Run `run-story-tests` (Storybook MCP) before considering UI work done — this is in
  addition to, not instead of, `tauri dev` verification for full-flow changes.
- Stories the MCP tooling auto-generates carry an `ai-generated` tag — review them and
  remove the tag once a human has actually checked the story against Figma; don't leave
  it tagged and call the work finished.
```

**New `.claude/skills/storybook/SKILL.md`** — a skill file in the same spirit as
`github-workflow/SKILL.md`, covering: how to run Storybook (`npm run storybook`), the
co-located `*.stories.tsx` convention (Step 4's open question, once resolved), the
`@tauri-apps/api/core` mocking approach locked in at Step 2, and a short reference for
the MCP toolset (which tool to reach for: `get-storybook-story-instructions` when writing
a new story, `preview-stories` to check rendering without leaving the chat,
`run-story-tests` before marking UI work complete). This is what `CLAUDE.md`'s new line
and `AGENTS.md`'s new subsection both point at, so it needs to exist before those two
references are live — write it as part of the same commit as Step 1's install, not
deferred to later.

### Step 8 — CI

`.github/workflows/ci.yml`'s `frontend` job currently runs `npx tsc --noEmit`. Add a
`npx storybook build` (or a dedicated job) so a story that fails to build/typecheck
breaks CI the same way a broken component would — catches a bad mock or a story that
drifts from a component's real prop shape.

### Step 9 — Docs

- `README.md` gets a one-line addition to its "Development" section: how to run
  `npm run storybook`.
- `DECISIONS.md` gets two entries once implemented, not speculatively (per the repo's
  pattern of logging decisions alongside the commit that implements them): the Step 2
  Tauri-mocking approach, and adding the Storybook MCP server / `@storybook/addon-mcp` as
  a new piece of the dev-tooling stack (Step 6).

## Explicitly out of scope for this pass

- **Visual regression / Chromatic or similar.** Useful eventually, but it's a paid
  service decision and a second thing to keep green in CI — not worth bundling into the
  initial adoption. Revisit once there's enough story coverage to make regressions worth
  catching automatically.
- **Interaction/test-runner addons** (`@storybook/addon-interactions`, play functions).
  Nothing in Phase One's UI has complex interaction sequences worth scripting yet; plain
  visual stories cover the current need.
- **Onboarding's not-yet-built "Review & Confirm" screen** (DECISIONS.md, 2026-07-11,
  "Not done in this pass"). Story it once it exists, not before.

## Open question

Should Storybook stories live next to their components (`InstructionRow.stories.tsx`
beside `InstructionRow.tsx`) or under a parallel `src/stories/` tree? Recommend
co-located `*.stories.tsx` files — matches how `src/dashboard`/`src/onboarding` are
already organized by feature, not by file type, and keeps a component and its story
moving together in one diff. Flag if you'd rather centralize them.
