// 应用入口引入 @cwa-design/react/styles.css，并将此示例置于 CwaProvider 内。
import { Heading, Stack } from "@cwa-design/react";

export default function Example() {
  return (
    <Stack gap={2}>
      <Heading level={2}>清晰的信息层级</Heading>
      <Heading level={3} visualSize="body">
        语义与视觉尺寸独立
      </Heading>
    </Stack>
  );
}
