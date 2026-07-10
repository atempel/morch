# Morch — Product Specification

## 1. Problem Statement

When AI workspaces grow beyond a certain threshold, they become difficult to manage and control. Users accumulate instructions, skills, and context across multiple markdown files (CLAUDE.md, AGENTS.md, DECISIONS.md, etc.), and lose visibility into what they've actually enabled or disabled at any given time.

The core issue is **workspace load creep** — the inability to maintain control and hygiene as documentation scales. Users need a way to:

- See all active instructions across their workspace at a glance
- Enable or disable instructions without manually editing markdown files
- Maintain a historical record of disabled instructions (without letting the AI see them)
- Keep their existing workspace structure intact (no forced reorganization)
- Handle bidirectional synchronization (Morch updates files, and filesystem changes reflect in Morch)

## 2. Vision

Morch is a desktop application that serves as a **control panel for AI workspace instructions**. It provides a UI layer on top of markdown-based workspace documentation, allowing users to manage instruction state without touching files directly.

Morch transforms static markdown into a live, toggleable dashboard where each workspace file appears as a column, and every instruction within that file is a toggle switch with a quick-reference name.

This is phase one of workspace management — controlling instructions only. Future phases may expand to skills, context blocks, and other workspace elements.

## 3. Core Features

### 3.1 Workspace Scanning & Detection
- On first launch, the app scans the workspace directory and identifies likely candidate files (CLAUDE.md, AGENTS.md, SKILLS folder, etc.)
- The app presents discovered files to the user with a checklist so they can select which files to manage
- Users can manually add or remove files from management
- The app stores this configuration locally so subsequent launches remember the user's preferences

### 3.2 Instruction Parsing
- The app treats each line in a markdown file as a potential instruction unit
- No upfront structural requirements — lines are parsed flexibly to capture instructions as users have written them
- Over time, usage patterns will inform best practices for instruction formatting

### 3.3 Instruction Display & Labeling
- Each instruction appears as an entry in the Morch dashboard
- Users can assign a quick-reference name (alias) to any instruction so they don't need to read the full text
- Example: full instruction "implement epistemically calibrated response patterns with uncertainty signals" gets labeled "uncertain-ai-fix"
- Metadata includes file size analysis (line count, word count) for each managed file

### 3.4 Toggle & State Management
- Users can enable or disable any instruction via toggle switch
- When toggled off, the instruction is:
  - Removed from the active markdown file
  - Moved to a disabled archive (separate location the AI cannot access)
- When toggled on, the instruction is restored from the archive to the active file
- The disabled archive is readable by the user but completely invisible to the AI agent

### 3.5 Bidirectional Synchronization
- Real-time or near-real-time sync in both directions:
  - **UI → Filesystem**: User toggles in the app → markdown files update immediately
  - **Filesystem → UI**: Manual edits to markdown files (or edits made by Claude via Claude Code) → Morch reflects changes immediately
- File watching ensures the app stays in sync even when external tools modify workspace files

### 3.6 Disabled Instructions Archive
- Disabled instructions are stored in a designated location (e.g., `.morch-disabled/` folder)
- The archive is structured and queryable so users can:
  - Review what they've disabled and why
  - Restore instructions if needed
  - Audit their workspace history

### 3.7 Configuration & Setup Wizard
- First-launch wizard:
  - Scans the workspace
  - Shows detected files with descriptions of what they do
  - User selects which files to manage
  - User can add custom files if needed
  - Configuration is saved for future launches
- Users can modify configuration at any time through app settings

## 4. User Flows

See `USER_FLOWS.md` for detailed walkthroughs of:
- Onboarding (first launch)
- Managing instructions
- External edits (Claude Code scenario)
- Disabling & restoring instructions

## 5. Technical Architecture

See `TECHNICAL_ARCHITECTURE.md` for full details on stack, components, data flow, and sync strategy.

## 6. File Structure

See `FILE_STRUCTURE.md` for workspace layout, disabled archive structure, and config file schema.

## 7. Phase One Scope

**In Scope**:
- Instruction management only
- No structural enforcement of workspace
- Flexible line-based parsing
- Basic toggle and disable/restore

**Out of Scope (Future Phases)**:
- Skill management (though skills may contain instructions)
- Context block management
- Advanced search and filtering
- Instruction versioning and history
- Sharing/collaboration features
- AI-assisted instruction generation

## 8. Research Questions (To Be Answered by Usage)

- What is the best way to format instructions in markdown files (CLAUDE.md, AGENTS.md, etc.)?
- How do users naturally structure their workspaces?
- What metadata is most useful for instruction discovery and organization?
- Should the app suggest instruction names, or should users always manually assign them?
- How often do users actually toggle instructions on/off vs. deleting them permanently?

## 9. Success Metrics

- Users can disable an instruction and verify the AI no longer sees it
- Bidirectional sync works without data loss
- Users report reduced cognitive load managing large workspaces
- Usage data reveals common instruction patterns (informs phase two design)
- Zero data loss or corruption of disabled instructions
