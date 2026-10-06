// 应用入口引入 @cwa-design/react/styles.css，并将此示例置于 CwaProvider 内。

import { Button, createToastManager, ToastProvider } from "@cwa-design/react";
import { useState } from "react";

export default function Example() {
  const [manager] = useState(() => createToastManager());
  return (
    <ToastProvider toastManager={manager}>
      <Button onClick={() => manager.add({ title: "保存完成", description: "工作区设置已更新。" })}>
        显示通知
      </Button>
    </ToastProvider>
  );
}
