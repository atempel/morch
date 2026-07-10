# User Flows — Morch

## 4.1 Onboarding (First Launch)

1. User opens the app and points it to a workspace directory
2. App scans the directory and identifies candidate files
3. Wizard displays found files: "CLAUDE.md (287 lines)", "AGENTS.md (156 lines)", "SKILLS folder", etc.
4. User checks/unchecks which files to manage
5. User can optionally add custom files not detected
6. Configuration is saved; wizard closes
7. Dashboard loads showing all instructions from selected files

## 4.2 Managing Instructions

1. User sees dashboard with columns for each managed file
2. Within each column, instructions are listed with toggles
3. User hovers over an instruction to see full text
4. User assigns a quick name (optional) to an instruction for easier reference
5. User toggles an instruction off
6. App removes the instruction from the markdown file
7. App moves it to the disabled archive
8. Next time the AI reads the workspace, that instruction is gone
9. User can toggle it back on anytime to restore it

## 4.3 External Edits (Claude Code Scenario)

1. User is working in a workspace where Claude Code modifies CLAUDE.md
2. Claude adds new instructions or rewrites existing ones
3. File watcher detects the change
4. Morch re-parses the file
5. Dashboard updates to show new/modified instructions
6. User sees the changes reflected immediately without restarting

## 4.4 Disabling & Restoring

1. User has 10 active instructions in CLAUDE.md
2. User decides 3 of them are outdated and toggles them off
3. Those 3 instructions move to `.morch-disabled/CLAUDE.md` (or similar)
4. User can view the disabled archive to see what they turned off
5. Later, user wants to re-enable one
6. User toggles it back on in the app (or directly in the disabled archive)
7. Instruction is restored to the active file
