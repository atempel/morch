# DECISIONS.md — Morch

Log of key product and technical decisions, with rationale, in chronological order.

---

## 2026-07-09 — Phase One scope limited to instructions only

**Decision**: The first version manages instructions exclusively. Skills, context blocks, and other workspace elements are explicitly out of scope.

**Rationale**: The core problem is workspace instruction bloat becoming unmanageable. Narrowing scope means shipping something useful faster and learning real usage patterns before expanding.

---

## 2026-07-09 — No forced workspace structure

**Decision**: The app will not require users to reorganize their existing workspace. It scans and recommends, but users retain full control over what's parsed, ignored, or manually added.

**Rationale**: Forcing structure creates adoption friction and risks breaking existing setups (e.g., existing HoldIt or Hub de IA para Designers workspace conventions).

---

## 2026-07-09 — Flexible, line-based instruction parsing

**Decision**: Each line in a managed file is treated as a potential instruction unit rather than requiring a specific format (headings, code blocks, comment markers, etc.).

**Rationale**: There's no established best practice yet for structuring instructions in files like CLAUDE.md/AGENTS.md. Starting flexible and gathering usage data is preferred over guessing at a schema upfront. This is an open research question (see `docs/SPEC.md` §8).

---

## 2026-07-09 — Disabled instructions are archived, not deleted

**Decision**: Toggling an instruction off removes it from the active file and moves it to a disabled archive that the AI cannot read but the user can still access.

**Rationale**: Preserves user work and enables reversibility, while guaranteeing the AI agent never interprets disabled instructions.

---

## 2026-07-09 — Archive structure mirrors active file structure

**Decision**: Disabled instructions are stored in a `.morch-disabled/` directory that mirrors the active workspace layout (e.g., `CLAUDE.md` → `.morch-disabled/CLAUDE.md`), rather than a single flat `DISABLED.md`. Only the folder name carries the product branding — files inside keep their original, clean names.

**Rationale**: Scales better as workspaces grow; keeps disabled content organized by source file.

---

## 2026-07-09 — Bidirectional real-time sync required

**Decision**: The app must sync in both directions: UI changes write to the filesystem immediately, and external filesystem changes (including edits made by Claude Code itself) are reflected in the UI immediately.

**Rationale**: Users like Alexandre actively use Claude Code to edit their own markdown instruction files. A one-way sync (UI → filesystem only) would quickly go stale and become untrustworthy.

---

## 2026-07-09 — Desktop app format

**Decision**: Desktop app (not web-based).

**Rationale**: Direct filesystem access is cleaner for real-time file read/write and watching.

**Status**: Resolved — see below.

---

## 2026-07-09 — Framework locked in: Tauri v2 + SQLite

**Decision**: Build on Tauri v2 with SQLite for local storage, reusing the stack pattern from the "A Lista Infinita" / GamerDash project.

**Rationale**: Alexandre already has working Tauri v2 + SQLite experience, which removes ramp-up time. Tauri also fits this app's requirements better than Electron on the merits: ~5x lower RAM use and much smaller installers for a small utility app, a capability-based security model that maps well to the "AI must never read the disabled archive" requirement, and native filesystem/file-watching access without bundling a full Chromium runtime. Electron's larger ecosystem isn't needed here since the app's surface (file scan, parse, watch, toggle) doesn't lean on Node-specific packages.

**Status**: Locked in.

---

## 2026-07-09 — Project renamed to Morch

**Decision**: The project is renamed from "Markdown Orchestrator" to "Morch" (a contraction of the two words) across all docs, code, and product surfaces. The disabled-archive naming convention is finalized as `.morch-disabled/` — renaming the folder only, so files inside keep their original clean names (e.g. `.morch-disabled/CLAUDE.md`, not `.morch-disabled/CLAUDE.md.morch-disabled`).

**Rationale**: Shorter, more distinctive product name. The archive folder name doubles as a visible, scannable marker that a directory belongs to Morch's disabled-instruction system, without polluting individual filenames.

**Status**: Locked in.

---

## 2026-07-09 — Visual identity locked to the Nord color scheme

**Decision**: Morch's UI is built on Nord (nordtheme.com) — Polar Night for structure, Snow Storm for text, Frost for interaction, Aurora reserved for genuine status meaning only (never decorative). Documented in `DESIGN.md`, validated with `npx @google/design.md lint` (0 errors). Typography pairs Inter (UI) with a monospace stack (anything quoting the source markdown verbatim — paths, line numbers, aliases).

