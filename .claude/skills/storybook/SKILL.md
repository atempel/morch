---
name: storybook
description: Use when writing or changing anything in src/dashboard/ or src/onboarding/,
  or when writing/updating a *.stories.tsx file — covers running Storybook, the
  co-located story convention, mocking Tauri APIs, and the Storybook MCP toolset.
---

## Running it

`npm run storybook` starts the dev server on port 6006 (`npm run build-storybook` for a
static build, used by CI). The MCP server (see below) is served *by* this dev server, at
`http://localhost:6006/mcp` — it has to be running for MCP tool calls to work.

## Story file convention

Stories are co-located: `Foo.tsx` gets `Foo.stories.tsx` next to it, not centralized under
a parallel `src/stories/` tree. This matches how `src/dashboard`/`src/onboarding` are
already organized by feature, not by file type.

New/changed story files get `tags: ["ai-generated"]` in their `meta` while unverified add
`"needs-work"` too (`tags: ["ai-generated", "needs-work"]`), and drop `"needs-work"` once
`npx vitest --project storybook run` confirms the file passes. Don't leave a file tagged
`needs-work` and call the UI work finished — either fix it or flag it explicitly to a
human.

## Mocking Tauri

There's no real Tauri IPC bridge in a browser-only Storybook preview. `Dashboard.tsx` and
`Onboarding.tsx` are the two components that call Tauri APIs directly (`invoke` from
`@tauri-apps/api/core`, `listen` from `@tauri-apps/api/event`, `open` from
`@tauri-apps/plugin-dialog`) — everything else in `src/dashboard/`/`src/onboarding/` is
plain presentational and takes props, no mocking needed.

`.storybook/main.ts`'s `viteFinal` aliases those three imports to canned-response stubs
under `.storybook/mocks/`, with zero changes to production component code (see
`docs/STORYBOOK_PLAN.md` Step 2 for why this approach was chosen over extracting an
`invoke` wrapper module). If you add a new Tauri command call to a component, add its
canned response to `.storybook/mocks/tauri-core.ts`'s `responses` map — an unmocked
command throws immediately with a clear message rather than hanging silently.

## Theme

Dark is the default; `data-theme="light"` on `<html>` is the override
(`src/styles/tokens.css`). The preview's toolbar has a Theme control that toggles this the
same way M8's real theme toggle does — use it to check both modes, don't assume dark-only
is sufficient.

## Storybook MCP toolset

`@storybook/addon-mcp` is installed and configured (`.mcp.json` registers it as a
project-scoped server). With the dev server running, reach for:

- `list-all-documentation` / `get-documentation` — check for an existing story before
  re-deriving a component's prop shape from scratch.
- `get-documentation-for-story` — pull a specific story's full code + docs.
- `get-storybook-story-instructions` — guidance when writing a new story.
- `preview-stories` — render a story preview without leaving the chat.
- `get-changed-stories` — see what stories are affected by a diff.
- `run-story-tests` — run tests + accessibility checks against a story; run this before
  considering UI work done, in addition to (not instead of) `tauri dev` verification for
  full end-to-end flows.

This is a **preview** Storybook feature, React+Vite-only — matches this project's stack,
but the API may still change before GA.
