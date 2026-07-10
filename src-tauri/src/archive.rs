use std::fs;
use std::path::{Path, PathBuf};

/// Removes the given 1-indexed line from the active file and appends its
/// content to the mirrored disabled-archive file (creating `.morch-disabled/`
/// and any nested parent directories as needed). This is the actual product
/// promise behind Core Principle #3: after this call, the AI-facing active
/// file no longer contains the line at all.
///
/// Restore (`enable_instruction`) appends the line back at the *end* of the
/// active file rather than reinserting at its original position — Phase One
/// only promises the line's content survives the round trip byte-for-byte,
/// not its original position (see docs/IMPLEMENTATION_PLAN.md M5).
#[tauri::command]
pub fn disable_instruction(
    workspace_path: String,
    file_path: String,
    line_number: usize,
    disabled_archive_path: String,
) -> Result<(), String> {
    let active_path = PathBuf::from(&workspace_path).join(&file_path);
    let contents =
        fs::read_to_string(&active_path).map_err(|e| format!("failed to read {}: {}", active_path.display(), e))?;

    let mut lines: Vec<&str> = contents.lines().collect();
    if line_number == 0 || line_number > lines.len() {
        return Err(format!(
            "line {line_number} out of range for {file_path} ({} lines)",
            lines.len()
        ));
    }
    let removed = lines.remove(line_number - 1).to_string();
    write_lines(&active_path, &lines)?;

    let archive_path = PathBuf::from(&workspace_path).join(&disabled_archive_path).join(&file_path);
    append_line(&archive_path, &removed)?;

    Ok(())
}

/// Removes the first line matching `content` from the mirrored disabled-archive
/// file and appends it back onto the active file, restoring AI visibility.
#[tauri::command]
pub fn enable_instruction(
    workspace_path: String,
    file_path: String,
    content: String,
    disabled_archive_path: String,
) -> Result<(), String> {
    let archive_path = PathBuf::from(&workspace_path).join(&disabled_archive_path).join(&file_path);
    let archive_contents =
        fs::read_to_string(&archive_path).map_err(|e| format!("failed to read {}: {}", archive_path.display(), e))?;

    let mut archive_lines: Vec<&str> = archive_contents.lines().collect();
    let position = archive_lines
        .iter()
        .position(|line| *line == content)
        .ok_or_else(|| format!("'{content}' not found in disabled archive for {file_path}"))?;
    archive_lines.remove(position);
    write_lines(&archive_path, &archive_lines)?;

    let active_path = PathBuf::from(&workspace_path).join(&file_path);
    append_line(&active_path, &content)?;

    Ok(())
}

fn write_lines(path: &Path, lines: &[&str]) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let mut joined = lines.join("\n");
    if !lines.is_empty() {
        joined.push('\n');
    }
    fs::write(path, joined).map_err(|e| format!("failed to write {}: {}", path.display(), e))
}

fn append_line(path: &Path, line: &str) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let mut contents = fs::read_to_string(path).unwrap_or_default();
    if !contents.is_empty() && !contents.ends_with('\n') {
        contents.push('\n');
    }
    contents.push_str(line);
    contents.push('\n');
    fs::write(path, contents).map_err(|e| format!("failed to write {}: {}", path.display(), e))
}

#[cfg(test)]
mod tests {
    use super::*;

    struct TempWorkspace {
        path: PathBuf,
    }

    impl TempWorkspace {
        fn new(name: &str) -> Self {
            let path = std::env::temp_dir().join(format!("morch-archive-test-{name}-{}", std::process::id()));
            fs::create_dir_all(&path).unwrap();
            Self { path }
        }
    }

    impl Drop for TempWorkspace {
        fn drop(&mut self) {
            fs::remove_dir_all(&self.path).ok();
        }
    }

    const ARCHIVE_DIR: &str = ".morch-disabled";

    #[test]
    fn disabling_removes_line_from_active_file_and_archives_it() {
        let ws = TempWorkspace::new("disable-basic");
        let active_path = ws.path.join("CLAUDE.md");
        fs::write(&active_path, "line one\nline two\nline three\n").unwrap();

        disable_instruction(
            ws.path.to_string_lossy().to_string(),
            "CLAUDE.md".to_string(),
            2,
            ARCHIVE_DIR.to_string(),
        )
        .expect("disable_instruction failed");

        let active_contents = fs::read_to_string(&active_path).unwrap();
        assert_eq!(active_contents, "line one\nline three\n");
        assert!(
            !active_contents.contains("line two"),
            "Core Principle #3: the AI-facing file must not contain the disabled line"
        );

        let archive_contents = fs::read_to_string(ws.path.join(ARCHIVE_DIR).join("CLAUDE.md")).unwrap();
        assert_eq!(archive_contents, "line two\n");
    }

