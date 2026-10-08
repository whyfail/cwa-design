// 应用入口引入 @cwa-design/react/styles.css，并将此示例置于 CwaProvider 内。
import { Field, Input } from "@cwa-design/react";

export default function Example() {
  return (
    <Field label="邮箱">
      <Input name="email" type="email" autoComplete="email" placeholder="you@example.com" />
    </Field>
  );
}
