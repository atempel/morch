import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import InstructionRow from "./InstructionRow";

const meta = {
  component: InstructionRow,
  tags: ["ai-generated"],
  args: {
    onToggle: fn(),
    onSetAlias: fn(),
  },
} satisfies Meta<typeof InstructionRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Enabled: Story = {
  args: {
    instruction: {
      id: "line_1_CLAUDE.md",
      file: "CLAUDE.md",
      lineNumber: 1,
      content: "No forced structure — detection and recommendations are offered, nothing is mandatory.",
      alias: null,
      enabled: true,
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  },
};

export const Disabled: Story = {
  args: {
    instruction: {
      id: "line_2_CLAUDE.md",
      file: "CLAUDE.md",
      lineNumber: 2,
      content: "Disabled instructions are archived, not deleted.",
      alias: null,
      enabled: false,
    },
  },
};

export const WithAlias: Story = {
  args: {
    instruction: {
      id: "line_3_CLAUDE.md",
      file: "CLAUDE.md",
      lineNumber: 3,
      content: "AI must be described as a tool, never as a creative entity or autonomous agent.",
      alias: "ai-as-tool",
      enabled: true,
    },
  },
};

export const LongText: Story = {
  args: {
    instruction: {
      id: "line_42_DECISIONS.md",
      file: "DECISIONS.md",
      lineNumber: 42,
      content:
        "Content hashing is more robust than mtime comparison here: mtime resolution and clock behavior vary across filesystems/platforms, and a timestamp match doesn't actually prove the content is the app's own write.",
      alias: null,
      enabled: true,
    },
  },
};

// The one CssCheck story for the whole project (docs/STORYBOOK_PLAN.md Step
// 4) — proves the shared preview actually loaded dashboard.css/tokens.css,
// not just that the component mounted.
export const CssCheck: Story = {
  args: {
    instruction: {
      id: "line_5_CLAUDE.md",
      file: "CLAUDE.md",
      lineNumber: 5,
      content: "CSS token load check.",
      alias: null,
      enabled: true,
    },
  },
  play: async ({ canvasElement }) => {
    const track = canvasElement.querySelector(".toggle-track");
    // An enabled row's .toggle-track uses var(--success) (#a3be8c) —
    // fails if tokens.css/dashboard.css did not load.
    await expect(getComputedStyle(track as Element).backgroundColor).toBe("rgb(163, 190, 140)");
  },
};
