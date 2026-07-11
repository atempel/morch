import { useState } from "react";
import { PlusIcon } from "./icons";

interface AddFileControlProps {
  onAdd: (path: string) => void;
  variant?: "sidebar" | "board";
}

export default function AddFileControl({ onAdd, variant = "sidebar" }: AddFileControlProps) {
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState("");

  function submit() {
    const trimmed = path.trim();
    if (trimmed) {
      onAdd(trimmed);
    }
    setPath("");
    setOpen(false);
  }

  if (variant === "board") {
    return (
      <div className="board-add-col">
        {open ? (
          <div className="side-add-input open">
            <input
              autoFocus
              type="text"
              placeholder="docs/ROADMAP.md"
              value={path}
              onChange={(e) => setPath(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
                if (e.key === "Escape") setOpen(false);
              }}
            />
            <button type="button" className="button-secondary" onClick={submit}>
              Add
            </button>
          </div>
        ) : (
          <button type="button" className="board-add-col-btn" onClick={() => setOpen(true)} aria-label="Add file">
            <PlusIcon size={20} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <button type="button" className="side-add" onClick={() => setOpen((v) => !v)}>
        <PlusIcon size={12} />
        <span>Add file</span>
      </button>
      {open && (
        <div className="side-add-input open">
          <input
            autoFocus
            type="text"
            placeholder="docs/ROADMAP.md"
            value={path}
            onChange={(e) => setPath(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
              if (e.key === "Escape") setOpen(false);
            }}
          />
          <button type="button" className="button-secondary" onClick={submit}>
            Add
          </button>
        </div>
      )}
    </div>
  );
}
