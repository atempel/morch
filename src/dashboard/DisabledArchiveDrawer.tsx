import type { Instruction } from "../types";
import Drawer from "./Drawer";
import { EyeOffIcon } from "./icons";

interface DisabledArchiveDrawerProps {
  disabledInstructions: Instruction[];
  open: boolean;
  onToggle: () => void;
  onRestore: (id: string) => void;
}

export default function DisabledArchiveDrawer({ disabledInstructions, open, onToggle, onRestore }: DisabledArchiveDrawerProps) {
  return (
    <Drawer
      icon={<EyeOffIcon size={14} />}
      label="Disabled archive — the AI never reads this"
      count={disabledInstructions.length}
      open={open}
      onToggle={onToggle}
      topBorder="strong"
    >
      {disabledInstructions.length === 0 ? (
        <div className="drawer-empty">Nothing disabled right now.</div>
      ) : (
        disabledInstructions.map((instruction) => (
          <div key={instruction.id} className="drawer-row">
            <span className="drawer-row-file">{instruction.file}</span>
            <span className="drawer-row-text">{instruction.content}</span>
            <button type="button" className="drawer-restore" onClick={() => onRestore(instruction.id)}>
              Restore
            </button>
          </div>
        ))
      )}
    </Drawer>
  );
}
