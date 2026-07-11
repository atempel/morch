<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="brand/logo-morch-light-transparent.svg">
    <source media="(prefers-color-scheme: light)" srcset="brand/logo-morch-dark-transparent.svg">
    <img src="brand/logo-morch-light-transparent.svg" alt="Morch" width="320">
  </picture>
</p>

# Morch

*(Markdown Orchestrator)*

A desktop control panel for managing instructions across AI workspace markdown files (CLAUDE.md, AGENTS.md, SKILLS, etc.).

## What This Is

When AI workspaces grow large, instructions accumulate across multiple markdown files and become hard to track. Morch gives users a dashboard to see every instruction, toggle it on/off, and keep the AI-facing files clean — without losing anything (disabled instructions are archived, not deleted).

## Project Status

**Phase**: In development — M1–M7 complete (Tauri v2 + React scaffold, workspace scanner, onboarding, parser, disabled-archive manager, file watcher, instruction manager). Framework, PRD, visual identity (Nord, dual-tone), and dashboard interaction design (List + Board views, onboarding, disabled-instruction archive, ignored-files drawer) are all locked and validated via an interactive prototype. See the [Development](#development) section below and `docs/IMPLEMENTATION_PLAN.md` for the remaining milestones (M8–M10).
**Scope**: Phase One — instruction management only (see `docs/SPEC.md` §7)

## Structure

```
morch/
├── README.md              ← you are here
├── CLAUDE.md               ← AI agent instructions for working on this project
├── AGENTS.md                ← multi-agent operating notes
├── DECISIONS.md              ← key decisions and rationale log
├── DESIGN.md                ← visual identity spec (Nord theme) for AI coding agents
├── BRAND.md                 ← logo system, brand voice, usage rules (v1, provisional)
├── docs/
│   ├── SPEC.md              ← full product specification
│   ├── USER_FLOWS.md         ← detailed user flow walkthroughs
│   ├── TECHNICAL_ARCHITECTURE.md
│   ├── FILE_STRUCTURE.md      ← workspace + config file layout
│   ├── PARSING_VALIDATION.md   ← line-based parsing assumption tested against real files
│   ├── ROADMAP.md            ← Now/Next/Later + sequenced Phase One tasks
│   ├── IMPLEMENTATION_PLAN.md  ← milestone-by-milestone coding handoff brief (M1–M10)
│   ├── PRD.md               ← canonical product requirements doc
│   └── PRP_morch_logo_octopus.md  ← logo design handoff brief
├── brand/
│   ├── STATUS.md                    ← current state of the logo work + open items
│   ├── logo-morch-light-transparent.svg  ← fully legible mark, use by default
│   ├── logo-morch-dark-transparent.svg   ← intentional subtle/blend treatment for dark surfaces (not general dark-mode use, see STATUS.md)
│   ├── logo-morch-dark-block.svg      ← superseded/reference
│   ├── logo-morch-light-block.svg     ← corrupted file, needs re-export (see STATUS.md)
│   └── symbol-morch.svg              ← symbol on its own
└── .morch/
    └── config.example.json    ← example app config
```

## Next Steps

Framework is locked in (Tauri v2 for the app shell; JSON-only persistence for Phase One, see `DECISIONS.md`) and the parsing assumption has been validated against this project's own files (see `docs/PARSING_VALIDATION.md`). See `docs/IMPLEMENTATION_PLAN.md` for the concrete build plan and `docs/ROADMAP.md` for the sequenced Phase One overview.

## Development

**Status**: M1–M7 complete — Tauri v2 + React + TypeScript scaffold, JSON-only config (`.morch/config.json`, schema per `docs/FILE_STRUCTURE.md` §6.3), a read-only workspace scanner (`scan_workspace`) that detects candidate markdown files and flags log-style ones (e.g. DECISIONS.md), a working onboarding wizard (choose workspace → review checklist → save config), a line-based markdown parser (`parse_file`) validated against this project's own CLAUDE.md/AGENTS.md per `docs/PARSING_VALIDATION.md`, a disabled-archive manager (`disable_instruction`/`enable_instruction`) that moves lines to/from a mirrored `.morch-disabled/` structure with a verified zero-data-loss round trip, a debounced, hash-based file watcher (`watch_managed_files`) that detects external edits to managed files without re-triggering on the app's own writes (see `DECISIONS.md`, 2026-07-11), and an in-memory instruction manager (`load_instructions`/`toggle_instruction`/`set_instruction_alias`) that merges parser output, archive state, and aliasing into one source of truth, keeping enabled/total counts and toggle state correct without a full re-scan. No dashboard UI yet; see `docs/IMPLEMENTATION_PLAN.md` for remaining milestones (M8–M10).

```sh
npm install       # install frontend deps
npm run tauri dev # run the app in dev mode
cd src-tauri && cargo test  # run Rust tests (includes the config read/write round-trip test)
```

---

<p align="center">Made with ❤️ in Brazil 🇧🇷</p>
