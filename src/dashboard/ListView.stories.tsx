import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import ListView from "./ListView";
import type { Instruction, ManagedFile } from "../types";

const files: ManagedFile[] = [
  { name: "CLAUDE.md", path: "CLAUDE.md", enabled: true },
  { name: "AGENTS.md", path: "AGENTS.md", enabled: true },
  { name: "DECISIONS.md", path: "DECISIONS.md", enabled: true },
];

const instructionsByFile: Record<string, Instruction[]> = {
  "CLAUDE.md": [
    { id: "line_1_CLAUDE.md", file: "CLAUDE.md", lineNumber: 1, content: "No forced structure.", alias: null, enabled: true },
    {
      id: "line_2_CLAUDE.md",
      file: "CLAUDE.md",
      lineNumber: 2,
      content: "AI must be described as a tool, never a creative entity.",
      alias: "ai-as-tool",
      enabled: true,
    },
    {
      id: "line_3_CLAUDE.md",
      file: "CLAUDE.md",
      lineNumber: 3,
      content: "Disabled instructions are archived, not deleted.",
      alias: null,
      enabled: false,
    },
  ],
  "AGENTS.md": [],
  "DECISIONS.md": [
    { id: "line_1_DECISIONS.md", file: "DECISIONS.md", lineNumber: 1, content: "Framework: Tauri v2 + SQLite.", alias: null, enabled: true },
  ],
};

const flaggedByFile: Record<string, string | null> = {
  "CLAUDE.md": null,
  "AGENTS.md": null,
  "DECISIONS.md": "Log-style file — repeated headings and --- separators detected.",
};

const meta = {
  component: ListView,
  tags: ["ai-generated"],
  args: {
    files,
    instructionsByFile,
    flaggedByFile,
    managedAnyway: new Set<string>(),
    search: "",
    selectedFile: "CLAUDE.md",
    onSelectFile: fn(),
    onIgnoreFile: fn(),
    onAddFile: fn(),
    onManageAnyway: fn(),
    onToggleInstruction: fn(),
    onSetAlias: fn(),
  },
} satisfies Meta<typeof ListView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FlaggedFileSelected: Story = {
  args: { selectedFile: "DECISIONS.md" },
};

export const ManagedAnyway: Story = {
  args: { selectedFile: "DECISIONS.md", managedAnyway: new Set(["DECISIONS.md"]) },
};

export const NoManagedFiles: Story = {
  args: { files: [], instructionsByFile: {}, flaggedByFile: {}, selectedFile: null },
};

export const SearchNoMatches: Story = {
  args: { search: "nonexistent-term" },
};
