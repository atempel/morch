import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import DisabledArchiveDrawer from "./DisabledArchiveDrawer";

const meta = {
  component: DisabledArchiveDrawer,
  tags: ["ai-generated"],
  args: {
    open: true,
    onToggle: fn(),
    onRestore: fn(),
  },
} satisfies Meta<typeof DisabledArchiveDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: { disabledInstructions: [] },
};

export const WithEntries: Story = {
  args: {
    disabledInstructions: [
      {
        id: "line_1_.morch-disabled/CLAUDE.md",
        file: ".morch-disabled/CLAUDE.md",
        lineNumber: 1,
        content: "Old draft principle, superseded.",
        alias: null,
        enabled: false,
      },
      {
        id: "line_2_.morch-disabled/AGENTS.md",
        file: ".morch-disabled/AGENTS.md",
        lineNumber: 2,
        content: "Legacy handoff note kept for reference only.",
        alias: "legacy-handoff",
        enabled: false,
      },
    ],
  },
};

export const Collapsed: Story = {
  args: {
    open: false,
    disabledInstructions: [
      {
        id: "line_1_.morch-disabled/CLAUDE.md",
        file: ".morch-disabled/CLAUDE.md",
        lineNumber: 1,
        content: "Old draft principle, superseded.",
        alias: null,
        enabled: false,
      },
    ],
  },
};
