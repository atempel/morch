import type { Instruction, ManagedFile } from "../types";
import InstructionRow from "./InstructionRow";
import WarningCard from "./WarningCard";
import AddFileControl from "./AddFileControl";
import { EyeOffIcon, FileIcon } from "./icons";

interface ListViewProps {
  files: ManagedFile[];
  instructionsByFile: Record<string, Instruction[]>;
  flaggedByFile: Record<string, string | null>;
  managedAnyway: Set<string>;
  search: string;
  selectedFile: string | null;
  onSelectFile: (path: string) => void;
  onIgnoreFile: (path: string) => void;
  onAddFile: (path: string) => void;
  onManageAnyway: (path: string) => void;
  onToggleInstruction: (id: string) => void;
  onSetAlias: (id: string, alias: string | null) => void;
}

export default function ListView({
  files,
  instructionsByFile,
  flaggedByFile,
  managedAnyway,
  search,
  selectedFile,
  onSelectFile,
  onIgnoreFile,
  onAddFile,
  onManageAnyway,
  onToggleInstruction,
  onSetAlias,
}: ListViewProps) {
  const active = files.find((f) => f.path === selectedFile) ?? files[0] ?? null;
  const allActiveInstructions = active ? instructionsByFile[active.path] ?? [] : [];
  const query = search.trim().toLowerCase();
  const activeInstructions = query
    ? allActiveInstructions.filter(
        (i) => i.content.toLowerCase().includes(query) || (i.alias ?? "").toLowerCase().includes(query),
      )
    : allActiveInstructions;
  const activeFlagReason = active ? flaggedByFile[active.path] : null;
  const activeIsFlagged = !!activeFlagReason && !(active && managedAnyway.has(active.path));

  return (
    <div className="dash-body">
      <div className="sidebar">
        {files.map((file) => {
          const instructions = instructionsByFile[file.path] ?? [];
          const onCount = instructions.filter((i) => i.enabled).length;
          const flagReason = flaggedByFile[file.path];
          return (
            <div
              key={file.path}
              className={`side-item${file.path === active?.path ? " side-item-active" : ""}${flagReason ? " side-item-flagged" : ""}`}
              onClick={() => onSelectFile(file.path)}
            >
              <FileIcon path={file.path} flagged={!!flagReason} size={15} />
              <span className="side-item-name">{file.path}</span>
              <span className="side-count">
                {onCount}/{instructions.length}
              </span>
              <button
                type="button"
                className="icon-btn"
                aria-label={`Ignore ${file.path}`}
                title="Ignore file"
                onClick={(e) => {
                  e.stopPropagation();
                  onIgnoreFile(file.path);
                }}
              >
                <EyeOffIcon size={13} />
              </button>
            </div>
          );
        })}
        <AddFileControl onAdd={onAddFile} />
      </div>
      <div className="main-pane">
        {!active ? (
          <div className="empty-state">No managed files. Add one to get started.</div>
        ) : activeIsFlagged ? (
          <WarningCard reason={activeFlagReason ?? "Log-style file."} onManageAnyway={() => onManageAnyway(active.path)} />
        ) : (
          <div className="instr-list">
            {activeInstructions.length === 0 ? (
              <div className="empty-state">{query ? "No matches." : "No instructions in this file yet."}</div>
            ) : (
              activeInstructions.map((instruction) => (
                <InstructionRow
                  key={instruction.id}
                  instruction={instruction}
                  onToggle={onToggleInstruction}
                  onSetAlias={onSetAlias}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