    #[test]
    fn enabling_restores_line_and_removes_it_from_archive() {
        let ws = TempWorkspace::new("enable-basic");
        let active_path = ws.path.join("CLAUDE.md");
        fs::write(&active_path, "line one\nline two\nline three\n").unwrap();

        disable_instruction(
            ws.path.to_string_lossy().to_string(),
            "CLAUDE.md".to_string(),
            2,
            ARCHIVE_DIR.to_string(),
        )
        .unwrap();

        enable_instruction(
            ws.path.to_string_lossy().to_string(),
            "CLAUDE.md".to_string(),
            "line two".to_string(),
            ARCHIVE_DIR.to_string(),
        )
        .expect("enable_instruction failed");

        let active_contents = fs::read_to_string(&active_path).unwrap();
        // Restored line's bytes are preserved exactly, even though position
        // isn't (it's appended, not reinserted at the original index).
        let restored_lines: Vec<&str> = active_contents.lines().collect();
        assert!(restored_lines.contains(&"line two"));
        assert_eq!(restored_lines.len(), 3, "zero data loss: still exactly 3 lines");

        let archive_contents = fs::read_to_string(ws.path.join(ARCHIVE_DIR).join("CLAUDE.md")).unwrap();
        assert_eq!(archive_contents, "", "archive entry removed after restore");
    }

    #[test]
    fn round_trip_preserves_line_set_with_zero_data_loss() {
        let ws = TempWorkspace::new("round-trip");
        let active_path = ws.path.join("AGENTS.md");
        let original = "alpha\nbeta\ngamma\ndelta\n";
        fs::write(&active_path, original).unwrap();

        disable_instruction(
            ws.path.to_string_lossy().to_string(),
            "AGENTS.md".to_string(),
            3, // "gamma"
            ARCHIVE_DIR.to_string(),
        )
        .unwrap();
        enable_instruction(
            ws.path.to_string_lossy().to_string(),
            "AGENTS.md".to_string(),
            "gamma".to_string(),
            ARCHIVE_DIR.to_string(),
        )
        .unwrap();

        let final_contents = fs::read_to_string(&active_path).unwrap();
        let mut final_lines: Vec<&str> = final_contents.lines().collect();
        let mut original_lines: Vec<&str> = original.lines().collect();
        final_lines.sort();
        original_lines.sort();
        assert_eq!(final_lines, original_lines, "same set of lines, byte-for-byte, after a full round trip");
    }

    #[test]
    fn creates_nested_archive_directories_on_first_disable() {
        let ws = TempWorkspace::new("nested-archive");
        let active_dir = ws.path.join("SKILLS");
        fs::create_dir_all(&active_dir).unwrap();
        fs::write(active_dir.join("my-skill.md"), "do the thing\n").unwrap();

        disable_instruction(
            ws.path.to_string_lossy().to_string(),
            "SKILLS/my-skill.md".to_string(),
            1,
            ARCHIVE_DIR.to_string(),
        )
        .expect("disable_instruction should create nested archive dirs");

        let archived = fs::read_to_string(ws.path.join(ARCHIVE_DIR).join("SKILLS").join("my-skill.md")).unwrap();
        assert_eq!(archived, "do the thing\n");
    }

    #[test]
    fn disabling_out_of_range_line_errors() {
        let ws = TempWorkspace::new("out-of-range");
        fs::write(ws.path.join("CLAUDE.md"), "only line\n").unwrap();

        let result = disable_instruction(
            ws.path.to_string_lossy().to_string(),
            "CLAUDE.md".to_string(),
            5,
            ARCHIVE_DIR.to_string(),
        );
        assert!(result.is_err());
    }

    #[test]
    fn enabling_missing_content_errors() {
        let ws = TempWorkspace::new("missing-content");
        fs::create_dir_all(ws.path.join(ARCHIVE_DIR)).unwrap();
        fs::write(ws.path.join(ARCHIVE_DIR).join("CLAUDE.md"), "something else\n").unwrap();
        fs::write(ws.path.join("CLAUDE.md"), "active line\n").unwrap();

        let result = enable_instruction(
            ws.path.to_string_lossy().to_string(),
            "CLAUDE.md".to_string(),
            "not in archive".to_string(),
            ARCHIVE_DIR.to_string(),
        );
        assert!(result.is_err());
    }

    #[test]
    fn multiple_disables_append_to_shared_archive_file() {
        let ws = TempWorkspace::new("multi-disable");
        let active_path = ws.path.join("CLAUDE.md");
        fs::write(&active_path, "keep\ndrop one\ndrop two\n").unwrap();

        disable_instruction(
            ws.path.to_string_lossy().to_string(),
            "CLAUDE.md".to_string(),
            2,
            ARCHIVE_DIR.to_string(),
        )
        .unwrap();
        // After removing line 2, "drop two" is now line 2.
        disable_instruction(
            ws.path.to_string_lossy().to_string(),
            "CLAUDE.md".to_string(),
            2,
            ARCHIVE_DIR.to_string(),
        )
        .unwrap();

        let active_contents = fs::read_to_string(&active_path).unwrap();
        assert_eq!(active_contents, "keep\n");

        let archive_contents = fs::read_to_string(ws.path.join(ARCHIVE_DIR).join("CLAUDE.md")).unwrap();
        assert_eq!(archive_contents, "drop one\ndrop two\n");
    }
}
