import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import BoardView from "./BoardView";
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
      content: "Disabled instructions are archived, not deleted.",
      alias: null,
      enabled: false,
    },
  ],
  "AGENTS.md": [
    { id: "line_1_AGENTS.md", file: "AGENTS.md", lineNumber: 1, content: "Treat each line as a candidate instruction.", alias: null, enabled: true },
  ],
  "DECISIONS.md": [],
};

const flaggedByFile: Record<string, string | null> = {
  "CLAUDE.md": null,
  "AGENTS.md": null,
  "DECISIONS.md": "Log-style file — repeated headings and --- separators detected.",
};

const meta = {
  component: BoardView,
  tags: ["ai-generated"],
  args: {
    files,
    instructionsByFile,
    flaggedByFile,
    managedAnyway: new Set<string>(),
    search: "",
    onIgnoreFile: fn(),
    onAddFile: fn(),
    onManageAnyway: fn(),
    onToggleInstruction: fn(),
    onSetAlias: fn(),
  },
} satisfies Meta<typeof BoardView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithSearchNoMatches: Story = {
  args: { search: "nonexistent-term" },
};
