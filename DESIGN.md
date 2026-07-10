---
version: alpha
name: Morch
description: Desktop control panel for toggling instructions across AI workspace markdown files. Visual identity built on the Nord color scheme (nordtheme.com).
colors:
  canvas-dark: "#12141A"
  canvas-light: "{colors.n6}"
  surface-dark: "#1C1F27"
  surface-raised-dark: "#252A34"
  surface-overlay-dark: "#2F3542"
  border-strong-dark: "#404859"
  text-muted-dark: "#828EA6"
  n0: "#363A46"
  n1: "#3B4252"
  n2: "#434C5E"
  n3: "#4C566A"
  n4: "#D8DEE9"
  n5: "#E5E9F0"
  n6: "#ECEDF1"
  n7: "#8FBCBB"
  n8: "#88C0D0"
  n9: "#81A1C1"
  n10: "#5E81AC"
  n11: "#BF616A"
  n12: "#D08770"
  n13: "#EBCB8B"
  n14: "#A3BE8C"
  n15: "#B48EAD"
  background: "{colors.canvas-dark}"
  surface: "{colors.surface-dark}"
  surface-raised: "{colors.surface-raised-dark}"
  surface-overlay: "{colors.surface-overlay-dark}"
  border: "{colors.surface-overlay-dark}"
  border-strong: "{colors.border-strong-dark}"
  text-primary: "{colors.n6}"
  text-secondary: "{colors.n4}"
  text-muted: "{colors.text-muted-dark}"
  primary: "{colors.n8}"
  primary-hover: "#9FD0DE"
  primary-text-light: "#48678C"
  secondary: "{colors.n9}"
  success: "{colors.n14}"
  warning: "{colors.n13}"
  danger: "{colors.n11}"
  tertiary: "{colors.n15}"
  on-primary: "{colors.canvas-dark}"
  on-success: "{colors.canvas-dark}"
  on-warning: "{colors.canvas-dark}"
  on-danger: "{colors.canvas-dark}"
typography:
  h1:
    fontFamily: "Noto Sans, -apple-system, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 500
    lineHeight: "1.3"
  h2:
    fontFamily: "Noto Sans, -apple-system, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 500
    lineHeight: "1.3"
  h3:
    fontFamily: "Noto Sans, -apple-system, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: "1.4"
  body:
    fontFamily: "Noto Sans, -apple-system, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: "1.5"
  label:
    fontFamily: "Noto Sans Mono, SF Mono, Consolas, monospace"
    fontSize: "11px"
    fontWeight: 500
    letterSpacing: "0.02em"
  code:
    fontFamily: "Noto Sans Mono, SF Mono, Consolas, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "1.5"
rounded:
  sm: "4px"
  md: "6px"
  lg: "10px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "8px 10px"
  toggle-on:
    backgroundColor: "{colors.success}"
  toggle-off:
    backgroundColor: "{colors.border-strong}"
  badge-alias:
    backgroundColor: "{colors.background}"
    textColor: "{colors.primary}"
    rounded: "{rounded.pill}"
    typography: "{typography.label}"
  nav-item-active:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-primary}"
  warning-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
  instr-row-off:
    textColor: "{colors.text-secondary}"
  nav-item-flagged:
    textColor: "{colors.warning}"
  badge-secondary:
    backgroundColor: "{colors.background}"
    textColor: "{colors.secondary}"
  board-column:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md}"
  column-header:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body}"
  view-switch-active:
    backgroundColor: "{colors.surface-overlay}"
    textColor: "{colors.text-primary}"
  meta-text:
    textColor: "{colors.text-muted}"
    typography: "{typography.label}"
---

## Overview

Picture the instrument panel of a small research station somewhere north of the Arctic Circle, at night, in winter. The room is dim on purpose — everything else outside the window is dark for months at a time, so the panel is tuned for eyes that are already adjusted to low light. Nothing glows harder than it needs to. Status is shown with small, calm color changes, not alarms. The person reading it is tired, has read this panel a thousand times before, and needs to find one changed reading among fifty unchanged ones without being made to work for it.

