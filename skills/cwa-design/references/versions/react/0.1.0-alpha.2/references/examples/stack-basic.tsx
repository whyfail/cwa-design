// 应用入口引入 @cwa-design/react/styles.css，并将此示例置于 CwaProvider 内。
import { Stack, Badge } from "@cwa-design/react";

export default function Example() {
  return (
    <Stack direction="row" gap={3} wrap><Badge>React</Badge><Badge tone="accent">Glass</Badge><Badge>AI</Badge></Stack>
  );
}
