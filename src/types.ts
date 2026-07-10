// Mirrors src-tauri/src/lib.rs, src-tauri/src/scanner.rs, and src-tauri/src/parser.rs.
// Schema per docs/FILE_STRUCTURE.md §6.3/§6.4.

export interface ManagedFile {
  name: string;
  path: string;
  enabled: boolean;
}

export interface MorchConfig {
  version: string;
  workspacePath: string;
  managedFiles: ManagedFile[];
  instructionAliases: Record<string, string>;
  disabledArchivePath: string;
  lastScanTime: string | null;
}

export interface ScannedFile {
  path: string;
  lineCount: number;
  wordCount: number;
  flagged: boolean;
  flagReason: string | null;
}

export interface ParsedInstruction {
  id: string;
  file: string;
  lineNumber: number;
  content: string;
}
