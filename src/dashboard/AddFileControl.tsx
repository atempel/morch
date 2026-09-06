import { useState } from "react";

interface AddFileControlProps {
  onAdd: (path: string) => void;
  variant?: "sidebar" | "board";
}

/** Persistent add-file affordance — not onboarding-only, per DESIGN.md's Onboarding section. */
export default function AddFileControl({ onAdd, variant = "sidebar" }: AddFileControlProps) {
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState("");

  function submit() {
    const trimmed = path.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setPath("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        className={`add-file-control add-file-control-${variant}`}
        onClick={() => setOpen(true)}
      >
        + Add file
      </button>
    );
  }

  return (
    <div className={`add-file-form add-file-form-${variant}`}>
      <input
        className="text-input"
        type="text"
        autoFocus
        placeholder="path/to/FILE.md"
        value={path}
        onChange={(e) => setPath(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
          if (e.key === "Escape") {
            setOpen(false);
            setPath("");
          }
        }}
      />
      <button type="button" className="button-secondary" onClick={submit}>
        Add
      </button>
    </div>
  );
}
