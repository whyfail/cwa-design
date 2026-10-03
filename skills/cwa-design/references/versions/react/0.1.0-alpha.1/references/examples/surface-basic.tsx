// 应用入口引入 @cwa-design/react/styles.css，并将此示例置于 CwaProvider 内。
import { Surface, Text } from "@cwa-design/react";

export default function Example() {
  return (
    <Surface material="glass" style={{ padding: "1.5rem" }}><Text>浮动层的 regular glass 表面</Text></Surface>
  );
}
