// 应用入口引入 @cwa-design/react/styles.css，并将此示例置于 CwaProvider 内。
import { Button, Popover, PopoverContent, Text } from "@cwa-design/react";

export default function Example() {
  return (
    <Popover>
      <Popover.Trigger render={<Button variant="secondary">查看说明</Button>} />
      <PopoverContent>
        <Popover.Title>共享工作区</Popover.Title>
        <Popover.Description>团队成员可查看项目与设计资源。</Popover.Description>
        <Text variant="caption" tone="muted">
          浮层使用 regular glass；叠在玻璃上时可显式 material="solid"。
        </Text>
        <Popover.Close render={<Button variant="ghost">关闭</Button>} />
      </PopoverContent>
    </Popover>
  );
}
