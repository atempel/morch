import type { View } from "./Dashboard";
import type { Theme } from "./useTheme";

interface ToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  view: View;
  onViewChange: (view: View) => void;
  theme: Theme;
  onToggleTheme: () => void;
  enabledCount: number;
  totalCount: number;
  workspacePath: string;
}

export default function Toolbar({
  search,
  onSearchChange,
  view,
  onViewChange,
  theme,
  onToggleTheme,
  enabledCount,
  totalCount,
  workspacePath,
}: ToolbarProps) {
  return (
    <header className="toolbar">
      <span className="toolbar-workspace meta-text" title={workspacePath}>
        {workspacePath}
      </span>

      <input
        className="text-input toolbar-search"
        type="text"
        placeholder="Search instructions…"
        value={search}
        onChange={(e) => onSearchChange(e.currentTarget.value)}
        aria-label="Search instructions"
      />

      <span className="toolbar-stats meta-text">
        {enabledCount} of {totalCount} enabled
      </span>

      <div className="view-switch" role="tablist" aria-label="View">
        <button
          type="button"
          role="tab"
          aria-selected={view === "list"}
          className={`view-switch-option ${view === "list" ? "view-switch-active" : ""}`}
          onClick={() => onViewChange("list")}
        >
          List
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === "board"}
          className={`view-switch-option ${view === "board" ? "view-switch-active" : ""}`}
          onClick={() => onViewChange("board")}
        >
          Board
        </button>
      </div>

      <button
        type="button"
        className="button-secondary toolbar-theme-toggle"
        onClick={onToggleTheme}
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      >
        {theme === "dark" ? "☀" : "☾"}
      </button>
    </header>
  );
}
