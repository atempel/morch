import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import Onboarding from "./Onboarding";

// Exercises the Tauri invoke/dialog mocks aliased in .storybook/main.ts
// (docs/STORYBOOK_PLAN.md Step 2) — this is the one container component
// storied so far; Dashboard.tsx is the other `invoke`-calling container,
// left for a follow-up pass per the plan's Step 5.
const meta = {
  component: Onboarding,
  tags: ["ai-generated"],
  args: {
    onComplete: fn(),
  },
} satisfies Meta<typeof Onboarding>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WorkspaceStep: Story = {};

export const ScanAndAdvanceToChecklist: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByPlaceholderText("/path/to/my-workspace"), "/Users/example/my-workspace");
    await userEvent.click(canvas.getByRole("button", { name: /continue/i }));
    // Proves the mocked invoke("scan_workspace") resolved and the
    // component advanced past step 1 — not just that it rendered.
    await expect(await canvas.findByRole("heading", { name: /choose what to manage/i })).toBeVisible();
  },
};
