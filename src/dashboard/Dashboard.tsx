import { useCallback, useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { Instruction, ManagedFile, MorchConfig, ScannedFile } from "../types";
import { useTheme } from "./useTheme";
import Toolbar from "./Toolbar";
import Sidebar from "./Sidebar";
import MainPane from "./MainPane";
import BoardView from "./BoardView";
import "./dashboard.css";

export type View = "list" | "board";

interface DashboardProps {
  config: MorchConfig;
  onConfigChange: (config: MorchConfig) => void;
}

export default function Dashboard({ config, onConfigChange }: DashboardProps) {
  const [theme, toggleTheme] = useTheme();
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [flaggedByPath, setFlaggedByPath] = useState<Record<string, ScannedFile>>({});
  const [view, setView] = useState<View>("list");
  const [search, setSearch] = useState("");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  // "Manage anyway" acknowledgment for flagged files — session-only by
  // design, see session-logs/2026-09-06-m8-dashboard-ui.md.
  const [acknowledgedFlags, setAcknowledgedFlags] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const managedFiles = useMemo(() => config.managedFiles.filter((f) => f.enabled), [config.managedFiles]);
  const ignoredFiles = useMemo(() => config.managedFiles.filter((f) => !f.enabled), [config.managedFiles]);

  const reloadInstructions = useCallback(async (cfg: MorchConfig) => {
    try {
      const result = await invoke<Instruction[]>("load_instructions", {
        workspacePath: cfg.workspacePath,
        config: cfg,
      });
      setInstructions(result);
    } catch (e) {
      setError(String(e));
    }
  }, []);

  useEffect(() => {
    reloadInstructions(config);

    invoke<ScannedFile[]>("scan_workspace", { workspacePath: config.workspacePath })
      .then((results) => {
        const byPath: Record<string, ScannedFile> = {};
        for (const f of results) byPath[f.path] = f;
        setFlaggedByPath(byPath);
      })
      .catch((e) => setError(String(e)));

    invoke("watch_managed_files", {
      workspacePath: config.workspacePath,
      managedFiles: config.managedFiles.filter((f) => f.enabled).map((f) => f.path),
    }).catch((e) => setError(String(e)));

    const unlisten = listen("morch://external-change", () => {
      reloadInstructions(config);
    });

    return () => {
      unlisten.then((stop) => stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.workspacePath, JSON.stringify(config.managedFiles)]);

  useEffect(() => {
    if (selectedFile && managedFiles.some((f) => f.path === selectedFile)) return;
    setSelectedFile(managedFiles[0]?.path ?? null);
  }, [managedFiles, selectedFile]);

  async function persistConfig(next: MorchConfig) {
    try {
      await invoke("write_config", { workspacePath: next.workspacePath, config: next });
      onConfigChange(next);
      await reloadInstructions(next);
    } catch (e) {
      setError(String(e));
    }
  }

  function updateManagedFile(path: string, patch: Partial<ManagedFile>) {
    const next: MorchConfig = {
      ...config,
      managedFiles: config.managedFiles.map((f) => (f.path === path ? { ...f, ...patch } : f)),
    };
    persistConfig(next);
  }

  function addFile(path: string) {
    const trimmed = path.trim();
    if (!trimmed || config.managedFiles.some((f) => f.path === trimmed)) return;
    const next: MorchConfig = {
      ...config,
      managedFiles: [...config.managedFiles, { name: trimmed, path: trimmed, enabled: true }],
    };
    persistConfig(next);
  }

  async function toggleInstruction(id: string) {
    try {
      const result = await invoke<Instruction[]>("toggle_instruction", { id });
      setInstructions(result);
    } catch (e) {
      setError(String(e));
    }
  }

  async function setAlias(id: string, alias: string | null) {
    try {
      const result = await invoke<Instruction[]>("set_instruction_alias", { id, alias });
      setInstructions(result);
    } catch (e) {
      setError(String(e));
    }
  }

  function acknowledgeFlag(path: string) {
    setAcknowledgedFlags((prev) => new Set(prev).add(path));
  }

  function counts(path: string): { enabled: number; total: number } {
    const forFile = instructions.filter((i) => i.file === path);
    return { enabled: forFile.filter((i) => i.enabled).length, total: forFile.length };
  }

  const totalEnabled = instructions.filter((i) => i.enabled).length;

  return (
    <div className="dashboard">
      <Toolbar
        search={search}
        onSearchChange={setSearch}
        view={view}
        onViewChange={setView}
        theme={theme}
        onToggleTheme={toggleTheme}
        enabledCount={totalEnabled}
        totalCount={instructions.length}
        workspacePath={config.workspacePath}
      />
      {error && (
        <p className="dashboard-error" role="alert">
          {error}
        </p>
      )}
      <div className="dashboard-body">
        {view === "list" ? (
          <>
            <Sidebar
              managedFiles={managedFiles}
              ignoredFiles={ignoredFiles}
              selectedFile={selectedFile}
              onSelectFile={setSelectedFile}
              counts={counts}
              flaggedByPath={flaggedByPath}
              onIgnoreFile={(path) => updateManagedFile(path, { enabled: false })}
              onRestoreFile={(path) => updateManagedFile(path, { enabled: true })}
              onAddFile={addFile}
            />
            <MainPane
              selectedFile={selectedFile}
              instructions={instructions}
              search={search}
              flagged={selectedFile ? flaggedByPath[selectedFile] : undefined}
              acknowledged={selectedFile ? acknowledgedFlags.has(selectedFile) : false}
              onAcknowledgeFlag={() => selectedFile && acknowledgeFlag(selectedFile)}
              onToggle={toggleInstruction}
              onSetAlias={setAlias}
            />
          </>
        ) : (
          <BoardView
            managedFiles={managedFiles}
            instructions={instructions}
            search={search}
            flaggedByPath={flaggedByPath}
            acknowledgedFlags={acknowledgedFlags}
            onAcknowledgeFlag={acknowledgeFlag}
            onToggle={toggleInstruction}
            onSetAlias={setAlias}
            onIgnoreFile={(path) => updateManagedFile(path, { enabled: false })}
            onAddFile={addFile}
          />
        )}
      </div>
    </div>
  );
}
