// 应用入口引入 @cwa-design/react/styles.css，并将此示例置于 CwaProvider 内。
import { Spinner, Stack, Text } from "@cwa-design/react";

export default function Example() {
  return (
    <Stack direction="row" gap={2} style={{ alignItems: "center" }}>
      <Spinner label="加载中" />
      <Text>正在加载工作区…</Text>
    </Stack>
  );
}
