use crate::parser::parse_markdown;
use crate::{archive, ManagedFile};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::Manager;

/// In-memory instruction record — schema per docs/FILE_STRUCTURE.md §6.4,
/// minus `createdAt`/`disabledAt`: nothing in Phase One persists those
/// timestamps yet (archive.rs's mirror is plain content, no metadata), and
/// M7's acceptance bar doesn't require them, so they're left out rather than
/// populated with fabricated values.
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Instruction {
    pub id: String,
    pub file: String,
    pub line_number: usize,
    pub content: String,
    pub alias: Option<String>,
    pub enabled: bool,
}

/// The single in-memory source of truth the dashboard (M8) will read from:
/// parser output + archive state + aliasing, merged once at `load` time and
/// then kept correct in place by `toggle`/`set_alias` — no full re-scan on
/// every state change (M7's acceptance bar).
///
/// A disabled instruction's `id`/`line_number` reflect its position within
/// its `.morch-disabled/` mirror file, not its original position in the
/// active file — consistent with the M5 decision (see DECISIONS.md,
/// 2026-07-10) that restore doesn't preserve original position. An alias
/// assigned while an instruction is active is carried across a toggle
/// in-memory (the same `Instruction` slot is updated, not replaced from
/// scratch), but the *id* it's keyed under changes, since ids are
/// position-derived.
pub struct InstructionManager {
    workspace_path: String,
    disabled_archive_path: String,
    instructions: Vec<Instruction>,
}

impl InstructionManager {
    /// Builds the manager by parsing every enabled managed file's active
    /// content plus its mirrored disabled-archive file (if any). Files with
    /// `enabled: false` (the "ignored file" flag, distinct from per-instruction
    /// enabled/disabled) are skipped entirely.
    pub fn load(
        workspace_path: String,
        managed_files: &[ManagedFile],
        instruction_aliases: &HashMap<String, String>,
        disabled_archive_path: String,
    ) -> Result<Self, String> {
        let root = PathBuf::from(&workspace_path);
        let mut instructions = Vec::new();

        for managed_file in managed_files.iter().filter(|f| f.enabled) {
            let active_path = root.join(&managed_file.path);
            let active_contents = fs::read_to_string(&active_path)
                .map_err(|e| format!("failed to read {}: {}", active_path.display(), e))?;
            for parsed in parse_markdown(&managed_file.path, &active_contents) {
                instructions.push(Instruction {
                    alias: instruction_aliases.get(&parsed.id).cloned(),
                    id: parsed.id,
                    file: parsed.file,
                    line_number: parsed.line_number,
                    content: parsed.content,
                    enabled: true,
                });
            }

            let archive_rel = format!("{disabled_archive_path}/{}", managed_file.path);
            if let Ok(archive_contents) = fs::read_to_string(root.join(&archive_rel)) {
                for parsed in parse_markdown(&archive_rel, &archive_contents) {
                    instructions.push(Instruction {
                        alias: instruction_aliases.get(&parsed.id).cloned(),
                        id: parsed.id,
                        file: managed_file.path.clone(),
                        line_number: parsed.line_number,
                        content: parsed.content,
                        enabled: false,
                    });
                }
            }
        }

        Ok(Self { workspace_path, disabled_archive_path, instructions })
    }

    pub fn instructions(&self) -> &[Instruction] {
        &self.instructions
    }

    /// (enabled, total) counts for a single file — List sidebar / Board
    /// column headers both need this, kept in sync without re-parsing.
    /// Exercised by tests today; M8's dashboard is the real caller once wired.
    #[allow(dead_code)]
    pub fn counts(&self, file: &str) -> (usize, usize) {
        let total = self.instructions.iter().filter(|i| i.file == file).count();
        let enabled = self.instructions.iter().filter(|i| i.file == file && i.enabled).count();
        (enabled, total)
    }

