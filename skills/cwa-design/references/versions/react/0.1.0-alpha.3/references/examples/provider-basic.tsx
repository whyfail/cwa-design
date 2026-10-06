// 应用入口引入 @cwa-design/react/styles.css，并将此示例置于 CwaProvider 内。
import { CwaProvider, Text } from "@cwa-design/react";

export default function Example() {
  return (
    <CwaProvider theme="light" material="auto">
      <Text>应用根提供主题、材质与 Portal 上下文。</Text>
    </CwaProvider>
  );
}
