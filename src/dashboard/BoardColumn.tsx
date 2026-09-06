import { useState } from "react";
import type { Instruction, ScannedFile } from "../types";
import InstructionRow from "./InstructionRow";
import WarningCard from "./WarningCard";
import { matchesSearch } from "./search";

interface BoardColumnProps {
  path: string;
  instructions: Instruction[];
  search: string;
  flagged: ScannedFile | undefined;
  acknowledged: boolean;
  onAcknowledgeFlag: () => void;
  onToggle: (id: string) => void;
  onSetAlias: (id: string, alias: string | null) => void;
  onIgnoreFile: (path: string) => void;
}

export default function BoardColumn({
  path,
  instructions,
  search,
  flagged,
  acknowledged,
  onAcknowledgeFlag,
  onToggle,
  onSetAlias,
  onIgnoreFile,
}: BoardColumnProps) {
  const [scrolled, setScrolled] = useState(false);

  const allForFile = instructions.filter((i) => i.file === path);
  const enabledForFile = allForFile.filter((i) => i.enabled);
  const matching = enabledForFile.filter((i) => matchesSearch(i, search));
  const total = allForFile.length;
  const showWarning = flagged?.flagged && !acknowledged;

  return (
    <div className="board-column">
      <div className={`column-header ${scrolled ? "column-header-scrolled" : ""}`}>
        {flagged?.flagged && (
          <span className="nav-item-flagged" title="Log-style file — flagged">
            ⚑
          </span>
        )}
        <span className="column-header-name">{path}</span>
        <span className="meta-text">
          {enabledForFile.length}/{total}
        </span>
        <button
          type="button"
          className="ignore-control"
          onClick={() => onIgnoreFile(path)}
          title="Ignore this file"
          aria-label={`Ignore ${path}`}
        >
          ⊘
        </button>
      </div>

      {matching.length === 0 && !showWarning ? null : (
        <div
          className="board-column-body"
          onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 0)}
        >
          {showWarning && flagged?.flagReason ? (
            <WarningCard reason={flagged.flagReason} onManageAnyway={onAcknowledgeFlag} />
          ) : (
            matching.map((instr) => (
              <InstructionRow key={instr.id} instruction={instr} onToggle={onToggle} onSetAlias={onSetAlias} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
