// 应用入口引入 @cwa-design/react/styles.css，并将此示例置于 CwaProvider 内。
import { Tooltip, Button } from "@cwa-design/react";

export default function Example() {
  return (
    <Tooltip content="复制项目链接"><Button variant="secondary">复制链接</Button></Tooltip>
  );
}