    pub fn toggle(&mut self, id: &str) -> Result<(), String> {
        let idx = self.instructions.iter().position(|i| i.id == id).ok_or_else(|| format!("no instruction with id '{id}'"))?;
        if self.instructions[idx].enabled {
            self.disable(idx)
        } else {
            self.enable(idx)
        }
    }

    fn disable(&mut self, idx: usize) -> Result<(), String> {
        let file = self.instructions[idx].file.clone();
        let line_number = self.instructions[idx].line_number;
        let content = self.instructions[idx].content.clone();
        let alias = self.instructions[idx].alias.clone();

        archive::disable_instruction(self.workspace_path.clone(), file.clone(), line_number, self.disabled_archive_path.clone())?;

        // Removing this line from the active file shifts every later active
        // line in the same file up by one — mirrored here instead of re-parsing.
        for instr in self.instructions.iter_mut() {
            if instr.enabled && instr.file == file && instr.line_number > line_number {
                instr.line_number -= 1;
            }
        }

        let archive_rel = format!("{}/{}", self.disabled_archive_path, file);
        let disabled_position = self.instructions.iter().filter(|i| !i.enabled && i.file == file).count() + 1;
        self.instructions[idx] = Instruction {
            id: format!("line_{disabled_position}_{archive_rel}"),
            file,
            line_number: disabled_position,
            content,
            alias,
            enabled: false,
        };

        Ok(())
    }

    fn enable(&mut self, idx: usize) -> Result<(), String> {
        let file = self.instructions[idx].file.clone();
        let content = self.instructions[idx].content.clone();
        let alias = self.instructions[idx].alias.clone();
        let archive_line_number = self.instructions[idx].line_number;

        archive::enable_instruction(self.workspace_path.clone(), file.clone(), content.clone(), self.disabled_archive_path.clone())?;

        // Removing this line from the archive mirror shifts every later
        // disabled line in the same file's mirror up by one; their ids are
        // position-derived, so they need updating too.
        let archive_rel = format!("{}/{}", self.disabled_archive_path, file);
        for instr in self.instructions.iter_mut() {
            if !instr.enabled && instr.file == file && instr.line_number > archive_line_number {
                instr.line_number -= 1;
                instr.id = format!("line_{}_{archive_rel}", instr.line_number);
            }
        }

        let active_position = self.instructions.iter().filter(|i| i.enabled && i.file == file).count() + 1;
        self.instructions[idx] = Instruction {
            id: format!("line_{active_position}_{file}"),
            file,
            line_number: active_position,
            content,
            alias,
            enabled: true,
        };

        Ok(())
    }

    pub fn set_alias(&mut self, id: &str, alias: Option<String>) -> Result<(), String> {
        let instr = self.instructions.iter_mut().find(|i| i.id == id).ok_or_else(|| format!("no instruction with id '{id}'"))?;
        instr.alias = alias;
        self.persist_aliases()
    }

    /// Current alias map keyed by each instruction's *live* id — since ids
    /// are position-derived and get rewritten on toggle, rebuilding the map
    /// from current state (rather than patching a stored one) is what keeps
    /// `.morch/config.json`'s `instructionAliases` from accumulating stale keys.
    fn instruction_aliases(&self) -> HashMap<String, String> {
        self.instructions.iter().filter_map(|i| i.alias.as_ref().map(|a| (i.id.clone(), a.clone()))).collect()
    }

    // Reads/writes `.morch/config.json` directly rather than calling
    // lib.rs's `read_config`/`write_config` Tauri commands — those are
    // `#[tauri::command]`-attributed and marking them non-private to call
    // cross-module trips a proc-macro name collision unrelated to this logic
    // (`__cmd__read_config`/`__tauri_command_name_read_config` reported as
    // defined twice at their own definition site, reproducible even via a
    // fully-qualified call with no `use` import). Duplicating four lines of
    // file I/O here was simpler than chasing that further.
    fn persist_aliases(&self) -> Result<(), String> {
        let config_path = PathBuf::from(&self.workspace_path).join(".morch").join("config.json");
        let contents = fs::read_to_string(&config_path).map_err(|e| format!("failed to read {}: {}", config_path.display(), e))?;
        let mut config: crate::MorchConfig = serde_json::from_str(&contents).map_err(|e| format!("failed to parse config: {}", e))?;
        config.instruction_aliases = self.instruction_aliases();
        let serialized = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
        fs::write(&config_path, serialized).map_err(|e| format!("failed to write {}: {}", config_path.display(), e))
    }
}

