import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import type { ManagedFile, MorchConfig, ScannedFile } from "../types";
import WorkspaceStep from "./WorkspaceStep";
import ChecklistStep from "./ChecklistStep";
import "./onboarding.css";

type Step = "workspace" | "checklist";

interface OnboardingProps {
  onComplete: (config: MorchConfig) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<Step>("workspace");
  const [workspacePath, setWorkspacePath] = useState("");
  const [scanResults, setScanResults] = useState<ScannedFile[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [manualPath, setManualPath] = useState("");
  const [manualFiles, setManualFiles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function browse() {
    const selectedDir = await open({ directory: true, multiple: false });
    if (typeof selectedDir === "string") {
      setWorkspacePath(selectedDir);
    }
  }

  async function scan() {
    if (!workspacePath.trim()) {
      setError("Choose a workspace folder first.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const alreadyConfigured = await invoke<boolean>("config_exists", { workspacePath });
      if (alreadyConfigured) {
        const config = await invoke<MorchConfig>("read_config", { workspacePath });
        onComplete(config);
        return;
      }
      const results = await invoke<ScannedFile[]>("scan_workspace", { workspacePath });
      const initialSelection: Record<string, boolean> = {};
      for (const file of results) initialSelection[file.path] = true;
      setScanResults(results);
      setSelected(initialSelection);
      setStep("checklist");
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  function toggleSelected(path: string) {
    setSelected((prev) => ({ ...prev, [path]: !prev[path] }));
  }

  function addManualFile() {
    const trimmed = manualPath.trim();
    if (!trimmed) return;
    if (!manualFiles.includes(trimmed) && !scanResults.some((f) => f.path === trimmed)) {
      setManualFiles((prev) => [...prev, trimmed]);
      setSelected((prev) => ({ ...prev, [trimmed]: true }));
    }
    setManualPath("");
  }

  async function finish() {
    setBusy(true);
    setError(null);

    const managedFiles: ManagedFile[] = [
      ...scanResults.map((f) => ({ name: f.path, path: f.path, enabled: !!selected[f.path] })),
      ...manualFiles.map((p) => ({ name: p, path: p, enabled: !!selected[p] })),
    ];

    const config: MorchConfig = {
      version: "1.0",
      workspacePath,
      managedFiles,
      instructionAliases: {},
      disabledArchivePath: ".morch-disabled",
      lastScanTime: new Date().toISOString(),
    };

    try {
      await invoke("write_config", { workspacePath, config });
      onComplete(config);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="onboarding">
      <div className="onboarding-card">
        <p className="onboarding-step-indicator">Step {step === "workspace" ? "1" : "2"} of 2</p>

        {step === "workspace" && (
          <WorkspaceStep
            workspacePath={workspacePath}
            onChangePath={setWorkspacePath}
            onBrowse={browse}
            onContinue={scan}
            busy={busy}
            error={error}
          />
        )}

        {step === "checklist" && (
          <ChecklistStep
            scanResults={scanResults}
            manualFiles={manualFiles}
            selected={selected}
            manualPath={manualPath}
            onManualPathChange={setManualPath}
            onAddManualFile={addManualFile}
            onToggle={toggleSelected}
            onBack={() => setStep("workspace")}
            onFinish={finish}
            busy={busy}
            error={error}
          />
        )}
      </div>
    </div>
  );
}
