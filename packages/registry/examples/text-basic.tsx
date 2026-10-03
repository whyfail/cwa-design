// 应用入口引入 @cwa-design/react/styles.css，并将此示例置于 CwaProvider 内。
import { Stack, Text } from "@cwa-design/react";

export default function Example() {
  return (
    <Stack gap={2}><Text as="p">界面让内容更易阅读。</Text><Text variant="caption" tone="muted">辅助说明保留清晰的对比度。</Text></Stack>
  );
}
