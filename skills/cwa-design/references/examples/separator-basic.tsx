// 应用入口引入 @cwa-design/react/styles.css，并将此示例置于 CwaProvider 内。
import { Separator, Stack, Text } from "@cwa-design/react";

export default function Example() {
  return (
    <Stack gap={3}><Text>工作区</Text><Separator decorative={false} /><Text>个人设置</Text></Stack>
  );
}
