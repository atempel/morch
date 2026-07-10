# Morch Brand Assets — Status

## What's in this folder

- `logo-morch-light-transparent.svg`/`.png` — full wordmark + octopus symbol lockup, dark ink on transparent background. The fully legible version — use this wherever the mark needs to actually be read.
- `logo-morch-dark-transparent.svg`/`.png` — same lockup, intentionally treated for dark surfaces: the badge and wordmark are both meant to sit close in value to a dark page and partially recede into it (see "Two intentional treatments" below). **Confirmed intentional by Alexandre, 2026-07-10** — not a contrast bug.
- `logo-morch-dark-block.svg` — earlier version of the dark lockup, kept behind a solid paper-colored background rect (the "block"). Superseded by the transparent version above for most uses, kept for reference.
- `logo-morch-light-block.svg` — **corrupted file.** Truncated mid-path (96 lines vs. 110 in its dark counterpart, cuts off inside coordinate data with no closing SVG tags). Doesn't parse. Needs re-exporting from the source file — flagging rather than guessing at a fix, since I can't reconstruct missing vector data.
- `symbol-morch.svg` — the octopus symbol alone. Unchanged since first delivered.

No wordmark-only export exists yet.

## Two intentional treatments, not light/dark parity

This isn't a standard "same mark, inverted colors" light/dark pair. The light version is the fully-legible mark. The dark version is a deliberately subtle, near-ghost treatment where the wordmark and badge both blend toward a dark background rather than popping off it — confirmed as intentional, not a fix-it item.

**Open question this raises, not yet resolved:** anywhere the mark needs to be reliably legible regardless of surrounding UI — the app icon, a taskbar/dock icon, a favicon — can't rely on a treatment that's designed to partially disappear into dark backgrounds. Worth deciding whether those functional contexts always use the light-transparent version (even on a dark OS taskbar), or whether a third, always-legible dark variant is needed alongside the ghost-mark one. Not blocking, just flagged so it doesn't get missed at implementation time.

## Where the colors live

`#363A46` and `#ECEDF1` are no longer just logo colors — they're now `DESIGN.md`'s `n0` and `n6` tokens (see `DECISIONS.md`, 2026-07-10 entry). Any future logo revision that changes these two colors should update `DESIGN.md` too, or explicitly decide not to.

## Known open items (not yet resolved)

1. **`logo-morch-light-block.svg` is corrupted** — see above, needs re-export.
2. **Typography is a high-contrast modern/Didone serif** (thin hairline serifs, ball terminals), not the slab serif originally briefed in `docs/PRP_morch_logo_octopus.md`. This is a real, acknowledged stylistic pivot — not yet decided whether to keep it or revisit the slab-serif direction.
3. **Symbol isn't self-contained.** In the combined lockup, one tentacle exits the badge and lands on the wordmark's "M." Used alone (`symbol-morch.svg`), that same tentacle has nothing to hold onto — a clean, self-contained symbol-only version doesn't exist yet. Unchanged since first delivered.
4. **No always-legible mark for functional dark contexts** — see "Two intentional treatments" above.
5. **File hygiene.** ~50-66KB per file, hidden/duplicate layers under the visible artwork, un-flattened Affinity Designer export cruft. Fine for review, not ideal as a final production asset.
6. **Differentiation gut-check, unresolved.** The dark-badge + white-knockout-octopus composition is close enough to an established dev-tool mascot pattern that it's worth a deliberate look before treating it as final — not a blocker, just flagged.

## BRAND.md

Written — see root `BRAND.md`. Update its "Backgrounds" usage rule and file references if the open items above change.
