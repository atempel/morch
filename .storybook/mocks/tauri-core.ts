// Storybook-only stand-in for `@tauri-apps/api/core`, aliased in main.ts.
// There is no Tauri IPC bridge in a plain browser preview, so every command
// this app actually calls (per src/onboarding/Onboarding.tsx and
// src/dashboard/Dashboard.tsx) gets a canned response instead of hanging.
import type { ScannedFile } from "../../src/types";

const responses: Record<string, unknown> = {
  config_exists: false,
  read_config: null,
  scan_workspace: [] satisfies ScannedFile[],
  write_config: undefined,
  watch_managed_files: undefined,
};

export async function invoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  console.info(`[storybook] mocked invoke("${command}")`, args);
  if (command in responses) {
    return responses[command] as T;
  }
  throw new Error(`[storybook] no mock response registered for invoke("${command}")`);
}
