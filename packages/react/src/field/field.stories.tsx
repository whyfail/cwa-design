import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "../input/input";
import { Textarea } from "../textarea/textarea";
import { Field } from "./field";

const meta: Meta<typeof Field> = {
  title: "Components/Field",
  component: Field,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Field>;

export const Basic: Story = {
  name: "Field + Input",
  render: () => (
    <div style={{ width: 320 }}>
      <Field label="显示名称" description="用于工作台中的个人资料">
        <Input name="displayName" defaultValue="CWA Developer" />
      </Field>
    </div>
  ),
};

export const WithError: Story = {
  name: "错误与必填",
  render: () => (
    <div style={{ width: 320 }}>
      <Field label="邮箱" required error="邮箱格式不正确">
        <Input name="email" type="email" defaultValue="not-an-email" />
      </Field>
    </div>
  ),
};

export const TextareaStory: Story = {
  name: "Field + Textarea",
  render: () => (
    <div style={{ width: 320 }}>
      <Field label="简介" description="最多 200 字">
        <Textarea name="bio" rows={3} />
      </Field>
    </div>
  ),
};
