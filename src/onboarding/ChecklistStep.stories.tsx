import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import ChecklistStep from "./ChecklistStep";
import type { ScannedFile } from "../types";

const scanResults: ScannedFile[] = [
  { path: "CLAUDE.md", lineCount: 42, wordCount: 310, flagged: false, flagReason: null },
  { path: "AGENTS.md", lineCount: 28, wordCount: 190, flagged: false, flagReason: null },
  {
    path: "DECISIONS.md",
    lineCount: 260,
    wordCount: 4100,
    flagged: true,
    flagReason: "Log-style file — repeated headings and --- separators detected.",
  },
];

const meta = {
  component: ChecklistStep,
  tags: ["ai-generated"],
  args: {
    scanResults,
    manualFiles: [],
    selected: { "CLAUDE.md": true, "AGENTS.md": true, "DECISIONS.md": true },
    manualPath: "",
    onManualPathChange: fn(),
    onAddManualFile: fn(),
    onToggle: fn(),
    onBack: fn(),
    onFinish: fn(),
    busy: false,
    error: null,
  },
} satisfies Meta<typeof ChecklistStep>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithManualFile: Story = {
  args: {
    manualFiles: ["SKILLS/my-skill.md"],
    selected: { "CLAUDE.md": true, "AGENTS.md": true, "DECISIONS.md": true, "SKILLS/my-skill.md": true },
  },
};

export const Saving: Story = {
  args: { busy: true },
};