**Rationale**: Nord was built for exactly Morch's use case — long, low-stimulation reading sessions over dense, code-adjacent content. Its "flat, minimal, eye-comfortable" philosophy also directly supports Core Principle #2 (AI as tool, not entity) by keeping the interface calm and instrument-panel-like rather than expressive or personified. One known trade-off: Nord's `n11` red measures below WCAG AA text contrast against every Polar Night background — documented in `DESIGN.md` with the mitigation (pair with icon + label, never rely on color alone).

**Status**: Locked in.

---

## 2026-07-09 — Dark mode: full neutral scale rebalanced darker, typography moved to Noto

**Decision**: Dark mode's entire structural neutral scale (`background`, `surface`, `surface-raised`, `surface-overlay`/`border`, `border-strong`) is now custom-darkened, not just the page background — each step derived from Nord's own Polar Night hue/saturation but pushed to a lower, proportionally-spaced lightness (`background` `#12141A`, `surface` `#1C1F27`, `surface-raised` `#252A34`, `surface-overlay` `#2F3542`, `border-strong` `#404859`). `text-muted` moved off stock `n3` (which fails contrast against the new surfaces) to a custom `#828EA6`, tuned to hold ≥4.5:1 against every surface tier. Typography moved from Inter/JetBrains Mono to Noto Sans/Noto Sans Mono (Google Fonts).

**Rationale**: Alexandre found the first darker-background pass (canvas only, everything else stock Nord) inconsistent — a near-black floor with merely-dark furniture on top. Rebalancing the whole scale keeps the elevation ladder feeling like one deliberate dark room. Explicitly **not** darkened: `text-primary`/`text-secondary` and every Frost/Aurora accent (`primary`, `secondary`, `success`, `warning`, `danger`) — these are the colors doing the actual communicating, and the instruction was clear that highlight/accent colors and contrast must not be compromised for the sake of a darker theme.

**Status**: Locked in. Documented in `DESIGN.md`, relinted after each change (0 errors throughout).

---

## 2026-07-09 — Flagged files are never a permanent dead end; managed-file list is editable anytime

**Decision**: Three interaction gaps fixed. (1) The toolbar (search/stats/view switch) now has a persistent hairline separator from the content below it in both List and Board view — the filter row was visually fusing with the first row of instructions. (2) The disabled-archive drawer caps at a fixed max-height with its own internal scroll instead of growing the window unbounded. (3) The log-style-file warning (e.g. DECISIONS.md) is no longer a permanent blocking card — it now carries a "Manage anyway" action that reveals the file's instructions as normal toggleable rows, and the managed-file list itself is editable from the dashboard at any time (a persistent "add file" control in the List view sidebar and at the end of the Board view column row), not just during onboarding.

