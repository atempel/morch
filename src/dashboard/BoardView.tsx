import type { Instruction, ManagedFile, ScannedFile } from "../types";
import BoardColumn from "./BoardColumn";
import AddFileControl from "./AddFileControl";

interface BoardViewProps {
  managedFiles: ManagedFile[];
  instructions: Instruction[];
  search: string;
  flaggedByPath: Record<string, ScannedFile>;
  acknowledgedFlags: Set<string>;
  onAcknowledgeFlag: (path: string) => void;
  onToggle: (id: string) => void;
  onSetAlias: (id: string, alias: string | null) => void;
  onIgnoreFile: (path: string) => void;
  onAddFile: (path: string) => void;
}

export default function BoardView({
  managedFiles,
  instructions,
  search,
  flaggedByPath,
  acknowledgedFlags,
  onAcknowledgeFlag,
  onToggle,
  onSetAlias,
  onIgnoreFile,
  onAddFile,
}: BoardViewProps) {
  return (
    <div className="board-view">
      <div className="board-row">
        {managedFiles.map((file) => (
          <BoardColumn
            key={file.path}
            path={file.path}
            instructions={instructions}
            search={search}
            flagged={flaggedByPath[file.path]}
            acknowledged={acknowledgedFlags.has(file.path)}
            onAcknowledgeFlag={() => onAcknowledgeFlag(file.path)}
            onToggle={onToggle}
            onSetAlias={onSetAlias}
            onIgnoreFile={onIgnoreFile}
          />
        ))}
        <div className="board-add-column">
          <AddFileControl onAdd={onAddFile} variant="board" />
        </div>
      </div>
    </div>
  );
}
