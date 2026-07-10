use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

/// Directories never descended into: build/dependency output (never user
/// content) and anything hidden (dotfiles/dirs, e.g. `.git`, `.morch`).
const SKIP_DIRS: [&str; 4] = ["node_modules", "target", "dist", "dist-ssr"];

// Thresholds tuned against this project's own docs (see docs/PARSING_VALIDATION.md
// finding #4): DECISIONS.md has 16 dated headers / 42 bold-label lines, every
// other file in the project has at most 3 bold-label lines and 0 dated headers.
const DATE_HEADER_FLAG_THRESHOLD: usize = 2;
const BOLD_LABEL_FLAG_THRESHOLD: usize = 6;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ScannedFile {
    /// Path relative to the workspace root, forward-slash separated (e.g. "docs/SPEC.md").
    pub path: String,
    pub line_count: usize,
    pub word_count: usize,
    pub flagged: bool,
    pub flag_reason: Option<String>,
}

/// Read-only walk of a workspace directory, per SPEC.md §3.1. Detects candidate
/// markdown files (CLAUDE.md, AGENTS.md, files under a SKILLS/-style folder, etc.)
/// and flags log-style files (per PARSING_VALIDATION.md) without touching anything on disk.
#[tauri::command]
pub fn scan_workspace(workspace_path: String) -> Result<Vec<ScannedFile>, String> {
    let root = PathBuf::from(&workspace_path);
    let mut results = Vec::new();
    walk(&root, &root, &mut results)?;
    results.sort_by(|a, b| a.path.cmp(&b.path));
    Ok(results)
}

fn walk(root: &Path, dir: &Path, results: &mut Vec<ScannedFile>) -> Result<(), String> {
    let entries = fs::read_dir(dir).map_err(|e| format!("failed to read {}: {}", dir.display(), e))?;

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        let file_name = entry.file_name();
        let name = file_name.to_string_lossy();

        let file_type = entry.file_type().map_err(|e| e.to_string())?;

        if file_type.is_dir() {
            if name.starts_with('.') || SKIP_DIRS.contains(&name.as_ref()) {
                continue;
            }
            walk(root, &path, results)?;
        } else if file_type.is_file() && is_markdown(&path) {
            results.push(scan_file(root, &path)?);
        }
    }

    Ok(())
}

fn is_markdown(path: &Path) -> bool {
    path.extension()
        .and_then(|e| e.to_str())
        .map(|e| e.eq_ignore_ascii_case("md"))
        .unwrap_or(false)
}

fn scan_file(root: &Path, path: &Path) -> Result<ScannedFile, String> {
    let contents =
        fs::read_to_string(path).map_err(|e| format!("failed to read {}: {}", path.display(), e))?;

    let line_count = contents.lines().count();
    let word_count = contents.split_whitespace().count();
    let (flagged, flag_reason) = detect_log_style(&contents);

    let relative = path
        .strip_prefix(root)
        .unwrap_or(path)
        .to_string_lossy()
        .replace('\\', "/");

    Ok(ScannedFile {
        path: relative,
        line_count,
        word_count,
        flagged,
        flag_reason,
    })
}

/// Flags files matching the "log, not instructions" shape found in DECISIONS.md:
/// repeated dated section headers, or repeated multi-line `**Label**: text` blocks
/// (Decision/Rationale/Status) that a per-line toggle would split apart.
fn detect_log_style(contents: &str) -> (bool, Option<String>) {
    let date_headers = contents.lines().filter(|l| is_date_header_line(l)).count();
    if date_headers >= DATE_HEADER_FLAG_THRESHOLD {
        return (
            true,
            Some(format!(
                "Log-style — {date_headers} dated entries found. Entries span multiple lines; per-line toggling isn't recommended."
            )),
        );
    }

    let bold_labels = contents.lines().filter(|l| is_bold_label_colon_line(l)).count();
    if bold_labels >= BOLD_LABEL_FLAG_THRESHOLD {
        return (
            true,
            Some(
                "Log-style — repeated **Label**: entries found. Entries span multiple lines; per-line toggling isn't recommended."
                    .to_string(),
            ),
        );
    }

    (false, None)
}

