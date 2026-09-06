import { useState } from "react";
import type { Instruction } from "../types";
import InstructionRow from "./InstructionRow";

interface DisabledArchiveDrawerProps {
  instructions: Instruction[];
  onToggle: (id: string) => void;
  onSetAlias: (id: string, alias: string | null) => void;
}

/** Collapsed by default — reference material, never competes with the active list. */
export default function DisabledArchiveDrawer({ instructions, onToggle, onSetAlias }: DisabledArchiveDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="drawer disabled-archive-drawer">
      <button type="button" className="drawer-header" onClick={() => setOpen((v) => !v)}>
        <span>{open ? "▾" : "▸"} Disabled archive</span>
        <span className="meta-text">{instructions.length}</span>
      </button>
      {open && (
        <div className="drawer-body">
          {instructions.length === 0 && <p className="drawer-empty meta-text">Nothing disabled yet.</p>}
          {instructions.map((instr) => (
            <InstructionRow key={instr.id} instruction={instr} onToggle={onToggle} onSetAlias={onSetAlias} />
          ))}
        </div>
      )}
    </div>
  );
}
