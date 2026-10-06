// 应用入口引入 @cwa-design/react/styles.css，并将此示例置于 CwaProvider 内。

import { Alert, Button } from "@cwa-design/react";
import { useState } from "react";

export default function Example() {
  const [acknowledged, setAcknowledged] = useState(false);
  return (
    <Alert
      tone="info"
      title="新版本可用"
      action={
        <Button variant="secondary" onClick={() => setAcknowledged(true)}>
          {acknowledged ? "已了解" : "了解"}
        </Button>
      }
    >
      查看组件文档中的升级说明。
    </Alert>
  );
}