/// Matches a markdown header starting with a YYYY-MM-DD date, e.g. `## 2026-07-09 — ...`.
fn is_date_header_line(line: &str) -> bool {
    let trimmed = line.trim_start();
    let Some(rest) = trimmed.strip_prefix("## ") else {
        return false;
    };
    let bytes = rest.as_bytes();
    if bytes.len() < 10 {
        return false;
    }
    let is_digit = |i: usize| bytes[i].is_ascii_digit();
    (0..4).all(is_digit) && bytes[4] == b'-' && (5..7).all(is_digit) && bytes[7] == b'-' && (8..10).all(is_digit)
}

/// Matches a line opening with a short bold label immediately followed by a colon,
/// e.g. `**Decision**: Build on Tauri v2...`. Deliberately anchored at line start so
/// numbered/bulleted bold text (`1. **No forced structure.** ...`) doesn't match.
fn is_bold_label_colon_line(line: &str) -> bool {
    let trimmed = line.trim_start();
    let Some(after_open) = trimmed.strip_prefix("**") else {
        return false;
    };
    let Some(label_end) = after_open.find("**") else {
        return false;
    };
    let label = &after_open[..label_end];
    if label.is_empty() || label.len() > 40 {
        return false;
    }
    after_open[label_end + 2..].starts_with(':')
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn scans_this_project_and_flags_only_decisions_md() {
        // CARGO_MANIFEST_DIR is src-tauri/; the workspace root is one level up.
        let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        let workspace_root = manifest_dir.parent().unwrap().to_path_buf();

        let results = scan_workspace(workspace_root.to_string_lossy().to_string()).expect("scan failed");
        let paths: Vec<&str> = results.iter().map(|f| f.path.as_str()).collect();

        assert!(paths.contains(&"CLAUDE.md"));
        assert!(paths.contains(&"AGENTS.md"));
        assert!(paths.contains(&"DECISIONS.md"));
        assert!(paths.contains(&"docs/SPEC.md"), "expected docs/-nested files to be detected");

        // Build/hidden dirs must never be descended into.
        assert!(!paths.iter().any(|p| p.starts_with("node_modules/")));
        assert!(!paths.iter().any(|p| p.starts_with("src-tauri/target/")));
        assert!(!paths.iter().any(|p| p.starts_with('.')));

        let decisions = results.iter().find(|f| f.path == "DECISIONS.md").unwrap();
        assert!(decisions.flagged, "DECISIONS.md should be flagged as log-style");

        for unflagged_path in ["CLAUDE.md", "AGENTS.md", "docs/SPEC.md", "docs/ROADMAP.md"] {
            let f = results.iter().find(|f| f.path == unflagged_path).unwrap();
            assert!(!f.flagged, "{unflagged_path} should not be flagged");
        }
    }

    #[test]
    fn detects_date_header_log_style() {
        let contents = "## 2026-01-01 — First\nbody\n## 2026-01-02 — Second\nbody\n";
        let (flagged, _) = detect_log_style(contents);
        assert!(flagged);
    }

    #[test]
    fn detects_bold_label_log_style() {
        let mut contents = String::new();
        for label in ["Decision", "Rationale", "Status", "Decision", "Rationale", "Status"] {
            contents.push_str(&format!("**{label}**: some text\n"));
        }
        let (flagged, _) = detect_log_style(&contents);
        assert!(flagged);
    }

    #[test]
    fn does_not_flag_numbered_bold_list_items() {
        let contents = "1. **No forced structure.** The app must never...\n2. **AI must be described as a tool.** This applies...\n";
        let (flagged, _) = detect_log_style(contents);
        assert!(!flagged);
    }
}
