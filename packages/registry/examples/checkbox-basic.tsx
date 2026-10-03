// 应用入口引入 @cwa-design/react/styles.css，并将此示例置于 CwaProvider 内。
import { Checkbox } from "@cwa-design/react";

export default function Example() {
  return (
    <Checkbox name="updates" defaultChecked>接收产品更新</Checkbox>
  );
}
