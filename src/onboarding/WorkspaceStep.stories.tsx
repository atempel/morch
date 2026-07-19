import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import WorkspaceStep from "./WorkspaceStep";

const meta = {
  component: WorkspaceStep,
  tags: ["ai-generated"],
  args: {
    onChangePath: fn(),
    onBrowse: fn(),
    onContinue: fn(),
  },
} satisfies Meta<typeof WorkspaceStep>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: { workspacePath: "", busy: false, error: null },
};

export const PathChosen: Story = {
  args: { workspacePath: "/Users/example/my-workspace", busy: false, error: null },
};

export const Scanning: Story = {
  args: { workspacePath: "/Users/example/my-workspace", busy: true, error: null },
};

export const WithError: Story = {
  args: { workspacePath: "/not/a/real/path", busy: false, error: "That folder doesn't exist." },
};
