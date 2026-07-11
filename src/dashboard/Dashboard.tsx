import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { Instruction, ManagedFile, MorchConfig, ScannedFile } from "../types";
import ListView from "./ListView";
import BoardView from "./BoardView";
import DisabledArchiveDrawer from "./DisabledArchiveDrawer";
import IgnoredFilesDrawer from "./IgnoredFilesDrawer";
import { KanbanIcon, ListViewIcon, MoonIcon, SearchIcon, SunIcon } from "./icons";
import "./dashboard.css";

type View = "list" | "board";
type Theme = "dark" | "light";

const THEME_STORAGE_KEY = "morch-theme";

function loadTheme(): Theme {
  return localStorage.getItem(THEME_STORAGE_KEY) === "light" ? "light" : "dark";
}

interface DashboardProps {
  config: MorchConfig;
  onConfigChange: (config: MorchConfig) => void;
}

export default function Dashboard({ config, onConfigChange }: DashboardProps) {
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [scanResults, setScanResults] = useState<ScannedFile[]>([]);
  const [view, setView] = useState<View>("list");
  const [theme, setTheme] = useState<Theme>(loadTheme);
  const [search, setSearch] = useState("");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [ignoredOpen, setIgnoredOpen] = useState(false);
  const [managedAnyway, setManagedAnyway] = useState<Set<string>>(new Set());

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  async function reloadInstructions() {
    try {
      const result = await invoke<Instruction[]>("load_instructions", { workspacePath: config.workspacePath, config });
      setInstructions(result);
    } catch (err) {
      console.error("failed to load instructions:", err);
    }
  }

  useEffect(() => {
    reloadInstructions();

    invoke<ScannedFile[]>("scan_workspace", { workspacePath: config.workspacePath })
      .then(setScanResults)
      .catch((err) => console.error("failed to scan workspace:", err));

    invoke("watch_managed_files", {
      workspacePath: config.workspacePath,
      managedFiles: config.managedFiles.filter((f) => f.enabled).map((f) => f.path),
    }).catch((err) => console.error("failed to start watching managed files:", err));

    const unlisten = listen("morch://external-change", () => {
      reloadInstructions();
    });

    return () => {
      unlisten.then((stop) => stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.workspacePath, config.managedFiles]);

  const managedFiles = useMemo(() => config.managedFiles.filter((f) => f.enabled), [config.managedFiles]);
  const ignoredFiles = useMemo(() => config.managedFiles.filter((f) => !f.enabled), [config.managedFiles]);

  useEffect(() => {
    if (!selectedFile || !managedFiles.some((f) => f.path === selectedFile)) {
      setSelectedFile(managedFiles[0]?.path ?? null);
    }
  }, [managedFiles, selectedFile]);

  const instructionsByFile = useMemo(() => {
    const map: Record<string, Instruction[]> = {};
    for (const instruction of instructions) {
      (map[instruction.file] ??= []).push(instruction);
    }
    return map;
  }, [instructions]);

  const flaggedByFile = useMemo(() => {
    const map: Record<string, string | null> = {};
    for (const scanned of scanResults) {
      map[scanned.path] = scanned.flagged ? scanned.flagReason : null;
    }
    return map;
  }, [scanResults]);

  const disabledInstructions = useMemo(() => instructions.filter((i) => !i.enabled), [instructions]);

  const totalCount = instructions.length;
  const enabledCount = instructions.filter((i) => i.enabled).length;

  async function persistManagedFiles(nextManagedFiles: ManagedFile[]) {
    const nextConfig: MorchConfig = { ...config, managedFiles: nextManagedFiles };
    try {
      await invoke("write_config", { workspacePath: config.workspacePath, config: nextConfig });
      onConfigChange(nextConfig);
    } catch (err) {
      console.error("failed to write config:", err);
    }
  }

  function handleAddFile(path: string) {
    if (config.managedFiles.some((f) => f.path === path)) return;
    persistManagedFiles([...config.managedFiles, { name: path, path, enabled: true }]);
  }

  function handleSetFileEnabled(path: string, enabled: boolean) {
    persistManagedFiles(config.managedFiles.map((f) => (f.path === path ? { ...f, enabled } : f)));
  }

  async function handleToggleInstruction(id: string) {
    try {
      const result = await invoke<Instruction[]>("toggle_instruction", { id });
      setInstructions(result);
    } catch (err) {
      console.error("failed to toggle instruction:", err);
    }
  }

  async function handleSetAlias(id: string, alias: string | null) {
    try {
      const result = await invoke<Instruction[]>("set_instruction_alias", { id, alias });
      setInstructions(result);
    } catch (err) {
      console.error("failed to set alias:", err);
    }
  }

  function handleManageAnyway(path: string) {
    setManagedAnyway((prev) => new Set(prev).add(path));
  }

  const logoSrc = theme === "dark" ? "/logo-morch-light-transparent.svg" : "/logo-morch-dark-transparent.svg";

  return (
    <div className="morch-app">
      <div className="app-header">
        <div className="app-header-side" />
        <img className="app-logo" src={logoSrc} alt="Morch" />
        <div className="app-header-side app-header-side-right">
          <span className="app-path">{config.workspacePath}</span>
          <button
            type="button"
            className="mode-btn"
            aria-label="Toggle light and dark theme"
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          >
            {theme === "dark" ? <MoonIcon /> : <SunIcon />}
          </button>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-field">
          <SearchIcon size={15} />
          <input
            type="text"
            placeholder="Filter instructions…"
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
          />
        </div>
        <span className="stats">
          <b>{enabledCount} active</b> · <span className="stats-off">{totalCount - enabledCount} disabled</span>
        </span>
        <div className="view-switch">
          <button type="button" className={view === "list" ? "active" : ""} onClick={() => setView("list")}>
            <ListViewIcon />
            List
          </button>
          <button type="button" className={view === "board" ? "active" : ""} onClick={() => setView("board")}>
            <KanbanIcon />
            Board
          </button>
        </div>
      </div>

      {view === "list" ? (
        <ListView
          files={managedFiles}
          instructionsByFile={instructionsByFile}
          flaggedByFile={flaggedByFile}
          managedAnyway={managedAnyway}
          search={search}
          selectedFile={selectedFile}
          onSelectFile={setSelectedFile}
          onIgnoreFile={(path) => handleSetFileEnabled(path, false)}
          onAddFile={handleAddFile}
          onManageAnyway={handleManageAnyway}
          onToggleInstruction={handleToggleInstruction}
          onSetAlias={handleSetAlias}
        />
      ) : (
        <BoardView
          files={managedFiles}
          instructionsByFile={instructionsByFile}
          flaggedByFile={flaggedByFile}
          managedAnyway={managedAnyway}
          search={search}
          onIgnoreFile={(path) => handleSetFileEnabled(path, false)}
          onAddFile={handleAddFile}
          onManageAnyway={handleManageAnyway}
          onToggleInstruction={handleToggleInstruction}
          onSetAlias={handleSetAlias}
        />
      )}

      <DisabledArchiveDrawer
        disabledInstructions={disabledInstructions}
        open={archiveOpen}
        onToggle={() => setArchiveOpen((v) => !v)}
        onRestore={handleToggleInstruction}
      />
      <IgnoredFilesDrawer
        ignoredFiles={ignoredFiles}
        open={ignoredOpen}
        onToggle={() => setIgnoredOpen((v) => !v)}
        onRestore={(path) => handleSetFileEnabled(path, true)}
      />
    </div>
  );
}
