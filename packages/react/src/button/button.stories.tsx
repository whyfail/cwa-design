import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./button";

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    variant: { control: "radio", options: ["primary", "secondary", "ghost", "danger"] },
    size: { control: "radio", options: ["sm", "md", "lg"] },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { variant: "primary", children: "保存设置" },
};

export const Secondary: Story = {
  args: { variant: "secondary", children: "取消" },
};

export const Ghost: Story = {
  args: { variant: "ghost", children: "了解更多" },
};

export const Danger: Story = {
  args: { variant: "danger", children: "删除" },
};

export const Loading: Story = {
  args: { variant: "primary", loading: true, children: "提交中" },
};

export const Disabled: Story = {
  args: { variant: "primary", disabled: true, children: "不可用" },
};
