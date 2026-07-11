import type { ManagedFile } from "../types";
import Drawer from "./Drawer";
import { EyeOffIcon } from "./icons";

interface IgnoredFilesDrawerProps {
  ignoredFiles: ManagedFile[];
  open: boolean;
  onToggle: () => void;
  onRestore: (path: string) => void;
}

export default function IgnoredFilesDrawer({ ignoredFiles, open, onToggle, onRestore }: IgnoredFilesDrawerProps) {
  return (
    <Drawer icon={<EyeOffIcon size={14} />} label="Ignored files" count={ignoredFiles.length} open={open} onToggle={onToggle}>
      {ignoredFiles.length === 0 ? (
        <div className="drawer-empty">No ignored files.</div>
      ) : (
        ignoredFiles.map((file) => (
          <div key={file.path} className="drawer-row">
            <span className="drawer-row-text drawer-row-mono">{file.path} — hidden from dashboard, file untouched</span>
            <button type="button" className="drawer-restore" onClick={() => onRestore(file.path)}>
              Restore
            </button>
          </div>
        ))
      )}
    </Drawer>
  );
}
