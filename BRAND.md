# BRAND.md — Morch

**Status: v1, provisional.** This document describes the brand as it stands today, including two open decisions (typeface direction, symbol independence) that are flagged inline rather than papered over. See `brand/STATUS.md` for the live punch list. Revise this file when those close.

## What the brand is for

Morch is a panel of switches for instructions a user already wrote and mostly trusts. The product promise is control: see everything, flip what you want, lose nothing. The brand's job is to look like that promise — solid, precise, a little cold, never decorative for its own sake. It should feel like a well-made instrument, not a "product" trying to charm anyone.

This is the same instinct that produced `DESIGN.md`'s Nord-based, flat, low-stimulation interior. The brand and the interface are one continuous idea, not a marketing layer bolted onto a UI: both are about making a lot of information hold still long enough to be legible.

## Name

**Morch** — a contraction of "Markdown Orchestrator." Chosen for being short and distinctive rather than descriptive; the full name lives on as a subtitle where context is useful (see `README.md`). Rationale logged in `DECISIONS.md`, 2026-07-09.

## Logo system

Three usable pieces, built from one lockup:

- **Symbol alone** — the octopus mark. For small spaces: app icon, favicon, avatar.
- **Wordmark alone** — "Morch" set in type. For contexts where a full mark is too heavy: doc headers, running text, byline.
- **Combined lockup** — symbol + wordmark together, the primary/default form. This is the only one where the two pieces physically connect (see below) — using the symbol alone loses that connection, which is expected, not a bug.

Current files: `brand/logo-morch-light-transparent.svg` (fully legible version), `brand/logo-morch-dark-transparent.svg` (see below), `brand/symbol-morch.svg`. Two older files, `logo-morch-dark-block.svg` and `logo-morch-light-block.svg`, are superseded/reference-only — the latter is also currently a corrupted file, see `brand/STATUS.md`.

**The light and dark versions are not a standard inverted pair.** `logo-morch-light-transparent` is the fully legible mark — dark ink on a transparent background, meant to be read clearly wherever it's placed. `logo-morch-dark-transparent` is a deliberately subtle, near-ghost treatment for dark surfaces: both the wordmark and the badge are meant to sit close in value to a dark page and partially recede into it, rather than popping off it at full contrast. This is confirmed intentional (Alexandre, 2026-07-10), not a bug — don't "fix" its contrast.

That intentional subtlety means it can't be the mark used anywhere legibility is functionally required regardless of surroundings (app icon, taskbar/dock icon, favicon) — see the open question in `brand/STATUS.md` about whether those contexts should default to the light version even on dark chrome, or need a third always-legible dark variant.

**Known gaps, not yet fixed (see `brand/STATUS.md` for detail):**
- `symbol-morch.svg` isn't fully self-contained: in the combined lockup, one tentacle reaches out of the badge and onto the wordmark's "M." Used alone, that tentacle currently has nothing to land on. Treat the standalone symbol file as provisional until a version with the tentacle resolved back into the badge exists.
- Files carry un-flattened export layers (source: Affinity Designer). Fine for now; should be cleaned before wide distribution.

## The symbol: why an octopus

The octopus stands for the product, not for the AI. Many arms, precise independent control of each one, nothing done on autopilot — that's the read Morch wants: a tool that lets a user manage many files and many instructions at once without losing precision on any single one. It is not a mascot that "does things for you"; it doesn't act autonomously in any copy, animation, or narrative sense. See Voice, below — this distinction is load-bearing, not a style note.