That is Morch. It is a panel of switches for instructions the user has already written and mostly trusts — the job of the interface is to make the current state legible at a glance and make flipping a switch feel inconsequential and reversible, never dramatic. The Nord palette (nordtheme.com) is the literal color source, chosen because it was built for exactly this kind of low-stimulation, high-legibility, long-session reading — it's a theme built for code editors and terminals, and Morch's content (markdown instructions, file paths, line numbers) is close enough to code that the fit is direct rather than decorative.

Nothing about this interface should feel like a "product." It should feel like a well-kept tool panel: flat, quiet, a little cold, completely legible — modern and sleek through restraint, not through ornament. The room in the reference is darker than a typical dark-mode app: closer to the black of a window looking out at actual polar night, with just enough blue in it to remember it's Nord and not a generic near-black. Density stays exactly where it was — sleek is a finish, not an excuse to show less information.

## Colors

Nord's four sub-palettes map to four jobs, and Morch never blurs them. Dark mode is canonical (it's the mode the arctic-station reference actually describes), but Morch is dual-tone — every role below has a documented light-mode equivalent, because Nord itself ships explicit guidance for both "dark ambiance" and "bright ambiance" use. This isn't a bolted-on light theme; it's the same reference read in daylight instead of at night.

**Polar Night** (`n0`–`n3`) is the *reference* for structure, but dark mode no longer uses the stock swatches directly — the entire structural scale is rebalanced darker, not just the page floor. Nord's own `n0`–`n3` are a mid-dark navy family, comfortable but not dramatic; Morch's dark mode pushes every one of those four steps down in lightness by the same proportion (same hue `≈0.61`, same saturation `≈0.16` as their Nord source — only lightness moves), so the whole structural ladder feels like one consistent, deeper room instead of a near-black floor with merely-dark furniture sitting on top of it. Concretely: `background`/`canvas-dark` (`#12141A`) is the page floor, `surface` (`#1C1F27`) is anything "on the page" — cards, rows, the sidebar, the window chrome, `surface-raised` (`#252A34`) is one step up for hover states and the toolbar, `surface-overlay` (`#2F3542`) is the most-raised structural tier — active nav items — and doubles as the default `border` color, and `border-strong` (`#404859`) is the most passive-strong border tier. Every step stays proportionally spaced so the hierarchy is still readable purely from background-lightness, exactly as before — it's the same four-step logic, just recalibrated to a darker floor.

Nord's stock `n0`–`n3` stay declared in the token list even though dark mode no longer consumes them directly — they're the derivation source for the custom dark values above (see the hue/saturation note), and `n0`/`n1`/`n3` are still load-bearing for light mode's text mapping below. Think of them as the reference constants the darker scale was tuned against, not dead code.

One exception to "reference constants": `n0` and `n6` themselves have been retuned away from their stock Nord hex — `n0` is now `#363A46` and `n6` is now `#ECEDF1` — to match the finalized Morch wordmark/symbol lockup exactly, since those two tokens are respectively the light-mode ink and the paper the logo is built from. This is a deliberate, logo-driven deviation from stock Nord, in the same spirit as `canvas-dark` already being a custom addition beyond Nord's own scale (see `DECISIONS.md`). The `surface-dark` family above was derived from Nord's *original* `n0`–`n3` hue/saturation, before this retuning, and hasn't been re-derived from the new `n0` — so from here on, treat `n0`/`n6` as Morch-specific brand constants, not strict Nord swatches.

Text and accent colors are deliberately **not** part of this darkening — `text-primary`/`text-secondary` stay at Snow Storm's brightest values (unchanged, see below) and every Frost/Aurora accent stays exactly at its stock Nord value, because those are the colors doing the actual communicating (reading text, signaling status) and darkening them would directly fight the "completely legible" mandate. The one adjustment made *because* of the darker floor, not despite it: `text-muted` moves off `n3` (which would only clear ~1.8:1 against the new `surface` — unreadable) to a custom, lighter-but-still-quiet blue-gray, `text-muted-dark` (`#828EA6`), chosen specifically to hold ≥4.5:1 against every dark-mode surface tier.

**Snow Storm** (`n4`–`n6`) is text in dark mode, full stop. `n6` is primary reading text — instruction content, the words the user actually came to read. `n4` is secondary text — metadata, timestamps, helper copy. `n5` has no dark-mode UI role; it exists in the palette but Morch doesn't need a third text step there.

