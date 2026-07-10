# CLAUDE.md — Morch

## Project Purpose

This project is the specification and eventual implementation of Morch — a desktop app that lets users toggle individual instructions on/off across their AI workspace's markdown files (CLAUDE.md, AGENTS.md, SKILLS, etc.) via a dashboard UI.

## Core Principles (Non-Negotiable)

1. **No forced structure.** The app must never require the user's existing workspace to conform to a specific schema. Detection and recommendations are offered; nothing is mandatory.
2. **AI must be described as a tool, never as a creative entity or autonomous agent.** This applies to all product copy, documentation, and in-app language.
3. **Disabled instructions are archived, not deleted.** They must be moved somewhere the user can access but the AI cannot read.
4. **Structural and AI-processed files are written in English**, even when human-facing content in a given project is in another language.

## Working on This Project

- Read `docs/SPEC.md` first — it's the source of truth for scope and feature set.
- Phase One is instruction management ONLY. Do not scope-creep into skills/context management without an explicit decision logged in `DECISIONS.md`.
- Any architectural choice (framework, storage format, sync strategy) should be logged in `DECISIONS.md` with rationale.
- When editing docs, keep terminology consistent: "instruction" (a single toggleable unit), "managed file" (a file the app tracks), "disabled archive" (where toggled-off instructions live).
- Version control: see `.claude/skills/github-workflow/SKILL.md` for branch strategy, commit conventions, and when to update `DECISIONS.md` alongside a git change.

## Open Research Questions

See `docs/SPEC.md` §8. These should inform Phase Two, not block Phase One shipping.
