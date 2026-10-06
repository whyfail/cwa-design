// 应用入口引入 @cwa-design/react/styles.css，并将此示例置于 CwaProvider 内。
import { Field, Input } from "@cwa-design/react";

export default function Example() {
  return (
    <Field label="工作区名称" description="用于成员列表和通知。">
      <Input name="workspace" defaultValue="CWA Studio" />
    </Field>
  );
}
