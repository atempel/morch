import type { Instruction, ScannedFile } from "../types";
import InstructionRow from "./InstructionRow";
import WarningCard from "./WarningCard";
import DisabledArchiveDrawer from "./DisabledArchiveDrawer";
import { matchesSearch } from "./search";

interface MainPaneProps {
  selectedFile: string | null;
  instructions: Instruction[];
  search: string;
  flagged: ScannedFile | undefined;
  acknowledged: boolean;
  onAcknowledgeFlag: () => void;
  onToggle: (id: string) => void;
  onSetAlias: (id: string, alias: string | null) => void;
}

export default function MainPane({
  selectedFile,
  instructions,
  search,
  flagged,
  acknowledged,
  onAcknowledgeFlag,
  onToggle,
  onSetAlias,
}: MainPaneProps) {
  if (!selectedFile) {
    return (
      <main className="main-pane main-pane-empty">
        <p className="meta-text">No files managed yet — add one from the sidebar.</p>
      </main>
    );
  }

  const forFile = instructions.filter((i) => i.file === selectedFile);
  const active = forFile.filter((i) => i.enabled && matchesSearch(i, search));
  const disabled = forFile.filter((i) => !i.enabled);

  const showWarning = flagged?.flagged && !acknowledged;

  return (
    <main className="main-pane">
      <h2 className="main-pane-title">{selectedFile}</h2>

      {showWarning && flagged?.flagReason && (
        <WarningCard reason={flagged.flagReason} onManageAnyway={onAcknowledgeFlag} />
      )}

      {!showWarning && (
        <div className="instruction-list">
          {active.length === 0 && <p className="drawer-empty meta-text">No matching instructions.</p>}
          {active.map((instr) => (
            <InstructionRow key={instr.id} instruction={instr} onToggle={onToggle} onSetAlias={onSetAlias} />
          ))}
        </div>
      )}

      <DisabledArchiveDrawer instructions={disabled} onToggle={onToggle} onSetAlias={onSetAlias} />
    </main>
  );
}
