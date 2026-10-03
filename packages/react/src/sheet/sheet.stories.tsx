import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../button/button";
import { Sheet } from "./sheet";

const meta: Meta<typeof Sheet> = {
  title: "Components/Sheet",
  component: Sheet,
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof Sheet>;

export const BottomSheet: Story = {
  name: "移动端底部抽屉（单展开位 + 拖动关闭）",
  render: () => (
    <Sheet>
      <Sheet.Trigger render={<Button variant="primary">打开抽屉</Button>} />
      <Sheet.Content>
        <Sheet.Title className="cwa-design-sheet__title">显示设置</Sheet.Title>
        <Sheet.Description>向下拖动或按 Escape 关闭。多 snap points 为后续 API。</Sheet.Description>
        <div style={{ display: "flex", gap: 12 }}>
          <Sheet.Close render={<Button variant="secondary">关闭</Button>} />
          <Sheet.Close render={<Button variant="primary">保存</Button>} />
        </div>
      </Sheet.Content>
    </Sheet>
  ),
};

export const SideSheet: Story = {
  name: "桌面侧滑（end）",
  render: () => (
    <Sheet placement="end">
      <Sheet.Trigger render={<Button variant="secondary">打开侧栏</Button>} />
      <Sheet.Content material="solid">
        <Sheet.Title className="cwa-design-sheet__title">详情侧栏</Sheet.Title>
        <Sheet.Description>桌面端从侧边滑出，Escape 或按钮关闭。</Sheet.Description>
        <Sheet.Close render={<Button variant="secondary">收起</Button>} />
      </Sheet.Content>
    </Sheet>
  ),
};
