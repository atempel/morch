import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import AddFileControl from "./AddFileControl";

const meta = {
  component: AddFileControl,
  tags: ["ai-generated"],
  args: {
    onAdd: fn(),
  },
} satisfies Meta<typeof AddFileControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Sidebar: Story = {
  args: { variant: "sidebar" },
};

export const Board: Story = {
  args: { variant: "board" },
};

export const SidebarOpened: Story = {
  args: { variant: "sidebar" },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: /add file/i }));
    await expect(canvas.getByPlaceholderText("docs/ROADMAP.md")).toBeVisible();
  },
};
