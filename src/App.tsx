import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import Onboarding from "./onboarding/Onboarding";
import type { Instruction, MorchConfig } from "./types";

function App() {
  const [config, setConfig] = useState<MorchConfig | null>(null);
  const [lastExternalChange, setLastExternalChange] = useState<string | null>(null);
  const [instructions, setInstructions] = useState<Instruction[] | null>(null);

  useEffect(() => {
    if (!config) return;

    invoke("watch_managed_files", {
      workspacePath: config.workspacePath,
      managedFiles: config.managedFiles.filter((f) => f.enabled).map((f) => f.path),
    }).catch((err) => console.error("failed to start watching managed files:", err));

    invoke<Instruction[]>("load_instructions", { workspacePath: config.workspacePath, config })
      .then(setInstructions)
      .catch((err) => console.error("failed to load instructions:", err));

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
  // a usable config, not the real dashboard. The external-change line and
  // instruction counts prove the M6 watcher and M7 instruction manager are
  // wired end-to-end, ahead of the real UI that will consume them in M8.
  const enabledFileCount = config.managedFiles.filter((f) => f.enabled).length;
  const enabledInstructionCount = instructions?.filter((i) => i.enabled).length ?? 0;
  return (
    <main className="container">
      <p>
        Managing {enabledFileCount} of {config.managedFiles.length} files in {config.workspacePath}
      </p>
      {instructions && (
        <p>
          {enabledInstructionCount} of {instructions.length} instructions enabled
        </p>
      )}
      {lastExternalChange && <p>External change detected: {lastExternalChange}</p>}
    </main>
  );
}

export default App;
