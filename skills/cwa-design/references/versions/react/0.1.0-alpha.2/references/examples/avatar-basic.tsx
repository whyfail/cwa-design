// 应用入口引入 @cwa-design/react/styles.css，并将此示例置于 CwaProvider 内。
import { Avatar, Stack } from "@cwa-design/react";

export default function Example() {
  return (
    <Stack direction="row" gap={3}><Avatar fallback="林" size="sm" /><Avatar fallback="陈" /><Avatar fallback="周" size="lg" /></Stack>
  );
}