**Frost** (`n7`–`n10`) is interaction, and mostly mode-invariant. `n8` is the single primary accent — the toggle-on state, the primary button, the active nav indicator, anything asking for the user's attention as an actionable element. `n9` is secondary interactive elements (links, secondary icons) that need to read as "clickable" without competing with `n8`. `n7` exists in the palette for future use (data visualization, chart series) but isn't assigned a UI role yet. `n10` is reserved for dark mode but becomes load-bearing in light mode — see the mapping table below.

**Aurora** (`n11`–`n15`) is status in both modes, used sparingly and only for genuine status meaning — Nord specifies these colors identically for dark and bright ambiance, so Morch does too:
- `n14` (green) = enabled / active — the only color allowed on a toggle-on state.
- `n13` (amber) = a flag or caution — e.g. "this file is log-style, per-line toggling isn't recommended." Not an error, just a heads-up.
- `n11` (red) = reserved for actual destructive/error states (a failed write, a corrupted config). **Never used for "disabled."** A disabled instruction is a normal, everyday, fully-reversible state — coloring it red would imply something broke. Note for implementers: `n11` measures below WCAG AA text contrast against Polar Night backgrounds (2.5–2.8:1, recalculated after the `n0` retuning above) — this is a real limitation of Nord's red, not a token typo. When `n11` is eventually used, pair it with an icon and a text label; never convey an error through that color alone.
- `n15` (purple) = reserved, currently unused. A candidate for Phase Two features (skills, context blocks) if they need visual differentiation from Phase One instructions.
- `n12` (orange) = reserved, currently unused.

### Light mode mapping

The YAML tokens above are the dark-mode values (canonical/default). Light mode swaps the Polar Night/Snow Storm roles per Nord's own "bright ambiance" guidance, and darkens the Frost accent one step so text/icon contrast holds against a light background:

| Role | Dark value | Light value | Why |
|---|---|---|---|
| `background` | `canvas-dark` (`#12141A`) | `n6` (`#ECEDF1`) | Snow Storm's brightest shade becomes the page floor, mirroring how Polar Night's darkest shade is the dark-mode floor. `n6` is now the logo's exact paper color (see the `n0`/`n6` retuning note above), so this is also literally the page the logo sits on. |
| `surface` | `surface-dark` (`#1C1F27`) | `n5` | One step in from the page floor, same relative position as dark mode. (Dark-mode value is the rebalanced `surface-dark`, not stock `n0` — see the Polar Night section above.) |
| `surface-raised` | `surface-raised-dark` (`#252A34`) | `n4` | Same relative position, one step further. (Dark-mode value is `surface-raised-dark`, not stock `n1`.) |
| `text-primary` | `n6` | `n0` | Snow Storm/Polar Night swap direction, following Nord's own dark/bright-ambiance pattern — though `n0`/`n6` are now Morch's logo-tuned constants rather than stock Nord hex (see above), not literal Nord-doc values anymore. |
| `text-secondary` | `n4` | `n1` | |
| `text-muted` | `text-muted-dark` (`#828EA6`) | `n3` | Dark mode uses the custom `text-muted-dark` (tuned for ≥4.5:1 against the rebalanced surfaces); light mode still uses stock `n3`, which Nord documents as the shared "quiet" role in both ambiances. |
| `primary` (accent, fills/non-text) | `n8` | `n10` | `n8`/`n9` are too pastel to hit AA text contrast on a light background. `n10`, Frost's darkest member, was built for exactly this — it's the one Frost color Nord explicitly differentiates by ambiance. |
| `primary` (accent, small text/icons) | `n8` | `primary-text-light` (`#48678C`) | `n10` reaches 3.4:1 on the new `n6` — enough for a fill or a large element, not for small label text. `primary-text-light` is `n10` darkened until it clears 4.5:1 (4.99:1 against the new `n6`), used only where the accent color *is* the text, e.g. an alias badge or active nav label. |
| Aurora (`success`/`warning`/`danger`) | unchanged | unchanged | Nord specifies these identically for both ambiances. |

Implementers: this is a straightforward CSS custom-property swap on a root `data-theme` attribute, not two separate component trees — every component below is written against the semantic names (`background`, `surface`, `text-primary`, etc.), never the raw `n*` values directly, specifically so this swap is a single point of change.

## Typography

Two families doing two different jobs, matching how the content itself is split.

