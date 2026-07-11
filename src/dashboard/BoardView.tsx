import type { Instruction, ManagedFile } from "../types";
import InstructionRow from "./InstructionRow";
import WarningCard from "./WarningCard";
import AddFileControl from "./AddFileControl";
import { EyeOffIcon, FileIcon } from "./icons";

interface BoardViewProps {
  files: ManagedFile[];
  instructionsByFile: Record<string, Instruction[]>;
  flaggedByFile: Record<string, string | null>;
  managedAnyway: Set<string>;
  search: string;
  onIgnoreFile: (path: string) => void;
  onAddFile: (path: string) => void;
  onManageAnyway: (path: string) => void;
  onToggleInstruction: (id: string) => void;
  onSetAlias: (id: string, alias: string | null) => void;
}

export default function BoardView({
  files,
  instructionsByFile,
  flaggedByFile,
  managedAnyway,
  search,
  onIgnoreFile,
  onAddFile,
  onManageAnyway,
  onToggleInstruction,
  onSetAlias,
}: BoardViewProps) {
  const query = search.trim().toLowerCase();

  return (
    <div className="board-wrap">
      <div className="board-row">
        {files.map((file) => {
          const all = instructionsByFile[file.path] ?? [];
          const onCount = all.filter((i) => i.enabled).length;
          const flagReason = flaggedByFile[file.path];
          const isFlagged = !!flagReason && !managedAnyway.has(file.path);
          const matched = query
            ? all.filter((i) => i.content.toLowerCase().includes(query) || (i.alias ?? "").toLowerCase().includes(query))
            : all;
          const emptyMatch = !isFlagged && query && matched.length === 0;

          return (
            <div key={file.path} className={`board-col${emptyMatch ? " board-col-empty-match" : ""}`}>
              <div className="board-col-head">
                <div className="board-col-headleft">
                  <span className="board-col-name">
                    <FileIcon path={file.path} flagged={!!flagReason} size={13} className="board-col-flag" />
                    {file.path}
                  </span>
                  <span className="board-col-count">
                    {onCount}/{all.length} active
                  </span>
                </div>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={`Ignore ${file.path}`}
                  title="Ignore file"
                  onClick={() => onIgnoreFile(file.path)}
                >
                  <EyeOffIcon size={13} />
                </button>
              </div>
              <div className="board-col-body">
                {isFlagged ? (
                  <WarningCard reason={flagReason ?? "Log-style file."} onManageAnyway={() => onManageAnyway(file.path)} />
                ) : emptyMatch ? (
                  <div className="board-col-empty-label">No matches</div>
                ) : (
                  matched.map((instruction) => (
                    <InstructionRow
                      key={instruction.id}
                      instruction={instruction}
                      onToggle={onToggleInstruction}
                      onSetAlias={onSetAlias}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
        <AddFileControl onAdd={onAddFile} variant="board" />
      </div>
    </div>
  );
}
