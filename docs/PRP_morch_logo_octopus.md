# PRP — Morch Wordmark + Octopus Symbol

**Type**: Product Requirements Prompt (design/logo task handoff)
**Project**: Morch — repo root contains `CLAUDE.md`, `DESIGN.md`, `DECISIONS.md`; read all three before starting.
**Deliverable owner**: Alexandre. Bring finished SVGs back to him for review — do not consider this task complete until he approves a direction.

## 1. What Morch is

Morch is a desktop control panel that lets users toggle individual instructions on/off across their AI workspace's markdown files (`CLAUDE.md`, `AGENTS.md`, skills, etc.), with disabled instructions archived (never deleted) somewhere the user can access but the AI cannot read. It is a tool for precise, reversible control over a growing pile of instructions — not a creative or autonomous product.

**Non-negotiable brand constraint** (from `CLAUDE.md` Core Principle #2, applies to any copy, naming, or language produced alongside the mark — not the visual symbol itself): AI must always be described as a tool, never as a creative entity or autonomous agent. Don't write taglines, alt text, or rationale copy that anthropomorphizes the AI.

## 2. Existing visual system (already locked — do not deviate)

Full spec lives in `DESIGN.md`. Key constraints for this task:

- **Palette is Nord (nordtheme.com) only.** No colors outside the documented tokens. Reference hexes: `n0 #2E3440`, `n1 #3B4252`, `n2 #434C5E`, `n3 #4C566A`, `n4 #D8DEE9`, `n5 #E5E9F0`, `n6 #ECEFF4`, `n7 #8FBCBB`, `n8 #88C0D0`, `n9 #81A1C1`, `n10 #5E81AC`, `n11 #BF616A`, `n12 #D08770`, `n13 #EBCB8B`, `n14 #A3BE8C`, `n15 #B48EAD`. Custom dark canvas floor: `canvas-dark #12141A`.
- **Flat, no gradients, no drop shadows, no glow.** Hierarchy comes from flat color steps only. This is a direct inheritance from Nord's own documented philosophy and is non-negotiable for this brand.
- **Dual-tone system**: everything needs a dark-mode version (canonical) and a light-mode version. See `DESIGN.md`'s "Light mode mapping" table for the swap logic if the mark needs to adapt per-background.
- The in-product UI typography (Inter/Noto Sans for UI, monospace for source-quoting content) intentionally never goes bold and stays quiet/restrained — that rule is for the *product UI*, not the *logo*. The logo is allowed to diverge and carry more visual weight; this is a deliberate exception, not an oversight, and should be documented as such if you write any accompanying rationale.

## 3. The task

Design a **wordmark + symbol lockup system** for "Morch" (that is the correct spelling — not "Morck", a typo that appeared once in conversation and was corrected). Three usable outputs from one system:

1. **Symbol alone** — usable as an app icon / favicon / small badge.
2. **Wordmark alone** — the word "Morch" set in type, usable in headers/docs where a full logo would be too heavy.
3. **Combined lockup** — symbol + wordmark together, where the symbol visibly *connects with* the lettering rather than just sitting next to it (e.g., an element of the symbol touches, wraps, or integrates into a letterform).

### Wordmark direction

User wants **full lettering**, not an abbreviated mark — the complete word "Morch" spelled out, set in a **serif/slab serif** typeface. Requested feel: **solid, precise, impactful** — motivated by the product's core value proposition of giving the user control.

Three candidates were already test-rendered as outlined vector paths (see §5 for why outlining matters) and shown to the user:

| Font | Character | Notes |
|---|---|---|
| **Arvo Bold** | Geometric, mechanical, heaviest slabs | My recommendation — most "engineered instrument panel" feel, holds up best at small sizes. Not yet explicitly confirmed by the user. |
| Zilla Slab Bold | Editorial, warmer | Good if the brand should feel less clinical, more human. Probably too soft for "impactful/control." |
| Roboto Slab Bold | Precise, neutral, corporate | Solid but less distinctive than Arvo. |

Feel free to propose a different slab serif if you find a stronger fit for "solid/precise/impactful," but justify the choice against these three.

### Symbol direction: octopus

User explicitly rejected an earlier toggle-switch symbol concept ("horrible") and an earlier instrument-panel-bars concept. **The symbol must be an octopus.** No toggle/switch iconography, no literal UI-control imagery in the mark itself.

A first octopus draft was built and shown (geometric dome head, six square-capped tentacles in Nord frost cyan `#88C0D0`, flat fill, one elongated tentacle hooking up and around the top-left corner of the "M" in Arvo Bold with a small sucker-dot at the contact point). User feedback on that draft, not yet resolved:

- The reaching tentacle's curl read as **stiff/mechanical rather than fluid** — needs a more natural, confident curve.
- The head was **too plain** — no mantle texture or detail, read as a generic blob rather than distinctly octopus.
- The six non-connecting tentacles were **generic** — didn't read clearly as octopus-specific (vs. any tentacled creature).
- Open question, unresolved: should the whole symbol lean **more geometric/angular** (sharp, engineered, low-poly) or **more naturalistic with confident curves** (like a nautical/ship's emblem — which would also tie nicely into the arctic-research-station brand story already established in `DESIGN.md`'s Overview section)? Pick one and justify it, or present both.

The "connects with the lettering" requirement is the most important part of the brief — the octopus can't just sit beside the wordmark, some part of it (a tentacle, most likely) needs to physically integrate with a letterform in the combined lockup.

## 4. Constraints recap (quick checklist)

- [ ] Only Nord palette colors used
- [ ] Flat — no gradients/shadows/glow (except the documented window-chrome exception, irrelevant here)
- [ ] Octopus symbol, not a toggle/switch/panel-bars motif
- [ ] Serif/slab wordmark, full word "Morch," solid/precise/impactful feel
- [ ] Symbol physically connects with the wordmark in the combined lockup
- [ ] Works as symbol-alone, wordmark-alone, and combined
- [ ] Dark-mode and light-mode variants
- [ ] No anthropomorphizing copy/rationale language per Core Principle #2

## 5. Output format requirements

Deliver **SVG source files** with the wordmark rendered as **outlined vector paths, not live `<text>` elements** — this makes the file render identically regardless of which fonts are installed on the machine opening it, which matters for a portable logo asset. (If using Python: `matplotlib.textpath.TextPath` against a real font file is one way to get clean outlined paths; there are others.)

Needed files (naming is a suggestion, not a requirement):
- `morch-symbol-dark.svg` / `morch-symbol-light.svg`
- `morch-wordmark-dark.svg` / `morch-wordmark-light.svg`
- `morch-lockup-dark.svg` / `morch-lockup-light.svg`

## 6. What happens next

Alexandre will bring your output back into this conversation for review against `DESIGN.md` and for a final BRAND.md write-up (logo rationale, usage rules — clearspace, minimum size, don'ts — and brand voice/positioning). You don't need to write that document; just produce the SVGs and a short note on the design decisions you made, especially your resolution of the geometric-vs-naturalistic question in §3.