**Noto Sans** (Google Fonts) carries everything that's Morch's own voice: headings, body copy, button labels, empty states. It reads as clean and current — a genuinely modern grotesque rather than the slightly clinical feel of a pure system-UI font — while staying quiet and humanist rather than geometric or characterful. The interface should never compete with the instruction text for attention; Noto Sans is sleek in the sense of "nothing to trip over," not in the sense of "look at this typeface."

**Noto Sans Mono** (same family, monospace cut — falling back to SF Mono / Consolas) carries anything that is literally quoting the source file: file paths, line numbers (`L9`, `L42`), instruction aliases, raw instruction text where it helps to visually confirm "this is verbatim from your markdown, not paraphrased by the app." Pairing the sans and mono cuts of one type family (instead of mixing, say, Inter with JetBrains Mono) is part of what keeps the interface feeling like one deliberate system instead of a UI kit assembled from parts. Using mono at all for source-adjacent content is a direct inheritance from Nord's own origin as an editor/terminal theme — the one place Morch is allowed to look a little like a code editor.

Size steps stay tight (11–20px) because this is a dense, single-window desktop dashboard meant to show many instructions at once, not a marketing surface with room for large type. Weight is restrained to regular (400) and medium (500) — never bold. A control panel doesn't shout.

## Layout

Density target is "dense but not cramped" — this is a tool for scanning ten to fifty toggle rows at a time, not a handful of hero cards. The spacing scale (4/8/12/16/24px) stays on the tight end deliberately: generous whitespace would waste space the user needs for seeing more instructions at once, which is the entire value proposition.

The toolbar (search, stats, view switch) is a fixed strip above both views, separated from whatever's below it by a hairline (`border`, full width) — List and Board content scrolls underneath the toolbar, the toolbar never scrolls with it. This separator is load-bearing, not decorative: without it the filter row visually fuses with the first instruction row and the toolbar reads as part of the list instead of a control surface above it.

Morch has two interchangeable views over the same instruction data — a view switch, not two products:

**List view** (default) — sidebar (file navigation, one entry per managed file with an enabled/total count, plus a persistent "add file" affordance at the bottom — adding a managed file is not an onboarding-only action, see Onboarding) + a main pane showing the instruction list for whichever file is selected + a collapsible drawer at the bottom (the disabled archive). The drawer stays collapsed by default — it's reference material, not the primary view, and should never compete for attention with the active instruction list. When open, the drawer body caps at a fixed max-height (roughly 4-5 rows tall) with its own internal vertical scroll — a workspace with many disabled instructions must not let the archive grow the window without bound. Best for deep work inside a single file.

**Board view** — a Kanban layout for scanning the whole workspace at once. Each managed file is a column; columns sit in a single horizontally-scrolling row (the workspace can have more files than fit on screen — scroll sideways to see them all, don't wrap to a second row, that breaks the "each column is one file" mental model), with a slim "add column" affordance at the end of the row mirroring the sidebar's add-file control in List view. Each column has a fixed header (filename, enabled/total count) and its own independently vertically-scrolling instruction list below it — scrolling one column never scrolls another. The search/filter control from List view applies globally in Board view: it filters instructions inside every column simultaneously, and a column with zero matches collapses to just its header rather than showing an empty scroll area. Best for a whole-workspace audit — "what's on across everything right now."

The two views are a toggle in the toolbar, not a settings-page choice — switching should be a single click and should preserve the current filter/search state.

**Two archives, two different jobs.** The disabled archive (above) holds individual *instructions* the AI must never see. A second, separate drawer — **ignored files** — holds whole *files* the user has hidden from the dashboard. These are not the same mechanism and shouldn't be visually merged into one drawer: ignoring a file is a dashboard-declutter action (stop showing it in the sidebar/board so the main list stays clean), not an AI-visibility action — the file's content on disk is completely untouched, the AI reads it exactly as before. This maps directly to `FILE_STRUCTURE.md`'s existing config schema: every managed file already carries an `enabled` flag; ignoring a file sets it to `false` without removing the config entry, so the choice is fully restorable. Any file can be ignored, not just flagged/log-style ones — the ignore control lives on every sidebar item and every Board column header (small icon, hover-revealed in List view to keep the row visually clean, always-visible on Board column headers since there's no equivalent hover-row context there). The ignored-files drawer follows the same collapsed-by-default, capped-max-height-with-scroll pattern as the disabled archive, listing each ignored file with a one-click Restore.

