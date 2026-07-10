# Technical Architecture — Morch

## 5.1 Technology Stack

- **Platform**: Desktop app (Electron, Tauri, or similar) — see `DECISIONS.md` for status
- **Language**: TypeScript / JavaScript (or language of choice)
- **File I/O**: Native filesystem access for reading/writing markdown
- **File Watching**: Native file watcher (chokidar or equivalent) for bidirectional sync
- **Storage**: Local JSON config file for app settings and instruction aliases
- **UI Framework**: React, Vue, or lightweight alternative

Note: Alexandre has prior experience with Tauri v2 + SQLite (from the "A Lista Infinita" / GamerDash project), which may be worth reusing as a stack pattern here.

## 5.2 Core Components

### Config Manager
- Stores user preferences: which files to manage, custom file paths, aliases for instructions
- Persists to `.orchestrator/config.json` or similar hidden directory

### File Scanner
- Initial scan of workspace directory
- Detects common markdown files and workspace structures
- Returns list of candidates for user selection

### Markdown Parser
- Reads markdown files line-by-line
- Extracts instructions (flexible parsing, no structural assumptions)
- Preserves line numbers and file structure
- Handles both active files and disabled archives

### File Watcher
- Monitors all managed files for external changes
- Triggers re-parse when changes detected
- Maintains sync between filesystem and UI state

### Instruction Manager
- In-memory representation of all instructions across all files
- Handles toggle operations (remove from active, move to disabled)
- Handles restore operations (move from disabled back to active)
- Manages aliases and metadata

### Disabled Archive Manager
- Maintains disabled instruction archive(s)
- Keeps track of what was disabled and when
- Allows restoration on demand
- Ensures AI never reads this data

## 5.3 Data Flow

```
Workspace Directory
        |
   File Scanner
        |
Candidate Files (user selects)
        |
   File Watcher (bidirectional)
        |
Markdown Parser <-> Instruction Manager
        |
   Dashboard UI
        |
   User Toggles
        |
Active Files + Disabled Archive
        |
AI reads Active Files (never sees Disabled Archive)
```

## 5.4 Bidirectional Sync Strategy

**UI -> Filesystem (Toggle Action)**
1. User toggles instruction off in dashboard
2. App locates instruction in source file by line number
3. App removes the line from the active file
4. App appends/writes instruction to disabled archive
5. App writes both files to disk
6. File watcher detects writes and updates internal state (no infinite loop due to change detection)

**Filesystem -> UI (External Edit)**
1. File watcher detects change to a managed markdown file
2. App re-parses the file
3. App compares new state to previous state (diff)
4. App updates in-memory instruction list
5. UI updates to reflect new instructions, removed instructions, or modified instructions
6. User sees changes in real-time

## 5.5 Preventing Sync Loops

- Track file modification timestamps to detect whether app made the write or external tool did
- Debounce file watcher events to avoid multiple rapid re-parses
- Use checksums or content hashing to detect actual changes vs. redundant writes
