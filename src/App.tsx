import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import Onboarding from "./onboarding/Onboarding";
import type { MorchConfig } from "./types";

function App() {
  const [config, setConfig] = useState<MorchConfig | null>(null);
  const [lastExternalChange, setLastExternalChange] = useState<string | null>(null);

  useEffect(() => {
    if (!config) return;

    invoke("watch_managed_files", {
      workspacePath: config.workspacePath,
      managedFiles: config.managedFiles.filter((f) => f.enabled).map((f) => f.path),
    }).catch((err) => console.error("failed to start watching managed files:", err));

    const unlisten = listen<string>("morch://external-change", (event) => {
      setLastExternalChange(event.payload);
    });

    return () => {
      unlisten.then((stop) => stop());
    };
  }, [config]);

  if (!config) {
    return <Onboarding onComplete={setConfig} />;
  }

  // Dashboard UI is M8 — this is a placeholder confirming onboarding produced
  // a usable config, not the real dashboard. The external-change line proves
  // the M6 file watcher is wired end-to-end, ahead of the real UI that will
  // consume it in M7/M8.
  const enabledCount = config.managedFiles.filter((f) => f.enabled).length;
  return (
    <main className="container">
      <p>
        Managing {enabledCount} of {config.managedFiles.length} files in {config.workspacePath}
      </p>
      {lastExternalChange && <p>External change detected: {lastExternalChange}</p>}
    </main>
  );
}

export default App;
