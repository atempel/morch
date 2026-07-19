import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import WarningCard from "./WarningCard";

const meta = {
  component: WarningCard,
  tags: ["ai-generated"],
  args: {
    onManageAnyway: fn(),
  },
} satisfies Meta<typeof WarningCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    reason: "DECISIONS.md looks like a running log (repeated headings, dates, --- separators) rather than discrete instructions.",
  },
};

export const ShortReason: Story = {
  args: {
    reason: "Ordered list detected.",
  },
};
