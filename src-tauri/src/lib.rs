mod archive;
mod instructions;
mod parser;
mod scanner;
mod watcher;

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{Emitter, Manager};

// Schema per docs/FILE_STRUCTURE.md §6.3.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ManagedFile {
    pub name: String,
    pub path: String,
    pub enabled: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MorchConfig {
    pub version: String,
    #[serde(rename = "workspacePath")]
    pub workspace_path: String,
    #[serde(rename = "managedFiles")]
    pub managed_files: Vec<ManagedFile>,
    #[serde(rename = "instructionAliases")]
    pub instruction_aliases: HashMap<String, String>,
    #[serde(rename = "disabledArchivePath")]
    pub disabled_archive_path: String,
    #[serde(rename = "lastScanTime")]
    pub last_scan_time: Option<String>,
}

/// Whether `.morch/config.json` already exists for the given workspace directory —
/// used to decide whether to run onboarding or go straight to the dashboard.
#[tauri::command]
fn config_exists(workspace_path: String) -> bool {
    PathBuf::from(&workspace_path).join(".morch").join("config.json").is_file()
}

/// Reads `.morch/config.json` from the given workspace directory.
#[tauri::command]
fn read_config(workspace_path: String) -> Result<MorchConfig, String> {
    let config_path = PathBuf::from(&workspace_path).join(".morch").join("config.json");
    let contents = fs::read_to_string(&config_path)
        .map_err(|e| format!("failed to read {}: {}", config_path.display(), e))?;
    serde_json::from_str(&contents).map_err(|e| format!("failed to parse config: {}", e))
}

/// Writes `.morch/config.json` under the given workspace directory, creating the `.morch/` dir if needed.
#[tauri::command]
fn write_config(workspace_path: String, config: MorchConfig) -> Result<(), String> {
    let morch_dir = PathBuf::from(&workspace_path).join(".morch");
    fs::create_dir_all(&morch_dir).map_err(|e| format!("failed to create {}: {}", morch_dir.display(), e))?;
    let config_path = morch_dir.join("config.json");
    let serialized = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
    fs::write(&config_path, serialized)
        .map_err(|e| format!("failed to write {}: {}", config_path.display(), e))
}

/// Holds the live filesystem watcher so it isn't dropped (and thus stopped)
/// after `watch_managed_files` returns. Replacing it (e.g. when the managed
/// file list changes) stops the previous watch as a side effect of the drop.
#[derive(Default)]
struct WatcherState(Mutex<Option<notify::RecommendedWatcher>>);