## Elevation & Depth

Flat. No drop shadows, no gradients, no glow — this is a direct, non-negotiable inheritance from Nord's own documented philosophy ("minimal and flat style pattern"). Hierarchy is communicated entirely through the rebalanced dark-mode background steps (`background` `#12141A` → `surface` `#1C1F27` → `surface-raised` `#252A34` → `surface-overlay` `#2F3542`), never through shadow depth. In light mode the same chain runs `n6` → `n5` → `n4` (see the Light mode mapping table above) — same four-step logic, inverted direction, using the stock Nord swatches since light mode was never part of the darkening pass.

The one exception is the outer application window itself, which may carry a single, very subtle contact shadow (`0 1px 2px` at low opacity) purely to separate the window from whatever desktop background sits behind it — this is operating-system window chrome, not UI decoration, and should be barely perceptible. In Board view, column headers may use the same subtle shadow treatment when a column is mid-scroll (a thin bottom shadow signaling "content continues below") — this is a functional scroll affordance, not decoration, so it's exempt from the no-shadow rule the same way the window chrome is.

## Shapes

Corners are small and consistent: `sm` (4px) for tags and badges, `md` (6px) for rows, buttons, and inputs, `lg` (10px) for the outer window frame and cards. Toggle switches are the one fully-pill (999px) element in the system — their shape is doing communicative work (a switch reads as a switch partly because of its pill silhouette) so it's exempted from the otherwise-restrained corner scale.

## Onboarding

Onboarding is the one place Morch is allowed to over-explain, because it's the one moment the user hasn't yet built a mental model of what "managing a file" means. Everywhere else in the product, brevity wins; here, clarity wins.

Every detected file in the checklist needs three things, not just a checkbox: an icon indicating detected type (plain file vs. flagged log-style file), the filename, and one line of plain-language description of what selecting it does and, where relevant, why Morch flagged it (e.g. "Log-style — entries span multiple lines, per-line toggling isn't recommended" rather than just an amber icon with no explanation). A line count alone is not sufficient context for a first-time decision.

The wizard should also state, once, near the top of the first step — not buried in a tooltip — the two facts a new user most needs before they'll trust the product: that selecting a file doesn't change it (scanning is read-only), and that disabling an instruction later archives it rather than deleting it. Users decide whether to trust an unfamiliar tool with their files in the first ten seconds; that trust is the actual product of the onboarding screen, the file checklist is secondary.

Keep the step indicator explicit ("Step 1 of 2") rather than implicit — this is a guided flow, not a single free-floating dialog, and the user should know how much is left.

Nothing decided during onboarding is final. A file left unchecked (including a flagged log-style file like DECISIONS.md) can be added later from the dashboard itself — the sidebar (List view) and the end of the column row (Board view) both carry a persistent "add file" control, not just the wizard. Onboarding sets a starting point, not a locked configuration.

## Components

