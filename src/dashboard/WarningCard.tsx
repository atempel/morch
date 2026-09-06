interface WarningCardProps {
  reason: string;
  onManageAnyway: () => void;
}

/** Never a permanent dead end — always carries the override action. */
export default function WarningCard({ reason, onManageAnyway }: WarningCardProps) {
  return (
    <div className="warning-card">
      <span className="warning-card-icon" aria-hidden="true">
        ⚑
      </span>
      <p className="warning-card-text">{reason}</p>
      <button type="button" className="button-secondary" onClick={onManageAnyway}>
        Manage anyway
      </button>
    </div>
  );
}