/// Starts watching the workspace's managed files for external changes.
/// Emits a `morch://external-change` event (payload: the changed file's
/// path, relative to `workspace_path`) for genuine external edits, while
/// filtering out the app's own toggle-driven writes (see watcher.rs).
#[tauri::command]
fn watch_managed_files(app: tauri::AppHandle, workspace_path: String, managed_files: Vec<String>) -> Result<(), String> {
    let root = PathBuf::from(&workspace_path);
    let paths: Vec<PathBuf> = managed_files.iter().map(|f| root.join(f)).collect();

    let app_handle = app.clone();
    let root_for_events = root.clone();
    let new_watcher = watcher::start_watching(paths, move |path| {
        let relative = path.strip_prefix(&root_for_events).unwrap_or(&path).to_string_lossy().to_string();
        let _ = app_handle.emit("morch://external-change", relative);
    })
    .map_err(|e| e.to_string())?;

    let state = app.state::<WatcherState>();
    *state.0.lock().unwrap() = Some(new_watcher);
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(WatcherState::default())
        .manage(instructions::InstructionManagerState::default())
        .invoke_handler(tauri::generate_handler![
            config_exists,
            read_config,
            write_config,
            scanner::scan_workspace,
            parser::parse_file,
            archive::disable_instruction,
            archive::enable_instruction,
            watch_managed_files,
            instructions::load_instructions,
            instructions::toggle_instruction,
            instructions::set_instruction_alias
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn round_trips_config_through_disk() {
        let tmp = std::env::temp_dir().join(format!("morch-test-{}", std::process::id()));
        fs::create_dir_all(&tmp).unwrap();
        let workspace_path = tmp.to_string_lossy().to_string();

        let mut instruction_aliases = HashMap::new();
        instruction_aliases.insert("line_42_CLAUDE.md".to_string(), "uncertain-ai-fix".to_string());

        let config = MorchConfig {
            version: "1.0".to_string(),
            workspace_path: workspace_path.clone(),
            managed_files: vec![ManagedFile {
                name: "CLAUDE.md".to_string(),
                path: "CLAUDE.md".to_string(),
                enabled: true,
            }],
            instruction_aliases,
            disabled_archive_path: ".morch-disabled".to_string(),
            last_scan_time: Some("2026-07-10T00:00:00Z".to_string()),
        };

        write_config(workspace_path.clone(), config.clone()).expect("write_config failed");
        let roundtripped = read_config(workspace_path.clone()).expect("read_config failed");

        assert_eq!(roundtripped.version, config.version);
        assert_eq!(roundtripped.managed_files.len(), 1);
        assert_eq!(roundtripped.managed_files[0].name, "CLAUDE.md");
        assert_eq!(
            roundtripped.instruction_aliases.get("line_42_CLAUDE.md"),
            Some(&"uncertain-ai-fix".to_string())
        );

        fs::remove_dir_all(&tmp).ok();
    }

    // M9 (docs/IMPLEMENTATION_PLAN.md, GitHub issue #5): backend-level proxy
    // for USER_FLOWS.md §4.3's "Claude Code edits CLAUDE.md live" scenario —
    // an external process rewrites the managed file, the watcher notices, and
    // a fresh load (mirroring the frontend's `reloadInstructions` on the
    // `morch://external-change` event) picks up the new/changed content. This
    // covers the watcher -> re-parse half of the flow automatically; it is not
    // a substitute for M9's stated acceptance bar, which requires the actual
    // dashboard passing manual verification (no Tauri window can be driven
    // from this headless test) — see DECISIONS.md, 2026-09-07.
    #[test]
    fn external_edit_is_detected_and_a_fresh_load_reflects_the_new_content() {
        let tmp = std::env::temp_dir().join(format!("morch-test-external-edit-{}", std::process::id()));
        fs::create_dir_all(&tmp).unwrap();
        let workspace_path = tmp.to_string_lossy().to_string();
        let claude_md = tmp.join("CLAUDE.md");
        fs::write(&claude_md, "original instruction\n").unwrap();

        let managed_files = vec![ManagedFile { name: "CLAUDE.md".to_string(), path: "CLAUDE.md".to_string(), enabled: true }];

        let initial = instructions::InstructionManager::load(
            workspace_path.clone(),
            &managed_files,
            &HashMap::new(),
            ".morch-disabled".to_string(),
        )
        .unwrap();
        assert_eq!(initial.instructions().len(), 1);

        let (tx, rx) = std::sync::mpsc::channel::<PathBuf>();
        let _watcher = watcher::start_watching(vec![claude_md.clone()], move |path| {
            let _ = tx.send(path);
        })
        .expect("start_watching failed");

        // Simulate Claude Code editing the file live: add a new instruction
        // and rewrite the existing one, via a plain external write (no
        // record_self_write — this must look exactly like a real external edit).
        std::thread::sleep(std::time::Duration::from_millis(100));
        fs::write(&claude_md, "rewritten instruction\na brand new instruction\n").unwrap();

        rx.recv_timeout(std::time::Duration::from_secs(2)).expect("expected the watcher to report the external edit");

        let reloaded = instructions::InstructionManager::load(
            workspace_path,
            &managed_files,
            &HashMap::new(),
            ".morch-disabled".to_string(),
        )
        .unwrap();

        assert_eq!(reloaded.instructions().len(), 2, "both the rewritten and the new line must be picked up");
        assert!(reloaded.instructions().iter().any(|i| i.content == "rewritten instruction"));
        assert!(reloaded.instructions().iter().any(|i| i.content == "a brand new instruction"));
        assert!(
            !reloaded.instructions().iter().any(|i| i.content == "original instruction"),
            "the pre-edit content must not linger in a fresh load"
        );

        fs::remove_dir_all(&tmp).ok();
    }
}
