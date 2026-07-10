use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ParsedInstruction {
    /// "line_{lineNumber}_{file}" — matches the instructionAliases key format
    /// already established in docs/FILE_STRUCTURE.md §6.3's config example.
    pub id: String,
    pub file: String,
    pub line_number: usize,
    pub content: String,
}

/// Reads and parses a single managed file into candidate instructions.
#[tauri::command]
pub fn parse_file(workspace_path: String, file_path: String) -> Result<Vec<ParsedInstruction>, String> {
    let full_path = PathBuf::from(&workspace_path).join(&file_path);
    let contents =
        fs::read_to_string(&full_path).map_err(|e| format!("failed to read {}: {}", full_path.display(), e))?;
    Ok(parse_markdown(&file_path, &contents))
}

/// Line-based instruction extraction per docs/PARSING_VALIDATION.md: every
/// non-blank, non-header line is a candidate instruction, in original file
/// order with original line numbers preserved. Deliberately no block-grouping
/// (multi-line entries like DECISIONS.md's Decision/Rationale/Status stay as
/// separate lines) — that's Phase Two per docs/ROADMAP.md "Next".
pub fn parse_markdown(file: &str, contents: &str) -> Vec<ParsedInstruction> {
    contents
        .lines()
        .enumerate()
        .filter_map(|(idx, raw_line)| {
            let line_number = idx + 1;
            let trimmed = raw_line.trim();
            if trimmed.is_empty() || is_header_line(trimmed) {
                return None;
            }
            Some(ParsedInstruction {
                id: format!("line_{line_number}_{file}"),
                file: file.to_string(),
                line_number,
                content: trimmed.to_string(),
            })
        })
        .collect()
}

/// Matches ATX-style markdown headers (`#` through `######`, followed by a space or EOL).
fn is_header_line(trimmed: &str) -> bool {
    let hashes = trimmed.chars().take_while(|&c| c == '#').count();
    if hashes == 0 || hashes > 6 {
        return false;
    }
    let rest = &trimmed[hashes..];
    rest.is_empty() || rest.starts_with(' ') || rest.starts_with('\t')
}

#[cfg(test)]
mod tests {
    use super::*;

    fn workspace_root() -> PathBuf {
        PathBuf::from(env!("CARGO_MANIFEST_DIR")).parent().unwrap().to_path_buf()
    }

    #[test]
    fn skips_headers_and_blank_lines() {
        let contents = "# Title\n\n## Section\n\nActual instruction line.\n";
        let instructions = parse_markdown("TEST.md", contents);
        assert_eq!(instructions.len(), 1);
        assert_eq!(instructions[0].content, "Actual instruction line.");
        assert_eq!(instructions[0].line_number, 5);
        assert_eq!(instructions[0].id, "line_5_TEST.md");
    }

    #[test]
    fn parses_claude_md_matching_parsing_validation_findings() {
        let root = workspace_root();
        let contents = fs::read_to_string(root.join("CLAUDE.md")).unwrap();
        let instructions = parse_markdown("CLAUDE.md", &contents);

        let line_numbers: Vec<usize> = instructions.iter().map(|i| i.line_number).collect();
        assert_eq!(line_numbers, vec![5, 9, 10, 11, 12, 16, 17, 18, 19, 23]);

        // "Project Purpose" prose becomes a single long instruction line (finding #2).
        assert!(instructions[0].content.starts_with("This project is the specification"));

        // "Core Principles" is cleanly one-line-per-rule (the common case that validates).
        assert!(instructions[1].content.starts_with("1. **No forced structure.**"));
    }

    #[test]
    fn parses_agents_md_matching_parsing_validation_findings() {
        let root = workspace_root();
        let contents = fs::read_to_string(root.join("AGENTS.md")).unwrap();
        let instructions = parse_markdown("AGENTS.md", &contents);

        let line_numbers: Vec<usize> = instructions.iter().map(|i| i.line_number).collect();
        assert_eq!(line_numbers, vec![5, 10, 11, 12, 15, 16, 19, 20, 24, 25, 26, 27, 28]);

        // "Handoff Notes" ordered, sequence-dependent list (finding #3) still parses
        // line-by-line — no special grouping yet, that's a Phase Two UX concern.
        assert_eq!(
            instructions[8].content,
            "When picking up this project fresh, read in this order:"
        );
        assert_eq!(instructions[9].content, "1. `README.md`");
        assert_eq!(instructions[12].content, "4. `docs/TECHNICAL_ARCHITECTURE.md`");
    }

    #[test]
    fn does_not_attempt_block_grouping_on_log_style_content() {
        // Confirms finding #4: multi-line Decision/Rationale/Status blocks (as in
        // DECISIONS.md) are NOT grouped — each line stays its own candidate
        // instruction. Block-grouping is explicitly deferred to Phase Two.
        let contents = "## 2026-01-01 — Example\n\n**Decision**: Do the thing.\n**Rationale**: Because reasons.\n**Status**: Locked in.\n";
        let instructions = parse_markdown("DECISIONS.md", contents);
        assert_eq!(instructions.len(), 3);
        assert_eq!(instructions[0].content, "**Decision**: Do the thing.");
        assert_eq!(instructions[1].content, "**Rationale**: Because reasons.");
        assert_eq!(instructions[2].content, "**Status**: Locked in.");
    }
}
