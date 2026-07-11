import { AlertTriangleIcon } from "./icons";

interface WarningCardProps {
  reason: string;
  onManageAnyway: () => void;
}

export default function WarningCard({ reason, onManageAnyway }: WarningCardProps) {
  return (
    <div className="warn-card">
      <AlertTriangleIcon size={16} className="warn-icon" />
      <div className="warn-body">
        <div className="warn-title">Log-style file — per-line toggling not recommended</div>
        <div className="warn-desc">{reason}</div>
        <div className="warn-actions">
          <button type="button" className="button-secondary" onClick={onManageAnyway}>
            Manage anyway
          </button>
        </div>
      </div>
    </div>
  );
}
