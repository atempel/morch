import { useState } from "react";
import Onboarding from "./onboarding/Onboarding";
import type { MorchConfig } from "./types";

function App() {
  const [config, setConfig] = useState<MorchConfig | null>(null);

  if (!config) {
    return <Onboarding onComplete={setConfig} />;
  }

  // Dashboard UI is M8 — this is a placeholder confirming onboarding produced
  // a usable config, not the real dashboard.
  const enabledCount = config.managedFiles.filter((f) => f.enabled).length;
  return (
    <main className="container">
      <p>
        Managing {enabledCount} of {config.managedFiles.length} files in {config.workspacePath}
      </p>
    </main>
  );
}

export default App;
