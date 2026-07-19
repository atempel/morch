import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import IgnoredFilesDrawer from "./IgnoredFilesDrawer";

const meta = {
  component: IgnoredFilesDrawer,
  tags: ["ai-generated"],
  args: {
    open: true,
    onToggle: fn(),
    onRestore: fn(),
  },
} satisfies Meta<typeof IgnoredFilesDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: { ignoredFiles: [] },
};

export const WithEntries: Story = {
  args: {
    ignoredFiles: [
      { name: "README.md", path: "README.md", enabled: false },
      { name: "SKILLS/experimental.md", path: "SKILLS/experimental.md", enabled: false },
    ],
  },
  play: async ({ canvas, userEvent, args }) => {
    const restoreButtons = canvas.getAllByText("Restore");
    await userEvent.click(restoreButtons[0]);
    await expect(args.onRestore).toHaveBeenCalledWith("README.md");
  },
};
