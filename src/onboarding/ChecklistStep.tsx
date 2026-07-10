import type { ScannedFile } from "../types";

interface ChecklistStepProps {
  scanResults: ScannedFile[];
  manualFiles: string[];
  selected: Record<string, boolean>;
  manualPath: string;
  onManualPathChange: (path: string) => void;
  onAddManualFile: () => void;
  onToggle: (path: string) => void;
  onBack: () => void;
  onFinish: () => void;
  busy: boolean;
  error: string | null;
}

function describe(file: ScannedFile): string {
  if (file.flagged && file.flagReason) {
    return file.flagReason;
  }
  return `Managed — its instructions will appear in the dashboard, toggleable individually. ${file.lineCount} lines, ${file.wordCount} words.`;
}

export default function ChecklistStep({
  scanResults,
  manualFiles,
  selected,
  manualPath,
  onManualPathChange,
  onAddManualFile,
  onToggle,
  onBack,
  onFinish,
  busy,
  error,
}: ChecklistStepProps) {
  return (
    <>
      <h1>Choose what to manage</h1>
      <p className="onboarding-subtext">
        Nothing here is final — any file can be added or removed later from the dashboard
        itself.
      </p>

      <ul className="checklist">
        {scanResults.map((file) => (
          <li key={file.path} className="checklist-item">
            <input
              type="checkbox"
              checked={!!selected[file.path]}
              onChange={() => onToggle(file.path)}
              id={`file-${file.path}`}
            />
            <span className={`checklist-icon ${file.flagged ? "checklist-icon-flagged" : ""}`}>
              {file.flagged ? "⚑" : "▤"}
            </span>
            <label htmlFor={`file-${file.path}`} className="checklist-label">
              <span className="checklist-name">{file.path}</span>
              <span className="checklist-desc">{describe(file)}</span>
            </label>
          </li>
        ))}

        {manualFiles.map((path) => (
          <li key={path} className="checklist-item">
            <input
              type="checkbox"
              checked={!!selected[path]}
              onChange={() => onToggle(path)}
              id={`file-${path}`}
            />
            <span className="checklist-icon">▤</span>
            <label htmlFor={`file-${path}`} className="checklist-label">
              <span className="checklist-name">{path}</span>
              <span className="checklist-desc">Added manually — not found by the scan.</span>
            </label>
          </li>
        ))}
      </ul>

      <div className="field-row">
        <input
          className="text-input"
          type="text"
          placeholder="Add a file not detected (e.g. SKILLS/my-skill.md)"
          value={manualPath}
          onChange={(e) => onManualPathChange(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAddManualFile();
            }
          }}
        />
        <button type="button" className="button-secondary" onClick={onAddManualFile}>
          Add file
        </button>
      </div>

      {error && <p className="onboarding-error">{error}</p>}

      <div className="onboarding-actions">
        <button type="button" className="button-secondary" onClick={onBack} disabled={busy}>
          Back
        </button>
        <button type="button" className="button-primary" onClick={onFinish} disabled={busy}>
          {busy ? "Saving…" : "Finish"}
        </button>
      </div>
    </>
  );
}
