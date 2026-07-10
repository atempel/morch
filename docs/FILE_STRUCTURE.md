# File Structure — Morch

## 6.1 Workspace Directory Layout (Example)

```
my-workspace/
├── CLAUDE.md
├── AGENTS.md
├── DECISIONS.md
├── SKILLS/
│   ├── uncertain-ai-fix.md
│   └── context-engineering.md
├── .morch-disabled/
│   ├── CLAUDE.md
│   ├── AGENTS.md
│   └── SKILLS/
└── .morch/
    └── config.json
```

## 6.2 Disabled Archive Structure

**Option A: Separate `.morch-disabled/` folder (recommended — see DECISIONS.md)**
- Folder name carries the Morch branding; files inside keep their original, clean names
- Mirror structure of active files
- CLAUDE.md → .morch-disabled/CLAUDE.md
- AGENTS.md → .morch-disabled/AGENTS.md
- SKILLS/ → .morch-disabled/SKILLS/ (mirrored as a subfolder)
- Simple and parallel to active structure

**Option B: Single `DISABLED.md` file**
- All disabled instructions in one file
- Prefixed with source file + timestamp
- Simpler but less organized as workspace grows

## 6.3 App Configuration File (`.orchestrator/config.json`)

Each `managedFiles` entry's `enabled` flag is what powers the "ignore file" capability in the dashboard (see `DESIGN.md` Layout section): ignoring a file sets `enabled: false` without deleting the config entry, so the file drops out of the sidebar/Board view but stays fully restorable — this is distinct from actually removing a file from `managedFiles` entirely, which is a separate, more destructive action.

```json
{
  "version": "1.0",
  "workspacePath": "/path/to/my-workspace",
  "managedFiles": [
    {
      "name": "CLAUDE.md",
      "path": "CLAUDE.md",
      "enabled": true
    },
    {
      "name": "AGENTS.md",
      "path": "AGENTS.md",
      "enabled": true
    },
    {
      "name": "SKILLS/uncertain-ai-fix.md",
      "path": "SKILLS/uncertain-ai-fix.md",
      "enabled": true
    }
  ],
  "instructionAliases": {
    "line_42_CLAUDE.md": "uncertain-ai-fix",
    "line_156_AGENTS.md": "research-mode",
    "line_8_SKILLS/context-engineering.md": "structured-thinking"
  },
  "disabledArchivePath": ".morch-disabled",
  "lastScanTime": "2026-07-09T15:30:00Z"
}
```

## 6.4 Instruction Metadata (In-Memory)

Each instruction is tracked with:

| Field | Type | Description |
|---|---|---|
| `id` | string | unique identifier (file + line number) |
| `file` | string | source file path |
| `lineNumber` | number | original line number |
| `content` | string | full instruction text |
| `alias` | string \| null | user-assigned quick name (optional) |
| `enabled` | boolean | current state |
| `createdAt` | timestamp | when first detected |
| `disabledAt` | timestamp \| null | when disabled (if applicable) |