#[derive(Default)]
pub struct InstructionManagerState(pub Mutex<Option<InstructionManager>>);

#[tauri::command]
pub fn load_instructions(app: tauri::AppHandle, workspace_path: String, config: crate::MorchConfig) -> Result<Vec<Instruction>, String> {
    let manager = InstructionManager::load(workspace_path, &config.managed_files, &config.instruction_aliases, config.disabled_archive_path)?;
    let result = manager.instructions().to_vec();
    let state = app.state::<InstructionManagerState>();
    *state.0.lock().unwrap() = Some(manager);
    Ok(result)
}

#[tauri::command]
pub fn toggle_instruction(app: tauri::AppHandle, id: String) -> Result<Vec<Instruction>, String> {
    let state = app.state::<InstructionManagerState>();
    let mut guard = state.0.lock().unwrap();
    let manager = guard.as_mut().ok_or("no workspace loaded — call load_instructions first")?;
    manager.toggle(&id)?;
    Ok(manager.instructions().to_vec())
}

#[tauri::command]
pub fn set_instruction_alias(app: tauri::AppHandle, id: String, alias: Option<String>) -> Result<Vec<Instruction>, String> {
    let state = app.state::<InstructionManagerState>();
    let mut guard = state.0.lock().unwrap();
    let manager = guard.as_mut().ok_or("no workspace loaded — call load_instructions first")?;
    manager.set_alias(&id, alias)?;
    Ok(manager.instructions().to_vec())
}

#[cfg(test)]
mod tests {
    use super::*;

    struct TempWorkspace {
        path: PathBuf,
    }

    impl TempWorkspace {
        fn new(name: &str) -> Self {
            let path = std::env::temp_dir().join(format!("morch-instructions-test-{name}-{}", std::process::id()));
            fs::create_dir_all(&path).unwrap();
            Self { path }
        }

        fn workspace_path(&self) -> String {
            self.path.to_string_lossy().to_string()
        }
    }

    impl Drop for TempWorkspace {
        fn drop(&mut self) {
            fs::remove_dir_all(&self.path).ok();
        }
    }

    const ARCHIVE_DIR: &str = ".morch-disabled";

    fn managed(path: &str) -> ManagedFile {
        ManagedFile { name: path.to_string(), path: path.to_string(), enabled: true }
    }

    #[test]
    fn loads_active_and_disabled_instructions_with_correct_counts() {
        let ws = TempWorkspace::new("load-mixed");
        fs::write(ws.path.join("CLAUDE.md"), "keep one\nkeep two\n").unwrap();
        fs::create_dir_all(ws.path.join(ARCHIVE_DIR)).unwrap();
        fs::write(ws.path.join(ARCHIVE_DIR).join("CLAUDE.md"), "disabled one\n").unwrap();

        let manager =
            InstructionManager::load(ws.workspace_path(), &[managed("CLAUDE.md")], &HashMap::new(), ARCHIVE_DIR.to_string()).unwrap();

        assert_eq!(manager.instructions().len(), 3);
        assert_eq!(manager.counts("CLAUDE.md"), (2, 3));
        assert!(manager.instructions().iter().any(|i| i.content == "disabled one" && !i.enabled));
    }

