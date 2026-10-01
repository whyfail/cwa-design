import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconButton } from "./icon-button";

const meta: Meta<typeof IconButton> = {
  title: "Components/IconButton",
  component: IconButton,
  parameters: { layout: "centered" },
  argTypes: {
    variant: { control: "radio", options: ["primary", "secondary", "ghost", "danger"] },
    size: { control: "radio", options: ["sm", "md", "lg"] },
  },
};

export default meta;
type Story = StoryObj<typeof IconButton>;

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path
        d="M4 4l8 8M12 4l-8 8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export const Secondary: Story = {
  args: { label: "关闭", variant: "secondary", children: <CloseIcon /> },
};

export const Primary: Story = {
  args: { label: "新建", variant: "primary", children: <CloseIcon /> },
};

export const Ghost: Story = {
  args: { label: "更多", variant: "ghost", children: <CloseIcon /> },
};

export const Loading: Story = {
  args: { label: "刷新", loading: true, children: <CloseIcon /> },
};
