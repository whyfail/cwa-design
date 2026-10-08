// 应用入口引入 @cwa-design/react/styles.css，并将此示例置于 CwaProvider 内。
import { Switch } from "@cwa-design/react";

export default function Example() {
  return (
    <Switch name="notifications" defaultChecked>
      桌面通知
    </Switch>
  );
}