The connecting tentacle (reaching into the wordmark's "M" in the combined lockup) is the one deliberately illustrative flourish in an otherwise restrained system: symbol and word are shown to be one idea, physically joined, not two logo elements placed next to each other.

**One open flag, not yet resolved with Alexandre:** a dark badge with a white-knockout octopus is a well-established pattern in developer-tool branding specifically. Worth a deliberate differentiation pass (badge shape, pose, color) before this is treated as final — noted here so it isn't lost.

## Color

Two colors, both now canonical brand + product tokens (not logo-only):

| Role | Hex | Also known as |
|---|---|---|
| Ink | `#363A46` | `DESIGN.md` token `n0` |
| Paper | `#ECEDF1` | `DESIGN.md` token `n6` |

These were originally the logo's colors; Alexandre chose to make the product's core `n0`/`n6` tokens match the logo exactly, rather than the reverse (`DECISIONS.md`, 2026-07-10). Any future revision to these two hex values is a product-wide decision, not just a logo tweak — check `DESIGN.md` before changing either.

No other colors appear in the logo. If a future revision introduces an accent color (e.g., for a colored variant), it must come from the documented Nord tokens in `DESIGN.md` — never an arbitrary hex, per that document's palette discipline.

## Typography

**Open decision, flagged rather than resolved:** the original brief for this logo (`docs/PRP_morch_logo_octopus.md`) called for a slab serif — "solid, precise, impactful," in the spirit of Arvo/Zilla Slab/Roboto Slab. What was actually delivered is a high-contrast modern/Didone serif instead (thin hairline serifs, ball terminals, real thick/thin stroke contrast) — a genuinely different feeling: elegant and editorial rather than mechanical and engineered. This document is being written against what exists today, but this divergence from the original intent hasn't been explicitly signed off. If Alexandre confirms the Didone direction, delete this paragraph in the next revision; if not, the wordmark needs to be redrawn in a slab serif before this section is final.

Logo typography is intentionally independent from in-product UI typography. `DESIGN.md` specifies Noto Sans/Noto Sans Mono for the interface, restrained to regular/medium weight, "never bold" — a control-panel rule for dense, long-session reading. The logo is seen once per encounter, not read for hours, so it's allowed to carry more visual weight and personality than anything inside the product. This is a deliberate split, not an inconsistency: the wordmark is a signature, the UI type is an instrument.

## Usage rules

- **Clearspace**: keep clear space around the mark (symbol, wordmark, or lockup) at least equal to the height of the octopus head shape in the symbol. Nothing else — text, other logos, UI chrome — should sit inside that margin.
- **Minimum size**: the combined lockup's fine tentacle/sucker detail starts to break up below roughly 32px tall; don't go smaller than that until the symbol is simplified for small-size use (see `brand/STATUS.md`). The wordmark alone can go smaller since it has no fine detail comparable to the tentacle suckers.
- **Backgrounds**: use `logo-morch-light-transparent` wherever the mark needs to be reliably legible, on any surface. Use `logo-morch-dark-transparent` only where the subtle/blended treatment is the intent (e.g., a dark decorative surface where a fully-popping mark would be too loud) — not as a general-purpose "dark mode" substitute.
- **Don't** recolor the mark outside the two documented tokens.
- **Don't** stretch, skew, rotate, or add effects (drop shadow, glow, gradient) to any part of the mark — this mirrors `DESIGN.md`'s flat, no-depth-effects rule for the product itself.
- **Don't** crop the combined lockup's connecting tentacle to make a faux "symbol alone" — use the dedicated symbol file (with its current caveat above) instead of cutting the lockup apart.
- **Don't** use the symbol as a stand-in for the AI, a chat avatar that "speaks," or anything else that implies it acts or decides on its own.

## Voice

Morch's brand voice follows `CLAUDE.md`'s Core Principle #2 directly: the product — and by extension its symbol — is described as a tool, never a creative or autonomous entity. Concretely:

- Write about what the *user* does with Morch ("toggle an instruction," "review what's disabled"), not what Morch or its octopus "does for" the user.
- Avoid any copy that gives the octopus agency ("Morch fetches your files," "the octopus organizes your instructions"). It's a mark, not a character.
- Keep taglines and descriptive copy plain and functional. Preferred register: *"A control panel for your AI workspace instructions."* Avoid anything that reads as playful personification of the octopus or the AI itself.
- Same restraint as the visual system: no exclamation points, no "magic," no implying the product thinks or decides.

## Changelog

- **2026-07-10** — v1 written. Colors and naming are settled; typography and symbol independence are open, see notes above and `brand/STATUS.md`.
- **2026-07-10 (later)** — Corrected: the dark variant's low contrast was initially flagged here as a bug to fix. Confirmed intentional by Alexandre — it's a deliberate subtle/ghost treatment for dark surfaces, not a legibility failure. Rewrote "Logo system" and "Backgrounds" accordingly; added the open question about functional-legibility contexts (app icon, etc.) to `brand/STATUS.md`.
