import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Alert } from "./alert/alert";
import { Button } from "./button/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from "./dropdown-menu/dropdown-menu";
import { Stack } from "./stack/stack";
import { createToastManager, ToastProvider } from "./toast/toast";

const meta: Meta = {
  title: "Components/Feedback",
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj;

export const Menu: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenu.Trigger render={<Button variant="secondary">操作</Button>} />
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => {}}>重命名</DropdownMenuItem>
        <DropdownMenuItem shortcut="⌘D" onClick={() => {}}>
          复制
        </DropdownMenuItem>
        <DropdownMenuItem disabled>移动（不可用）</DropdownMenuItem>
        <DropdownMenu.Separator />
        <DropdownMenuItem destructive onClick={() => {}}>
          删除
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};

export const Toasts: Story = {
  render: () => {
    const manager = createToastManager();
    return (
      <ToastProvider toastManager={manager}>
        <Button
          variant="primary"
          onClick={() =>
            manager.add({
              title: "已保存设置",
              description: "更改立即生效",
            })
          }
        >
          保存并显示通知
        </Button>
      </ToastProvider>
    );
  },
};

export const Alerts: Story = {
  render: () => {
    const [tone, setTone] = useState<"info" | "success" | "warning" | "danger">("info");
    return (
      <Stack gap={3}>
        <Stack direction="row" gap={3}>
          {(["info", "success", "warning", "danger"] as const).map((t) => (
            <Button
              key={t}
              variant={tone === t ? "primary" : "secondary"}
              onClick={() => setTone(t)}
            >
              {t}
            </Button>
          ))}
        </Stack>
        <Alert tone={tone} title="当前状态示例">
          这是 {tone} 色调的 inline 提示，状态由图标与文本共同传达。
        </Alert>
      </Stack>
    );
  },
};
