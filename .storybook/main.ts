import path from "node:path";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from '@storybook/react-vite';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-mcp"
  ],
  "framework": "@storybook/react-vite",
  async viteFinal(viteConfig) {
    // The real Tauri IPC bridge doesn't exist in a browser preview — see
    // docs/STORYBOOK_PLAN.md Step 2. Swap the three Tauri APIs the app calls
    // directly (Dashboard.tsx, Onboarding.tsx) for canned-response mocks,
    // with zero changes to production component code.
    viteConfig.resolve ??= {};
    viteConfig.resolve.alias = {
      ...viteConfig.resolve.alias,
      "@tauri-apps/api/core": path.resolve(dirname, "./mocks/tauri-core.ts"),
      "@tauri-apps/api/event": path.resolve(dirname, "./mocks/tauri-event.ts"),
      "@tauri-apps/plugin-dialog": path.resolve(dirname, "./mocks/tauri-dialog.ts"),
    };
    return viteConfig;
  },
};
export default config;