import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../button/button";
import { Dialog } from "./dialog";

const meta: Meta<typeof Dialog> = {
  title: "Components/Dialog",
  component: Dialog,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Dialog>;

export const Basic: Story = {
  name: "确认对话框",
  render: () => (
    <Dialog>
      <Dialog.Trigger render={<Button variant="primary">打开设置</Button>} />
      <Dialog.Content>
        <Dialog.Title>显示设置</Dialog.Title>
        <Dialog.Description>调整界面外观与动效。更改会立即生效。</Dialog.Description>
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <Dialog.Close render={<Button variant="secondary">取消</Button>} />
          <Dialog.Close render={<Button variant="primary">保存</Button>} />
        </div>
      </Dialog.Content>
    </Dialog>
  ),
};

export const SolidOnGlass: Story = {
  name: "玻璃层上的 solid 浮层",
  parameters: { backgrounds: { default: "photo" } },
  render: () => (
    <Dialog>
      <Dialog.Trigger render={<Button variant="primary">打开确认</Button>} />
      <Dialog.Content material="solid">
        <Dialog.Title>删除项目？</Dialog.Title>
        <Dialog.Description>此操作不可撤销。玻璃内容层之上的浮层使用实色材质。</Dialog.Description>
        <Dialog.Close render={<Button variant="danger">删除</Button>} />
      </Dialog.Content>
    </Dialog>
  ),
};