    #[test]
    fn ignored_files_are_skipped_entirely() {
        let ws = TempWorkspace::new("ignored-file");
        fs::write(ws.path.join("CLAUDE.md"), "a line\n").unwrap();
        let mut ignored = managed("CLAUDE.md");
        ignored.enabled = false;

        let manager = InstructionManager::load(ws.workspace_path(), &[ignored], &HashMap::new(), ARCHIVE_DIR.to_string()).unwrap();
        assert!(manager.instructions().is_empty());
    }

    #[test]
    fn toggling_off_moves_instruction_and_shifts_sibling_line_numbers() {
        let ws = TempWorkspace::new("toggle-off");
        fs::write(ws.path.join("CLAUDE.md"), "line one\nline two\nline three\n").unwrap();

        let mut manager =
            InstructionManager::load(ws.workspace_path(), &[managed("CLAUDE.md")], &HashMap::new(), ARCHIVE_DIR.to_string()).unwrap();
        assert_eq!(manager.counts("CLAUDE.md"), (3, 3));

        let target_id = manager.instructions().iter().find(|i| i.content == "line two").unwrap().id.clone();
        manager.toggle(&target_id).unwrap();

        assert_eq!(manager.counts("CLAUDE.md"), (2, 3), "total stays the same, enabled drops by one");

        let line_three = manager.instructions().iter().find(|i| i.content == "line three").unwrap();
        assert_eq!(line_three.line_number, 2, "shifted down after line two was removed from the active file");

        let disabled = manager.instructions().iter().find(|i| i.content == "line two").unwrap();
        assert!(!disabled.enabled);

        // Filesystem actually reflects the same state the in-memory model claims.
        let active_contents = fs::read_to_string(ws.path.join("CLAUDE.md")).unwrap();
        assert_eq!(active_contents, "line one\nline three\n");
    }

    #[test]
    fn toggling_on_restores_instruction_and_shifts_sibling_line_numbers() {
        let ws = TempWorkspace::new("toggle-on");
        fs::create_dir_all(ws.path.join(ARCHIVE_DIR)).unwrap();
        fs::write(ws.path.join(ARCHIVE_DIR).join("CLAUDE.md"), "disabled a\ndisabled b\n").unwrap();
        fs::write(ws.path.join("CLAUDE.md"), "active line\n").unwrap();

        let mut manager =
            InstructionManager::load(ws.workspace_path(), &[managed("CLAUDE.md")], &HashMap::new(), ARCHIVE_DIR.to_string()).unwrap();

        let target_id = manager.instructions().iter().find(|i| i.content == "disabled a").unwrap().id.clone();
        manager.toggle(&target_id).unwrap();

        assert_eq!(manager.counts("CLAUDE.md"), (2, 3));

        let restored = manager.instructions().iter().find(|i| i.content == "disabled a").unwrap();
        assert!(restored.enabled);
        assert_eq!(restored.line_number, 2, "appended after the one already-active line");

        let remaining_disabled = manager.instructions().iter().find(|i| i.content == "disabled b").unwrap();
        assert_eq!(remaining_disabled.line_number, 1, "shifted up after disabled a was removed from the archive mirror");

        let active_contents = fs::read_to_string(ws.path.join("CLAUDE.md")).unwrap();
        assert_eq!(active_contents, "active line\ndisabled a\n");
    }

    #[test]
    fn toggling_in_one_file_does_not_affect_another_files_numbering() {
        let ws = TempWorkspace::new("multi-file");
        fs::write(ws.path.join("CLAUDE.md"), "a\nb\nc\n").unwrap();
        fs::write(ws.path.join("AGENTS.md"), "x\ny\nz\n").unwrap();

        let mut manager = InstructionManager::load(
            ws.workspace_path(),
            &[managed("CLAUDE.md"), managed("AGENTS.md")],
            &HashMap::new(),
            ARCHIVE_DIR.to_string(),
        )
        .unwrap();

        let target_id = manager.instructions().iter().find(|i| i.content == "a").unwrap().id.clone();
        manager.toggle(&target_id).unwrap();

        assert_eq!(manager.counts("CLAUDE.md"), (2, 3));
        assert_eq!(manager.counts("AGENTS.md"), (3, 3), "untouched file's counts must not shift");

        for instr in manager.instructions().iter().filter(|i| i.file == "AGENTS.md") {
            assert!(instr.enabled);
        }
    }

