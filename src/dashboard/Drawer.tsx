import type { ReactNode } from "react";
import { ChevronDownIcon } from "./icons";

interface DrawerProps {
  icon: ReactNode;
  label: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  /** Top-border weight — the archive drawer (first, directly below the main
   * content) uses `border-strong`; the ignored-files drawer stacked below it
   * uses the regular `border`, per Figma. */
  topBorder?: "regular" | "strong";
}

// Shared collapsed-by-default, capped-max-height-with-scroll pattern per
// DESIGN.md — used identically by the disabled archive and ignored files
// drawers ("two archives, two different jobs," but one visual pattern).
export default function Drawer({ icon, label, count, open, onToggle, children, topBorder = "regular" }: DrawerProps) {
  return (
    <div className={`drawer${topBorder === "strong" ? " drawer-border-strong" : ""}`}>
      <button type="button" className="drawer-head" onClick={onToggle} aria-expanded={open}>
        <span className="drawer-lead">{icon}</span>
        <span>
          {label} <span className="drawer-count">({count})</span>
        </span>
        <ChevronDownIcon size={15} className={`drawer-chev${open ? " drawer-chev-open" : ""}`} />
      </button>
      {open && <div className="drawer-body">{children}</div>}
    </div>
  );
}
