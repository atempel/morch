import { useState } from "react";
import type { Instruction } from "../types";

interface InstructionRowProps {
  instruction: Instruction;
  onToggle: (id: string) => void;
  onSetAlias: (id: string, alias: string | null) => void;
}

export default function InstructionRow({ instruction, onToggle, onSetAlias }: InstructionRowProps) {
  const [editingAlias, setEditingAlias] = useState(false);
  const [aliasDraft, setAliasDraft] = useState(instruction.alias ?? "");

  function commitAlias() {
    const trimmed = aliasDraft.trim();
    onSetAlias(instruction.id, trimmed.length > 0 ? trimmed : null);
    setEditingAlias(false);
  }

  return (
    <div className={`instruction-row ${instruction.enabled ? "" : "instruction-row-off"}`}>
      <button
        type="button"
        role="switch"
        aria-checked={instruction.enabled}
        aria-label={instruction.enabled ? "Disable instruction" : "Enable instruction"}
        className={`toggle-switch ${instruction.enabled ? "toggle-on" : "toggle-off"}`}
        onClick={() => onToggle(instruction.id)}
      >
        <span className="toggle-knob" />
      </button>

      <div className="instruction-row-body">
        <p className="instruction-row-content" title={instruction.content}>
          {instruction.content}
        </p>
        <div className="instruction-row-meta">
          <span className="meta-text tag-line-number">L{instruction.lineNumber}</span>
          {editingAlias ? (
            <input
              className="alias-input"
              type="text"
              autoFocus
              placeholder="alias…"
              value={aliasDraft}
              onChange={(e) => setAliasDraft(e.currentTarget.value)}
              onBlur={commitAlias}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitAlias();
                }
                if (e.key === "Escape") {
                  setAliasDraft(instruction.alias ?? "");
                  setEditingAlias(false);
                }
              }}
            />
          ) : (
            <button
              type="button"
              className="badge-alias"
              onClick={() => {
                setAliasDraft(instruction.alias ?? "");
                setEditingAlias(true);
              }}
              title="Click to edit alias"
            >
              {instruction.alias ?? "+ alias"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
