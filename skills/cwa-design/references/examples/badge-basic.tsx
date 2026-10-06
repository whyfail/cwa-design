// 应用入口引入 @cwa-design/react/styles.css，并将此示例置于 CwaProvider 内。
import { Badge, Stack } from "@cwa-design/react";

export default function Example() {
  return (
    <Stack direction="row" gap={2} wrap>
      <Badge>草稿</Badge>
      <Badge tone="success">已保存</Badge>
      <Badge tone="warning">待处理</Badge>
      <Badge tone="danger" max={99}>
        {120}
      </Badge>
    </Stack>
  );
}
