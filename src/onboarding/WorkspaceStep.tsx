interface WorkspaceStepProps {
  workspacePath: string;
  onChangePath: (path: string) => void;
  onBrowse: () => void;
  onContinue: () => void;
  busy: boolean;
  error: string | null;
}

export default function WorkspaceStep({
  workspacePath,
  onChangePath,
  onBrowse,
  onContinue,
  busy,
  error,
}: WorkspaceStepProps) {
  return (
    <>
      <h1>Point Morch at a workspace</h1>

      <div className="trust-card">
        <p>
          Selecting a file below doesn&apos;t change it — scanning only reads your files.
        </p>
        <p>
          Later, disabling an instruction archives it instead of deleting it, so nothing is
          ever lost.
        </p>
      </div>

      <h2>Workspace folder</h2>
      <div className="field-row">
        <input
          className="text-input"
          type="text"
          placeholder="/path/to/my-workspace"
          value={workspacePath}
          onChange={(e) => onChangePath(e.currentTarget.value)}
        />
        <button type="button" className="button-secondary" onClick={onBrowse} disabled={busy}>
          Browse…
        </button>
      </div>

      {error && <p className="onboarding-error">{error}</p>}

      <div className="onboarding-actions">
        <button
          type="button"
          className="button-primary"
          onClick={onContinue}
          disabled={busy || !workspacePath.trim()}
        >
          {busy ? "Scanning…" : "Continue"}
        </button>
      </div>
    </>
  );
}
