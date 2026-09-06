import type { ManagedFile, ScannedFile } from "../types";
import AddFileControl from "./AddFileControl";
import IgnoredFilesDrawer from "./IgnoredFilesDrawer";

interface SidebarProps {
  managedFiles: ManagedFile[];
  ignoredFiles: ManagedFile[];
  selectedFile: string | null;
  onSelectFile: (path: string) => void;
  counts: (path: string) => { enabled: number; total: number };
  flaggedByPath: Record<string, ScannedFile>;
  onIgnoreFile: (path: string) => void;
  onRestoreFile: (path: string) => void;
  onAddFile: (path: string) => void;
}

export default function Sidebar({
  managedFiles,
  ignoredFiles,
  selectedFile,
  onSelectFile,
  counts,
  flaggedByPath,
  onIgnoreFile,
  onRestoreFile,
  onAddFile,
}: SidebarProps) {
  return (
    <nav className="sidebar">
      <ul className="sidebar-list">
        {managedFiles.map((file) => {
          const { enabled, total } = counts(file.path);
          const flagged = flaggedByPath[file.path]?.flagged ?? false;
          const active = file.path === selectedFile;
          return (
            <li
              key={file.path}
              className={`sidebar-item ${active ? "nav-item-active" : ""}`}
            >
              <button type="button" className="sidebar-item-main" onClick={() => onSelectFile(file.path)}>
                {flagged && (
                  <span className="sidebar-item-flag nav-item-flagged" title="Log-style file — flagged">
                    ⚑
                  </span>
                )}
                <span className="sidebar-item-name">{file.path}</span>
                <span className="sidebar-item-count meta-text">
                  {enabled}/{total}
                </span>
              </button>
              <button
                type="button"
                className="ignore-control"
                onClick={() => onIgnoreFile(file.path)}
                title="Ignore this file"
                aria-label={`Ignore ${file.path}`}
              >
                ⊘
              </button>
            </li>
          );
        })}
      </ul>

      <AddFileControl onAdd={onAddFile} variant="sidebar" />

      <IgnoredFilesDrawer files={ignoredFiles} onRestore={onRestoreFile} />
    </nav>
  );
}
