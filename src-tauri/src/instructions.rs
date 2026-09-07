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

        archive::enable_instruction(self.workspace_path.clone(), file.clone(), content.clone(), self.disabled_archive_path.clone())?;

        // archive::enable_instruction removes the *first* line in the archive
        // mirror matching `content` (content-addressed, not position-addressed
        // — see archive.rs). If the same file has multiple disabled
        // instructions with identical content (plausible for log-style files
        // like DECISIONS.md), that isn't necessarily the entry at `idx` —
        // find whichever in-memory entry actually has the lowest line_number
        // among matches, since that's the one `.position()` in archive.rs
        // would have found first, and pivot the shift/promotion on it instead
        // of blindly trusting `idx`.
        let actual_idx = self
            .instructions
            .iter()
            .enumerate()
            .filter(|(_, i)| !i.enabled && i.file == file && i.content == content)
            .min_by_key(|(_, i)| i.line_number)
            .map(|(i, _)| i)
            .expect("archive::enable_instruction succeeded, so a matching disabled instruction must exist");

        let archive_line_number = self.instructions[actual_idx].line_number;
        let alias = self.instructions[actual_idx].alias.clone();

        // Removing this line from the archive mirror shifts every later
        // disabled line in the same file's mirror up by one; their ids are
        // position-derived, so they need updating too. This also correctly
        // shifts `idx` itself when `idx != actual_idx` (a later duplicate
        // that stays disabled, just at one lower a position).
        let archive_rel = format!("{}/{}", self.disabled_archive_path, file);
        for instr in self.instructions.iter_mut() {
            if !instr.enabled && instr.file == file && instr.line_number > archive_line_number {
                instr.line_number -= 1;
                instr.id = format!("line_{}_{archive_rel}", instr.line_number);
            }
        }

        let active_position = self.instructions.iter().filter(|i| i.enabled && i.file == file).count() + 1;
        self.instructions[actual_idx] = Instruction {
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
        if !self.instructions.iter().any(|i| i.id == id) {
            return Err(format!("no instruction with id '{id}'"));
        }

        // Persist before mutating in-memory state: persist_aliases() rebuilds
        // the whole map from current state, so if in-memory were updated
        // first and the write then failed, the "failed" alias would still be
        // sitting in memory and get silently written by the next unrelated,
        // successful set_alias call (caught in review before merging M7).
        let mut prospective_aliases = self.instruction_aliases();
        match &alias {
            Some(value) => {
                prospective_aliases.insert(id.to_string(), value.clone());
            }
            None => {
                prospective_aliases.remove(id);
            }
        }
        self.persist_aliases(&prospective_aliases)?;

        let instr = self.instructions.iter_mut().find(|i| i.id == id).expect("existence already checked above");
        instr.alias = alias;
        Ok(())
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
    fn persist_aliases(&self, aliases: &HashMap<String, String>) -> Result<(), String> {
        let config_path = PathBuf::from(&self.workspace_path).join(".morch").join("config.json");
        let contents = fs::read_to_string(&config_path).map_err(|e| format!("failed to read {}: {}", config_path.display(), e))?;
        let mut config: crate::MorchConfig = serde_json::from_str(&contents).map_err(|e| format!("failed to parse config: {}", e))?;
        config.instruction_aliases = aliases.clone();
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
    fn enabling_with_duplicate_content_in_the_archive_keeps_bookkeeping_consistent_with_disk() {
        // archive::enable_instruction removes the *first* matching-content
        // line, which may not be the in-memory entry the caller named if the
        // same file has multiple disabled instructions with identical
        // content (plausible for log-style files like DECISIONS.md).
        let ws = TempWorkspace::new("enable-duplicate-content");
        fs::create_dir_all(ws.path.join(ARCHIVE_DIR)).unwrap();
        fs::write(ws.path.join(ARCHIVE_DIR).join("CLAUDE.md"), "dup\nunique\ndup\n").unwrap();
        fs::write(ws.path.join("CLAUDE.md"), "active line\n").unwrap();

        let mut manager =
            InstructionManager::load(ws.workspace_path(), &[managed("CLAUDE.md")], &HashMap::new(), ARCHIVE_DIR.to_string()).unwrap();

        // Target the *second* "dup" (line_number 3) — archive.rs will still
        // physically remove the *first* one (line_number 1).
        let second_dup_id =
            manager.instructions().iter().filter(|i| i.content == "dup").max_by_key(|i| i.line_number).unwrap().id.clone();
        manager.toggle(&second_dup_id).unwrap();

        // Disk: the first "dup" (line 1) was removed from the archive mirror,
        // leaving "unique" then "dup" — and "dup" appended to the active file.
        let archive_contents = fs::read_to_string(ws.path.join(ARCHIVE_DIR).join("CLAUDE.md")).unwrap();
        assert_eq!(archive_contents, "unique\ndup\n");
        let active_contents = fs::read_to_string(ws.path.join("CLAUDE.md")).unwrap();
        assert_eq!(active_contents, "active line\ndup\n");

        // In-memory model must match that exactly: 1 active line (original) +
        // 3 disabled lines (original) = 4 total, unchanged by a toggle;
        // 2 now enabled ("active line" + the promoted "dup").
        assert_eq!(manager.counts("CLAUDE.md"), (2, 4));
        let remaining_disabled: Vec<_> = manager.instructions().iter().filter(|i| !i.enabled && i.content == "dup").collect();
        assert_eq!(remaining_disabled.len(), 1, "exactly one dup instruction stays disabled");
        assert_eq!(remaining_disabled[0].line_number, 2, "shifted down from 3 to 2 after the first dup (line 1) was removed");

        let unique = manager.instructions().iter().find(|i| i.content == "unique").unwrap();
        assert!(!unique.enabled);
        assert_eq!(unique.line_number, 1, "also shifted down from its original archive position of 2");
    }

    #[test]
    fn set_alias_does_not_persist_when_config_write_fails() {
        let ws = TempWorkspace::new("set-alias-failure");
        fs::write(ws.path.join("CLAUDE.md"), "line one\nline two\n").unwrap();
        // Deliberately no .morch/config.json written — persist_aliases will fail.

        let mut manager =
            InstructionManager::load(ws.workspace_path(), &[managed("CLAUDE.md")], &HashMap::new(), ARCHIVE_DIR.to_string()).unwrap();
        let first_id = manager.instructions()[0].id.clone();
        let second_id = manager.instructions()[1].id.clone();

        let result = manager.set_alias(&first_id, Some("should-not-stick".to_string()));
        assert!(result.is_err(), "persist should fail with no config.json on disk");
        assert_eq!(
            manager.instructions().iter().find(|i| i.id == first_id).unwrap().alias,
            None,
            "a failed persist must not leave the in-memory alias applied"
        );

        // Now make persistence possible and set an unrelated alias — this
        // must not silently resurrect the alias from the failed call above.
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
        manager.set_alias(&second_id, Some("legit-alias".to_string())).unwrap();

        let persisted = read_test_config(&ws);
        assert_eq!(persisted.instruction_aliases.len(), 1, "only the successful alias should be persisted");
        assert_eq!(persisted.instruction_aliases.get(&second_id), Some(&"legit-alias".to_string()));
        assert_eq!(persisted.instruction_aliases.get(&first_id), None, "the earlier failed alias must not have been resurrected");
    }

    // M10 QA pass (docs/IMPLEMENTATION_PLAN.md, SPEC.md §9, GitHub issue #6):
    // "a disabled instruction is genuinely invisible to the AI" and "zero data
    // loss across repeated toggle cycles" verified here as automated tests
    // rather than manual spot-checking, per the milestone's acceptance bar.

    #[test]
    fn disabled_instruction_is_genuinely_absent_from_the_file_an_ai_would_read() {
        let ws = TempWorkspace::new("ai-invisibility");
        fs::write(ws.path.join("CLAUDE.md"), "keep this\nsecret internal note\nkeep that\n").unwrap();

        let mut manager =
            InstructionManager::load(ws.workspace_path(), &[managed("CLAUDE.md")], &HashMap::new(), ARCHIVE_DIR.to_string()).unwrap();
        let target_id = manager.instructions().iter().find(|i| i.content == "secret internal note").unwrap().id.clone();
        manager.toggle(&target_id).unwrap();

        // This is exactly what an AI agent reading the managed file would see —
        // Core Principle #3 (CLAUDE.md) is the product promise being checked.
        let ai_visible_contents = fs::read_to_string(ws.path.join("CLAUDE.md")).unwrap();
        assert!(
            !ai_visible_contents.contains("secret internal note"),
            "a disabled instruction must be genuinely invisible to the AI-facing file"
        );
        assert!(ai_visible_contents.contains("keep this") && ai_visible_contents.contains("keep that"));

        // It must still be readable by the user via the archive, per SPEC.md §3.6.
        let archived_contents = fs::read_to_string(ws.path.join(ARCHIVE_DIR).join("CLAUDE.md")).unwrap();
        assert!(archived_contents.contains("secret internal note"));
    }

    #[test]
    fn toggling_every_instruction_off_and_on_fifty_times_causes_zero_data_loss() {
        let ws = TempWorkspace::new("stress-cycle");
        let original = "line one\nline two\nline three\nline four\n";
        fs::write(ws.path.join("CLAUDE.md"), original).unwrap();

        let mut manager =
            InstructionManager::load(ws.workspace_path(), &[managed("CLAUDE.md")], &HashMap::new(), ARCHIVE_DIR.to_string()).unwrap();
        let mut original_lines: Vec<&str> = original.lines().collect();
        original_lines.sort();

        for cycle in 0..50 {
            // Disable every currently-enabled instruction, fetching ids fresh
            // each time rather than caching them — ids are position-derived
            // (see DECISIONS.md, 2026-07-11) and shift as siblings are removed.
            while let Some(id) =
                manager.instructions().iter().find(|i| i.file == "CLAUDE.md" && i.enabled).map(|i| i.id.clone())
            {
                manager.toggle(&id).unwrap();
            }

            let active_contents = fs::read_to_string(ws.path.join("CLAUDE.md")).unwrap();
            assert!(active_contents.trim().is_empty(), "cycle {cycle}: every instruction should be disabled and gone from the active file");

            // Restore every disabled instruction.
            while let Some(id) =
                manager.instructions().iter().find(|i| i.file == "CLAUDE.md" && !i.enabled).map(|i| i.id.clone())
            {
                manager.toggle(&id).unwrap();
            }

            // Restore doesn't preserve original line position (see DECISIONS.md,
            // 2026-07-10) — comparing the sorted line set is the actual Phase One
            // "zero data loss" guarantee: every line's content survives, in some order.
            let restored_contents = fs::read_to_string(ws.path.join("CLAUDE.md")).unwrap();
            let mut restored_lines: Vec<&str> = restored_contents.lines().collect();
            restored_lines.sort();
            assert_eq!(restored_lines, original_lines, "cycle {cycle}: same set of lines must survive a full off/on cycle");
            assert_eq!(manager.counts("CLAUDE.md"), (4, 4), "cycle {cycle}: back to fully enabled, no drops or duplicates");
        }
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
