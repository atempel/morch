import { useState } from "react";
import Onboarding from "./onboarding/Onboarding";
import Dashboard from "./dashboard/Dashboard";
import type { MorchConfig } from "./types";

function App() {
  const [config, setConfig] = useState<MorchConfig | null>(null);

  if (!config) {
    return <Onboarding onComplete={setConfig} />;
  }

  return <Dashboard config={config} onConfigChange={setConfig} />;
}

export default App;
