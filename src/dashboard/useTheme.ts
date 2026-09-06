import { useEffect, useState } from "react";

export type Theme = "dark" | "light";

const STORAGE_KEY = "morch.theme";

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

/** Dark mode is canonical/default per DESIGN.md; light is opt-in and remembered per-browser. */
export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(readStoredTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Best-effort persistence only — a private/blocked storage context just
      // means the choice doesn't survive a restart, not a functional break.
    }
  }, [theme]);

  function toggle() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  return [theme, toggle];
}