**Rationale**: Alexandre caught these using the interactive prototype — a warning with no escape hatch and a file list only editable during a one-time wizard both undermine "no forced structure" (Core Principle #1) and the general product promise that nothing the app does is a one-way door.

**Status**: Locked in. `DESIGN.md` updated (Layout, Onboarding, Components sections), relinted clean (0 errors).

---

## 2026-07-09 — Ignore-file capability, separate from the disabled-instruction archive

**Decision**: Users can ignore an entire managed file (any file, not just flagged ones) so it disappears from the sidebar/Board view, keeping the main list clean. Ignored files move to a new **ignored files** drawer — same collapsed/capped-scroll visual pattern as the disabled-instruction archive, but a distinct drawer, never merged with it. Backed by the `enabled` flag already present in `FILE_STRUCTURE.md`'s `managedFiles` config schema — no schema change needed, just a UI surface for a flag that existed but wasn't exposed.

**Rationale**: Alexandre wanted DECISIONS.md (and any file) removable from the main dashboard view without losing the ability to restore it later — distinct from the disabled-instruction archive, which exists specifically so the AI never sees disabled content (Core Principle #3). Ignoring a file doesn't touch the file on disk or its AI-visibility at all; it's purely a dashboard-declutter action. Keeping the two archives visually and conceptually separate avoids conflating "the AI can't see this" with "I don't want to see this in my dashboard" — different guarantees, shouldn't look like the same feature.

**Status**: Locked in. Documented in `DESIGN.md` (Layout, Components) and `FILE_STRUCTURE.md` (§6.3), relinted clean (0 errors).

---

## 2026-07-10 — `n0`/`n6` retuned to match the finalized logo

**Decision**: `DESIGN.md`'s `n0` token changes from stock Nord `#2E3440` to `#363A46`, and `n6` changes from stock Nord `#ECEFF4` to `#ECEDF1` — the exact ink and paper colors used in the finalized Morch wordmark + octopus symbol lockup. All other Nord tokens (`n1`–`n15`) and the custom `surface-dark` family (derived from the *original* `n0`–`n3` before this change, per the 2026-07-09 rebalancing decision above) are unaffected and not retroactively re-derived.

**Rationale**: Alexandre explicitly chose to make the logo the source of truth for these two tokens rather than adjusting the logo to fit stock Nord hex — offered as an explicit choice between (a) logo-only tokens with zero ripple into the product, (b) redefining the core ink/paper tokens across the whole app, or (c) snapping the logo to stock Nord instead; (b) was chosen. `n0` and `n6` were the correct tokens to change (not, say, `n1`) because their current live roles — `n0` as light-mode `text-primary`, `n6` as dark-mode `text-primary` and light-mode `background` — are exactly the ink/paper roles the logo's two colors already play.

**Known trade-offs, recalculated at decision time**:
- `n11` (danger red) text contrast against Polar Night backgrounds shifts from ~2.5–3.1:1 to ~2.5–2.8:1 (still fails AA normal-text, as already documented — no change to the existing icon+label mitigation).
- `primary-text-light` vs `n6` shifts from 5.07:1 to 4.99:1 — still clears the 4.5:1 AA floor.
- `n0` vs `n8` shifts from 6.24:1 to 5.67:1 — still comfortably AA-compliant. (Note `on-primary` etc. now point to `canvas-dark`, not `n0`, per the 2026-07-09 rebalancing — this pairing isn't actually load-bearing in the current token graph, checked for completeness only.)
- `canvas-dark` (`#12141A`) does *not* change, and is no longer exactly "the same hue/saturation as Polar Night, pushed darker" now that `n0` itself has shifted away from Nord's blue-navy toward a more neutral charcoal — a minor, accepted mismatch, not corrected here since only `n0`/`n6` were in scope for this decision.
- Also fixed in the same pass: the Light mode mapping table in `DESIGN.md` still listed dark-mode `surface`/`surface-raised` as stock `n0`/`n1`, left stale by the 2026-07-09 rebalancing decision — corrected to `surface-dark`/`surface-raised-dark`, and one Do's/Don'ts bullet had the same stale reference, also corrected.

**Status**: Locked in.

---

## 2026-07-10 — Phase One persistence: JSON config only, no SQLite

**Decision**: `.morch/config.json` (schema per `FILE_STRUCTURE.md` §6.3: `managedFiles`, `instructionAliases`, `disabledArchivePath`) is the sole persistence layer for Phase One. SQLite is not wired in at scaffold time despite being part of the locked framework choice.

**Rationale**: This was the open question carried in `docs/ROADMAP.md` item 1 since the framework decision — whether SQLite fully replaces the JSON config or the two coexist. Phase One's actual data (a handful of managed files, their instructions, aliases) is small, low-write-frequency, and benefits from being human-inspectable — a user should be able to open `config.json` and understand exactly what Morch is tracking, which fits Core Principle #2's "AI as tool, never opaque" spirit better than an opaque binary DB file. No Phase One feature (instruction history, versioning, large datasets) actually needs a database. Introducing SQLite now would add migration/schema-versioning overhead for no corresponding benefit. This does not reopen the Tauri v2 + SQLite framework decision (2026-07-09) — SQLite remains available in the stack and is the expected choice once Phase Two needs instruction history or versioning; it's simply unused at scaffold time.

**Status**: Locked in. Logged as part of `docs/IMPLEMENTATION_PLAN.md`.

---

## 2026-07-10 — App config directory renamed `.orchestrator/` → `.morch/`

**Decision**: The app's own configuration directory is renamed from `.orchestrator/` to `.morch/`, matching the `.morch-disabled/` branding convention already in use for the archive.

**Rationale**: This was flagged as a low-priority open item in `docs/ROADMAP.md` item 1. Since no code or users exist yet, there's no migration cost to aligning now rather than after shipping — waiting would only turn a free rename into a breaking change later.

**Status**: Locked in. `docs/FILE_STRUCTURE.md`'s example tree and config path should be updated to `.morch/config.json` when scaffolding begins.

---

## 2026-07-10 — Restoring a disabled instruction does not reinsert it at its original line position

**Decision**: `enable_instruction` (M5, Disabled Archive Manager) appends a restored line back onto the end of the active file rather than reinserting it at the line number it was removed from. The archive file itself (`.morch-disabled/{file}`) is a plain, append-only mirror of disabled line content — no positional metadata is embedded in it.

**Rationale**: `docs/IMPLEMENTATION_PLAN.md`'s M5 acceptance bar only requires "zero data loss (byte-for-byte line content preserved)" on restore — it doesn't require positional fidelity, and neither `docs/FILE_STRUCTURE.md` nor `docs/USER_FLOWS.md` §4.4 specify one. Preserving position would require embedding line-number metadata into the archive file (e.g. an inline marker before each line), which risks reading as forced structure injected into the user's own content (Core Principle #1) for a guarantee nothing has actually asked for yet. Content-only round-tripping is the simpler, sufficient implementation for Phase One.

**Status**: Locked in for Phase One. Revisit if real usage shows position-preserving restore matters (e.g. a restored instruction landing under the wrong heading is confusing in practice) — flagged here rather than silently decided so it's easy to reopen.

---

## 2026-07-11 — File watcher: `notify` crate, 300ms debounce, hash-based (not timestamp-based) self-write detection

**Decision**: M6's file watcher uses the `notify` crate (v8.2.0) directly rather than a debouncer crate — debouncing is implemented by hand as a background thread that batches events per-path over a 300ms window. Loop prevention (TECHNICAL_ARCHITECTURE.md §5.5) compares a hash of the file's content after the debounce window against a hash recorded by the app's own write helpers (`archive.rs`'s `write_lines`/`append_line`) at write time — not file modification timestamps, despite §5.5 listing timestamps as one option.

**Rationale**: Content hashing is more robust than mtime comparison here: mtime resolution and clock behavior vary across filesystems/platforms, and a timestamp match doesn't actually prove the content is the app's own write (an external tool could write in the same tick). Comparing hashes of actual content is a direct check of the thing that matters — "is this exactly what we just wrote" — with no platform-dependent timing assumptions. Hand-rolling the debounce (rather than pulling in `notify-debouncer-mini`/`-full`) kept the dependency surface small and made the self-write-suppression logic (which has to run inside the debounce flush, not just on raw events) straightforward to write and unit-test directly, including against real OS-level inotify events on temp files.

The registry entry is consumed (removed), not just checked, on a match — a self-write suppresses exactly one subsequent debounce flush with identical content. This matters because a pure "check without consuming" design would permanently swallow any later, genuinely independent external edit that happens to cycle content back to a previously-recorded hash (e.g. a `git checkout` or an editor's "revert to saved" landing back on content the app itself wrote earlier in the session) — caught in review before merging M6.

Each watched file's *parent directory* is watched (`RecursiveMode::NonRecursive`), not the file itself, with events filtered down to the managed-file set. This was also a review fix: watching a file path directly only reliably catches in-place writes — many editors (and Claude Code) save via "write a temp file, then rename it over the original," which orphaned a direct file watch after the first such rename in local testing (inotify's per-inode watch doesn't follow the rename). Directory watches survive rename-over-target indefinitely. A path whose parent directory doesn't exist yet is skipped (logged, not fatal) rather than aborting the whole batch via `?` — so one missing/not-yet-created managed file doesn't take down watching for every other one.

Only *enabled* managed files are watched (the frontend passes `managedFiles.filter(f => f.enabled).map(f => f.path)` to `watch_managed_files`), not the disabled-archive mirror — the watcher's job is keeping the AI-facing active files in sync with the dashboard; nothing currently reads the archive back out except `enable_instruction` itself.

**Status**: Locked in for Phase One. The 300ms debounce window is a starting value (PRD.md's target is "under 1 second, debounce window included") — revisit if real usage shows it's too slow or causes missed rapid-succession edits.

---

## 2026-07-11 — Instruction Manager: disabled instructions get a new position-derived id on toggle; aliases carry over in-memory, not by id

**Decision**: M7's `InstructionManager` builds its in-memory list by parsing each managed file's active content (ids formatted `line_{n}_{file}`, per M4's existing convention) plus its `.morch-disabled/` mirror (ids formatted the same way but with the archive-relative path as `file`, e.g. `line_2_.morch-disabled/CLAUDE.md` — naturally unique against active ids without a separate prefix scheme). Toggling an instruction reassigns its id to match its new location's convention; the `alias` and `content` fields are carried over onto the same in-memory `Instruction` slot across that reassignment, but `.morch/config.json`'s `instructionAliases` map (keyed by id) is fully rebuilt from current in-memory state on every `set_alias` call rather than patched — so a stale key never lingers under an id an instruction no longer holds.

**Rationale**: `docs/FILE_STRUCTURE.md` §6.4 describes an instruction's `id`/`lineNumber` as reflecting its "original line number," but M5 (2026-07-10) already decided restore doesn't preserve original position, and the archive mirror itself carries no position metadata — so a disabled instruction's true original position is genuinely unrecoverable once it's been archived, not just deferred. Rebuilding the alias map fresh from live state on every write (rather than trying to move a value from an old key to a new one) is simpler and avoids ever having two entries or a dangling one. The alternative — embedding stable identity metadata into either the active file or the archive mirror so ids survive a toggle unchanged — was rejected for the same Core Principle #1 reason M5 gave: it would inject Morch-owned structure into the user's own files for a guarantee nothing has asked for yet.

One practical consequence: an alias assigned to an instruction persists across a toggle within the *same in-memory session* (the manager updates the existing slot in place), but is lost across an app restart once the instruction has been toggled at least once after the alias was set and the app is closed before re-enabling it back to its original file position — because the id it's keyed under at persist time won't be reconstructed the same way on a fresh `load()`. This is a known Phase One limitation in the same spirit as M5's, not a bug to silently work around.

**Status**: Locked in for Phase One. `createdAt`/`disabledAt` from FILE_STRUCTURE.md §6.4 are not implemented — nothing persists them yet and M7's acceptance bar doesn't require them; revisit if a later milestone needs disable-history/audit data.

**Follow-up (same day, caught in review before merging)**: Two bugs found reviewing this PR, both fixed before merge:

1. `enable()` originally pivoted its sibling line-number/id shifting on the position of whichever in-memory `Instruction` the caller named — but `archive::enable_instruction` (M5) removes by *first content match*, not position. If a file's `.morch-disabled/` mirror has two disabled instructions with identical content (plausible for log-style files like DECISIONS.md — repeated `**Status**: Locked in.` lines, `---` separators), enabling the *later* one on-screen actually removes the *earlier* physical line from disk, desyncing the in-memory model from the file. Fix: `enable()` now finds the in-memory entry with the lowest `line_number` among same-file, same-content matches (mirroring `.position()`'s first-match behavior) and pivots on that instead of trusting the caller's `idx` directly. This doesn't fully resolve the deeper ambiguity — which of two identical-content instructions' *aliases* survives is still effectively arbitrary when duplicates exist, since archive.rs has no way to disambiguate them either — but it does keep the in-memory model's positions/ids/counts consistent with what's actually on disk, which is what M7's acceptance bar requires.
2. `set_alias` originally mutated in-memory state *then* tried to persist — if the persist failed (e.g. `.morch/config.json` briefly unreadable), the alias stayed applied in memory, and since `persist_aliases` always rebuilds the whole map from live state, the next unrelated *successful* `set_alias` call would silently write the earlier failed alias to disk too. Fix: build the prospective alias map and persist it first; only mutate in-memory state after a successful write.

---

## 2026-09-06 — M8 Dashboard UI: gaps in DESIGN.md's spec filled in during the build

**Decision**: Building M8 against `DESIGN.md` surfaced a few roles/behaviors the document doesn't fully pin down. Rather than leave them undecided, concrete calls were made and are logged here so they read as deliberate, revisitable choices rather than accidents of implementation:

1. **Light-mode tokens DESIGN.md's mapping table omits**: `surface-overlay`/`border` → `n3`, `border-strong` → `n2` (the table's light chain only names three stops, `n6→n5→n4`; `n3` is the next step down and already load-bearing for light `text-muted`). `secondary` is left unchanged at `n9` in light mode — the table has no light row for it and, unlike `primary`, DESIGN.md never states `n9` fails contrast (it backs links/icons, not dense small text). The `on-primary`/`on-success`/`on-warning`/`on-danger` text-on-fill colors are also left unchanged in light mode, since they sit against mid-tone fills in both modes, not the page background.
2. **Disabled-archive drawer scope**: DESIGN.md's List view describes a single-file main pane but doesn't say whether the drawer below it is workspace-wide or scoped to the selected file. Scoped it to the selected file, matching the rest of List view's single-file framing. Board view has no per-column archive drawer — not mentioned in the spec, and columns there show active instructions only.
3. **"Manage anyway" acknowledgment** (dismissing a flagged file's warning card) is session-only React state, not persisted — `FILE_STRUCTURE.md` §6.3's config schema has no field for it, and Phase One's acceptance bar doesn't ask for it either.

**Rationale**: `docs/IMPLEMENTATION_PLAN.md`'s M8 acceptance bar ("every component in DESIGN.md's Components section exists and matches its documented token usage") requires a complete, working token set and a working drawer — DESIGN.md's gaps couldn't be left as literal blanks. Each choice above extends an existing, explicit pattern already stated in DESIGN.md (the four-step elevation logic, single-file List view framing, Phase One's un-persisted ephemeral-state precedent) rather than introducing a new one.

**Status**: Locked in for Phase One, flagged for a deliberate look (e.g. re-running `npx @google/design.md lint` and a manual pass over `DESIGN.md`) rather than treated as unquestionably final.
