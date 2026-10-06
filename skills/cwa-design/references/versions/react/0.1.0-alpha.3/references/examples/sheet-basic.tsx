// 应用入口引入 @cwa-design/react/styles.css，并将此示例置于 CwaProvider 内。
import { Button, Sheet, Text } from "@cwa-design/react";

export default function Example() {
  return (
    <Sheet placement="bottom">
      <Sheet.Trigger render={<Button variant="secondary">查看详细信息</Button>} />
      <Sheet.Content>
        <Sheet.Title>工作区详情</Sheet.Title>
        <Sheet.Description>拖动或按关闭按钮返回。</Sheet.Description>
        <Text>一个展开位的底部抽屉；Escape 与关闭按钮提供拖拽替代。</Text>
        <Sheet.Close render={<Button variant="secondary">关闭</Button>} />
      </Sheet.Content>
    </Sheet>
  );
}
