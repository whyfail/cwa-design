// 应用入口引入 @cwa-design/react/styles.css，并将此示例置于 CwaProvider 内。
import { Field, Textarea } from "@cwa-design/react";

export default function Example() {
  return (
    <Field label="项目说明" description="描述团队要完成的工作。">
      <Textarea
        name="description"
        rows={3}
        defaultValue="使用 CWA Design 构建可读、可操作的界面。"
      />
    </Field>
  );
}
