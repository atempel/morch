import { useState } from "react";
import type { Instruction } from "../types";

interface InstructionRowProps {
  instruction: Instruction;
  onToggle: (id: string) => void;
  onSetAlias: (id: string, alias: string | null) => void;
}

export default function InstructionRow({ instruction, onToggle, onSetAlias }: InstructionRowProps) {
  const [editingAlias, setEditingAlias] = useState(false);
  const [draftAlias, setDraftAlias] = useState(instruction.alias ?? "");

  function startEditing() {
    setDraftAlias(instruction.alias ?? "");
    setEditingAlias(true);
  }

  function commitAlias() {
    const trimmed = draftAlias.trim();
    onSetAlias(instruction.id, trimmed === "" ? null : trimmed);
    setEditingAlias(false);
  }

  return (
    <div className={`instr-row${instruction.enabled ? "" : " is-off"}`}>
      <button
        type="button"
        className="toggle"
        role="switch"
        aria-checked={instruction.enabled}
        aria-label={instruction.enabled ? "Disable instruction" : "Enable instruction"}
        onClick={() => onToggle(instruction.id)}
      >
        <span className="toggle-track">
          <span className="toggle-knob" />
        </span>
      </button>
      <div className="instr-main">
        <div className="instr-text">{instruction.content}</div>
        <div className="instr-meta">
          {editingAlias ? (
            <input
              autoFocus
              className="alias-input"
              value={draftAlias}
              placeholder="alias…"
              onChange={(e) => setDraftAlias(e.currentTarget.value)}
              onBlur={commitAlias}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitAlias();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  setEditingAlias(false);
                }
              }}
            />
          ) : instruction.alias ? (
            <button type="button" className="badge-alias" onClick={startEditing} title="Click to edit alias">
              {instruction.alias}
            </button>
          ) : (
            <button type="button" className="badge-alias badge-alias-empty" onClick={startEditing}>
              + alias
            </button>
          )}
          <span className="line-tag">L{instruction.lineNumber}</span>
        </div>
      </div>
    </div>
  );
}