- **Toggle switch** — the single most important control in the product. Track uses `success` when on, `border-strong` when off — deliberately not a bright/dim pair, because "off" should read as neutral, not as absence or failure. Never use `danger` here.
- **Instruction row** — a `card`-style surface (`surface` background, `border` outline) holding the toggle, instruction text (`body` typography, `text-primary`), and a metadata line (alias badge + line-number tag, both `label` typography). When off, text gets a strikethrough and drops to `text-secondary` — legible but visually deprioritized, not hidden.
- **Alias badge** — small pill, `background` (the darkest surface, not `surface-raised`) so `primary`/`secondary` text stays AA-compliant, `label` typography (mono). Reads as a small instrument label, not a marketing tag.
- **Sidebar nav item** — flat list item, `surface-raised` background only when active. A file flagged as log-style (poor fit for per-line toggling) gets a `warning`-colored icon and text, never a blocking treatment — the user can still select it.
- **Warning card** — used for in-context guidance like the log-style-file flag. `surface` background, `warning`-colored leading icon, body text in `text-secondary`. Calm, not alarmed. **Never a permanent dead end**: it always carries a secondary-button action ("Manage anyway") that lets the user override the flag and see the file's instructions as normal toggleable rows. The flag itself doesn't disappear — a small `warning`-colored indicator stays on that file's nav item/column header as a quiet reminder — but the blocking full-width card is a one-time acknowledgment, not something the user re-confronts every time they open the file.
- **Primary button** — `primary` fill, `on-primary` text (dark text on the bright frost cyan, for contrast), `md` rounding. Reserve for the single most important action per screen (e.g. "Continue" in onboarding). Everything else is a secondary/ghost button on `surface`.
- **Board column** — `surface` background, `lg` rounding, fixed width (roughly 280–320px), full-height flex column. Sits inside the horizontally-scrolling board row with `md` gap between columns.
- **Column header** — sticky to the top of its column while the column's instruction list scrolls beneath it. `surface-raised` background, filename in `body`/mono, enabled/total count in `text-muted` `label` typography, right-aligned.
- **View switch** — a two-option segmented control (List / Board) in the toolbar, same visual weight as a button pair, not a full tab bar — this is a display preference, not a navigation hierarchy change.
- **Meta text** — the `text-muted`, `label`-typography treatment for anything low-priority-but-present: the workspace path in the window titlebar, enabled/total counts, line counts in onboarding. This is the one place `text-muted` shows up as its own named pattern rather than being folded into a bigger component.
- **Ignore control** — a small icon-only button (`ti-eye-off`, `text-muted`, `text-primary` on hover), no fill, no border. Lives on every sidebar item and Board column header. Needs no confirmation dialog — ignoring is a one-click, one-click-reversible action, consistent with the rest of the product never treating a reversible action as high-stakes.
- **Ignored files drawer** — visually identical pattern to the disabled archive (collapsed by default, `surface` background, capped max-height with internal scroll) but its own drawer, stacked directly below the disabled archive, never merged into it. Each row: filename in mono, one-line `text-muted` note ("hidden from dashboard — file untouched"), Restore button.

## Iconography

Outline-style icons only (no filled variants) — consistent with the flat, unfilled philosophy everywhere else. Icon size stays small (15–18px) to match the dense type scale; decorative icons never carry color unless they're reinforcing a status (the `warning` triangle on a flagged file, the `danger`-tinted eye-off on the archive-drawer header). An icon that isn't communicating status should sit in `text-secondary` or `text-muted`, never `text-primary` — icons support the text next to them, they don't compete with it.

## Do's and Don'ts

**Do:**
- Do communicate hierarchy through the dark-mode background steps (`background`→`surface`→`surface-raised`→`surface-overlay`), never through shadows or gradients.
- Do reserve Aurora colors for genuine status meaning — if a color doesn't mean something specific, it shouldn't be there.
- Do use the monospace stack for anything that's quoting the source markdown verbatim (paths, line numbers, aliases) — it's a visual promise of "this is exactly what's in your file."
- Do keep the disabled-archive drawer collapsed by default — it's reference material the user checks occasionally, not the primary surface.

- Do give onboarding room to explain itself — a one-line "why" under every file in the checklist, and the read-only/archived-not-deleted reassurance stated plainly, not buried in a tooltip.
- Do keep List and Board as one dataset viewed two ways — a filter or a toggle state set in one view must still be true when the user switches to the other.

**Don't:**
- Don't color the "disabled" state with `danger`/red. Disabling an instruction is normal and fully reversible — treating it as an error state misrepresents what the product does and would undermine the trust the whole "archived, not deleted" premise depends on.
- Don't add gradients, drop shadows (beyond the window-chrome and mid-scroll column-header exceptions), glows, or any other depth effect. It's a flat panel, not a glossy dashboard.
- Don't let in-app copy, empty states, or onboarding language describe Morch or the underlying AI as a creative or autonomous entity — this is a direct extension of CLAUDE.md's Core Principle #2 into UI writing. Microcopy should read like it's describing a tool ("3 instructions disabled" not "I've tucked those away for you").
- Don't use bold (600/700) type weight anywhere. The type scale tops out at 500 — a control panel doesn't shout.
- Don't let Board view columns wrap to a second row when they overflow the window width. Horizontal scroll only — wrapping breaks the "each column is one file" reading order.
- Don't hardcode dark-mode `n*` hex values anywhere a light-mode equivalent exists. Reference the semantic name (`{colors.surface}`, not `{colors.n0}`) so the light/dark swap stays a single point of change.
