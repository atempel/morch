import { useState } from "react";
import type { ManagedFile } from "../types";

interface IgnoredFilesDrawerProps {
  files: ManagedFile[];
  onRestore: (path: string) => void;
}

/** Same collapsed/capped-scroll pattern as the disabled-instruction archive, but its own
 * drawer — ignoring a file is a dashboard-declutter action, distinct from AI-visibility. */
export default function IgnoredFilesDrawer({ files, onRestore }: IgnoredFilesDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="drawer ignored-files-drawer">
      <button type="button" className="drawer-header" onClick={() => setOpen((v) => !v)}>
        <span>{open ? "▾" : "▸"} Ignored files</span>
        <span className="meta-text">{files.length}</span>
      </button>
      {open && (
        <div className="drawer-body">
          {files.length === 0 && <p className="drawer-empty meta-text">No files ignored.</p>}
          {files.map((f) => (
            <div key={f.path} className="drawer-row">
              <span className="drawer-row-name">{f.path}</span>
              <span className="drawer-row-note meta-text">hidden from dashboard — file untouched</span>
              <button type="button" className="button-secondary drawer-row-action" onClick={() => onRestore(f.path)}>
                Restore
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