    fn write_test_config(ws: &TempWorkspace, config: &crate::MorchConfig) {
        let morch_dir = ws.path.join(".morch");
        fs::create_dir_all(&morch_dir).unwrap();
        fs::write(morch_dir.join("config.json"), serde_json::to_string_pretty(config).unwrap()).unwrap();
    }

    fn read_test_config(ws: &TempWorkspace) -> crate::MorchConfig {
        let contents = fs::read_to_string(ws.path.join(".morch").join("config.json")).unwrap();
        serde_json::from_str(&contents).unwrap()
    }

    #[test]
    fn set_alias_updates_in_memory_and_persists_to_config() {
        let ws = TempWorkspace::new("set-alias");
        fs::write(ws.path.join("CLAUDE.md"), "only line\n").unwrap();
        write_test_config(
            &ws,
            &crate::MorchConfig {
                version: "1.0".to_string(),
                workspace_path: ws.workspace_path(),
                managed_files: vec![managed("CLAUDE.md")],
                instruction_aliases: HashMap::new(),
                disabled_archive_path: ARCHIVE_DIR.to_string(),
                last_scan_time: None,
            },
        );

        let mut manager =
            InstructionManager::load(ws.workspace_path(), &[managed("CLAUDE.md")], &HashMap::new(), ARCHIVE_DIR.to_string()).unwrap();
        let id = manager.instructions()[0].id.clone();

        manager.set_alias(&id, Some("my-alias".to_string())).unwrap();
        assert_eq!(manager.instructions()[0].alias, Some("my-alias".to_string()));

        let persisted = read_test_config(&ws);
        assert_eq!(persisted.instruction_aliases.get(&id), Some(&"my-alias".to_string()));
    }

    #[test]
    fn alias_survives_a_toggle_round_trip_under_its_new_id() {
        let ws = TempWorkspace::new("alias-survives-toggle");
        fs::write(ws.path.join("CLAUDE.md"), "only line\n").unwrap();
        write_test_config(
            &ws,
            &crate::MorchConfig {
                version: "1.0".to_string(),
                workspace_path: ws.workspace_path(),
                managed_files: vec![managed("CLAUDE.md")],
                instruction_aliases: HashMap::new(),
                disabled_archive_path: ARCHIVE_DIR.to_string(),
                last_scan_time: None,
            },
        );

        let mut manager =
            InstructionManager::load(ws.workspace_path(), &[managed("CLAUDE.md")], &HashMap::new(), ARCHIVE_DIR.to_string()).unwrap();
        let original_id = manager.instructions()[0].id.clone();
        manager.set_alias(&original_id, Some("keep-me".to_string())).unwrap();

        manager.toggle(&original_id).unwrap();
        let disabled = &manager.instructions()[0];
        assert!(!disabled.enabled);
        assert_ne!(disabled.id, original_id, "id is position-derived and changes on toggle");
        assert_eq!(disabled.alias, Some("keep-me".to_string()), "alias carries over with the in-memory slot");
    }

    #[test]
    fn loads_against_this_projects_real_claude_md_matching_parser_findings() {
        let root = PathBuf::from(env!("CARGO_MANIFEST_DIR")).parent().unwrap().to_path_buf();
        let manager = InstructionManager::load(
            root.to_string_lossy().to_string(),
            &[managed("CLAUDE.md")],
            &HashMap::new(),
            ARCHIVE_DIR.to_string(),
        )
        .unwrap();

        // No .morch-disabled/ exists at the project root, so everything found
        // must be active — same 11 lines M4's parser test already validated.
        assert_eq!(manager.instructions().len(), 11);
        assert_eq!(manager.counts("CLAUDE.md"), (11, 11));
    }
}
